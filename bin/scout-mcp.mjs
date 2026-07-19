#!/usr/bin/env node
// scout-mcp.mjs — bundled stdio MCP server (docs/plan.md §2 task 2.5, PRD
// §5.6/§7.2, DECISIONS.md D-011).
//
// Division of labor per docs/research/claude-code-platform.md: skills are
// orchestration/choreography (fetch, draft, confirm, write); this server is
// durable pack CRUD + query for natural-language access — the surface a
// non-slash-command agent (or a natural-language request like "reactivate
// dialkit in my scout pack", D-011's courier pattern) uses to touch the pack.
// It performs no ingestion analysis of its own — drafting is the skills'
// job; this server only ever writes what it's handed, and only entries
// that already pass schema validation (scout-store.mjs enforces that, not
// this file).
//
// This is the ONE file in the repo allowed a non-stdlib dependency
// (docs/plan.md §1.2, DECISIONS.md): @modelcontextprotocol/sdk. We
// deliberately use the SDK's low-level `Server` + raw JSON-Schema tool
// definitions rather than the high-level `McpServer.registerTool()`, which
// requires actual zod schema objects for input validation — adding zod as a
// second dependency to satisfy that would break the "single documented
// exception" rule. The low-level API's own request-envelope validation
// (tools/call, tools/list) is schema objects the SDK already exports; our
// per-tool `inputSchema` is plain JSON Schema on the wire, same as any MCP
// tool description, and needs no zod to define or to hand-check here.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  resolvePackDir,
  listEntries,
  readEntry,
  createEntry,
  updateEntry,
  archiveEntry,
  reactivateEntry,
  StoreError,
} from './scout-store.mjs';
import { compilePack } from './scout-compile.mjs';

const packDir = resolvePackDir({});

// ---------------------------------------------------------------------------
// Tool definitions — plain JSON Schema, no zod.
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'scout_list_entries',
    description:
      "List entries in the user's Scout pack, optionally filtered by type and/or status. Read-only. Default (no filters) returns every entry, active and archived, of both types.",
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['pack', 'step'], description: 'Restrict to this entry type.' },
        status: { type: 'string', enum: ['active', 'archived'], description: 'Restrict to this status.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'scout_read_entry',
    description:
      "Read one entry by id, with its full provenance: the entry itself, plus any other entries that name it as their superseded_by (predecessors) so supersession chains are visible in both directions. Read-only.",
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'The entry id (kebab-case slug).' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'scout_compile',
    description:
      'Compile the active pack into the manifest (ambient_line of every active pack entry) and the standing-instructions block (ongoing + milestone step instructions) — the same two artifacts /scout:start injects into CLAUDE.md/AGENTS.md. Read-only; does not write anything. Fails with an explanation if the manifest exceeds its cap.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'scout_create_entry',
    description:
      "Commit a fully-formed pack or step entry to the store. This tool performs NO analysis, drafting, or confirmation of its own — that is the /scout:add skill's job. Only call this with an entry the user has already reviewed and approved in this conversation; never draft-and-commit in one step. Refuses (without writing) if the entry fails schema validation or its id already exists.",
    inputSchema: {
      type: 'object',
      properties: {
        entry: {
          type: 'object',
          description:
            'The full entry object per schema/entry.v1.json: id, type ("pack"|"step"), title, plus the pack-only fields (url, install, summary, surfaces_when, ambient_line, stack?, repo?) or step-only fields (instruction, phase, produces?, automation?) that entry type requires. schema/status/added/verified/dismissals/superseded_by/notes are filled in with their documented defaults if omitted.',
        },
      },
      required: ['entry'],
      additionalProperties: false,
    },
  },
  {
    name: 'scout_update_entry',
    description:
      'Apply a patch (merge) to an existing entry by id. Unknown/unspecified fields are preserved untouched. Refuses (without writing) if the merged result fails schema validation.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        patch: { type: 'object', description: 'Fields to merge onto the existing entry.' },
      },
      required: ['id', 'patch'],
      additionalProperties: false,
    },
  },
  {
    name: 'scout_archive_entry',
    description:
      'Archive an entry: sets status to "archived" and, optionally, superseded_by to point at what replaced it. Every other field (history, dismissals, notes) is preserved untouched. Only call this after the user has explicitly confirmed which entry to archive — this tool does not ask for confirmation itself.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        supersededBy: { type: 'string', description: 'Optional id of the successor entry.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'scout_reactivate_entry',
    description:
      'Reactivate an archived entry: sets status back to "active" and clears superseded_by. This is the D-011 courier-pattern reactivation path — the browse page is read-only and can never write the pack itself, so "reactivate" there yields a natural-language instruction the user pastes into their agent, which calls this tool. All history (added, verified, dismissals, notes) is preserved untouched.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function textResult(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text }] };
}

function errorResult(err) {
  const message = err instanceof StoreError ? err.message : (err && err.message) || String(err);
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

function findPredecessors(id) {
  const { entries } = listEntries(packDir, {});
  return entries.filter((e) => e.superseded_by === id).map((e) => ({ id: e.id, title: e.title }));
}

const HANDLERS = {
  scout_list_entries: async (args) => {
    const { entries, warnings } = listEntries(packDir, { type: args.type, status: args.status });
    return textResult({ entries, warnings });
  },

  scout_read_entry: async (args) => {
    const entry = readEntry(packDir, args.id);
    const predecessors = findPredecessors(args.id);
    return textResult({ entry, predecessors });
  },

  scout_compile: async () => {
    const result = compilePack(packDir);
    if (result.overCap) {
      return errorResult(
        new Error(
          `manifest exceeds cap: ${result.packCount} active pack entries but only ${result.cap} allowed. ` +
            `Archive or demote some first. Over-cap entries: ${result.overflowIds.join(', ')}`
        )
      );
    }
    return textResult(result);
  },

  scout_create_entry: async (args) => {
    const entry = createEntry(packDir, args.entry);
    return textResult({ created: entry });
  },

  scout_update_entry: async (args) => {
    const entry = updateEntry(packDir, args.id, args.patch);
    return textResult({ updated: entry });
  },

  scout_archive_entry: async (args) => {
    const entry = archiveEntry(packDir, args.id, { supersededBy: args.supersededBy });
    return textResult({ archived: entry });
  },

  scout_reactivate_entry: async (args) => {
    const entry = reactivateEntry(packDir, args.id);
    return textResult({ reactivated: entry });
  },
};

// ---------------------------------------------------------------------------
// Server wiring
// ---------------------------------------------------------------------------

export function createServer() {
  const server = new Server(
    { name: 'scout', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const handler = HANDLERS[name];
    if (!handler) {
      return errorResult(new Error(`unknown tool "${name}"`));
    }
    try {
      return await handler(args);
    } catch (err) {
      return errorResult(err);
    }
  });

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run the transport when executed directly (not when imported by tests).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error('scout-mcp: fatal error:', err);
    process.exit(1);
  });
}
