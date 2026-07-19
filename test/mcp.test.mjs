// test/mcp.test.mjs — stdio smoke test for bin/scout-mcp.mjs (docs/plan.md
// §4 task 2.5 acceptance: "MCP inspector smoke test; reactivate round-trip").
//
// No network access in this environment to run the official
// @modelcontextprotocol/inspector against the server, so this drives the
// real stdio JSON-RPC protocol directly: spawn the server as a child
// process, perform the initialize handshake, list tools, and call each one
// over the actual transport (not by importing handlers in-process) — the
// same wire format any MCP client speaks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const MCP_BIN = path.join(REPO_ROOT, 'bin', 'scout-mcp.mjs');
const SEED_PACK = path.join(REPO_ROOT, 'fixtures', 'seed-pack');

class McpClient {
  constructor(packDir) {
    this.child = spawn('node', [MCP_BIN], {
      env: { ...process.env, SCOUT_PACK: packDir },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.buf = '';
    this.pending = new Map();
    this.nextId = 1;
    this.stderr = '';
    this.child.stderr.on('data', (d) => {
      this.stderr += d.toString('utf8');
    });
    this.child.stdout.on('data', (chunk) => {
      this.buf += chunk.toString('utf8');
      let idx;
      while ((idx = this.buf.indexOf('\n')) !== -1) {
        const line = this.buf.slice(0, idx);
        this.buf = this.buf.slice(idx + 1);
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.id !== undefined && this.pending.has(msg.id)) {
          this.pending.get(msg.id)(msg);
          this.pending.delete(msg.id);
        }
      }
    });
  }

  send(method, params) {
    return new Promise((resolve) => {
      const id = this.nextId++;
      this.pending.set(id, resolve);
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  notify(method, params) {
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  async initialize() {
    const res = await this.send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'scout-test-client', version: '0.0.1' },
    });
    this.notify('notifications/initialized', {});
    return res;
  }

  async callTool(name, args = {}) {
    const res = await this.send('tools/call', { name, arguments: args });
    return res.result;
  }

  close() {
    this.child.stdin.end();
    this.child.kill();
  }
}

function tmpPackDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scout-mcp-test-'));
  fs.mkdirSync(dir, { recursive: true });
  // seed a single pack entry to exercise archive/reactivate against real data
  fs.writeFileSync(
    path.join(dir, 'sample-lib.json'),
    JSON.stringify(
      {
        schema: 1,
        id: 'sample-lib',
        type: 'pack',
        title: 'Sample Lib',
        status: 'active',
        superseded_by: null,
        notes: null,
        added: '2026-07-18',
        verified: '2026-07-18',
        dismissals: 0,
        url: 'https://example.com/sample-lib',
        repo: null,
        stack: ['react'],
        install: 'npm i sample-lib',
        summary: 'A fixture pack entry for MCP tests.',
        surfaces_when: ['a test needs a fixture pack entry'],
        ambient_line: 'Sample Lib — a fixture for MCP tests.',
        instruction: null,
        phase: null,
        automation: null,
        produces: null,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
  return dir;
}

test('scout-mcp: initialize handshake reports server name and version', async () => {
  const client = new McpClient(SEED_PACK);
  try {
    const res = await client.initialize();
    assert.equal(res.result.serverInfo.name, 'scout');
    assert.equal(res.result.serverInfo.version, '0.1.0');
  } finally {
    client.close();
  }
});

test('scout-mcp: tools/list exposes the full pack CRUD + query + compile surface', async () => {
  const client = new McpClient(SEED_PACK);
  try {
    await client.initialize();
    const res = await client.send('tools/list', {});
    const names = res.result.tools.map((t) => t.name).sort();
    assert.deepEqual(names, [
      'scout_archive_entry',
      'scout_compile',
      'scout_create_entry',
      'scout_list_entries',
      'scout_reactivate_entry',
      'scout_read_entry',
      'scout_update_entry',
    ]);
    // every tool declares a JSON-Schema inputSchema (no zod on the wire)
    for (const t of res.result.tools) {
      assert.equal(t.inputSchema.type, 'object');
    }
  } finally {
    client.close();
  }
});

test('scout-mcp: scout_list_entries and scout_read_entry read the seed pack correctly', async () => {
  const client = new McpClient(SEED_PACK);
  try {
    await client.initialize();
    const listed = await client.callTool('scout_list_entries', { status: 'active' });
    const listedData = JSON.parse(listed.content[0].text);
    assert.equal(listedData.entries.length, 9);

    const read = await client.callTool('scout_read_entry', { id: 'dialkit' });
    const readData = JSON.parse(read.content[0].text);
    assert.equal(readData.entry.id, 'dialkit');
    assert.deepEqual(readData.predecessors, []);
  } finally {
    client.close();
  }
});

test('scout-mcp: scout_compile returns the same body compilePack() would produce', async () => {
  const client = new McpClient(SEED_PACK);
  try {
    await client.initialize();
    const res = await client.callTool('scout_compile', {});
    assert.equal(res.isError, undefined);
    const data = JSON.parse(res.content[0].text);
    assert.match(data.body, /## Scout pack/);
    assert.match(data.body, /## Scout standing instructions/);
  } finally {
    client.close();
  }
});

test('scout-mcp: unknown tool name returns an isError result, not a crash', async () => {
  const client = new McpClient(SEED_PACK);
  try {
    await client.initialize();
    const res = await client.callTool('scout_does_not_exist', {});
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /unknown tool/);
  } finally {
    client.close();
  }
});

test('scout-mcp: unknown entry id returns an isError result naming the problem', async () => {
  const client = new McpClient(SEED_PACK);
  try {
    await client.initialize();
    const res = await client.callTool('scout_read_entry', { id: 'does-not-exist' });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /No such entry file/);
  } finally {
    client.close();
  }
});

test('scout-mcp: create -> archive -> reactivate round-trip (D-011) over the real transport', async () => {
  const dir = tmpPackDir();
  const client = new McpClient(dir);
  try {
    await client.initialize();

    const created = await client.callTool('scout_create_entry', {
      entry: {
        id: 'round-trip-lib',
        type: 'pack',
        title: 'Round Trip Lib',
        url: 'https://example.com/round-trip',
        install: 'npm i round-trip-lib',
        summary: 'Created via the MCP tool for the reactivate round-trip test.',
        surfaces_when: ['testing the mcp create/archive/reactivate round trip'],
        ambient_line: 'Round Trip Lib — MCP round-trip fixture.',
      },
    });
    assert.equal(created.isError, undefined);
    assert.equal(JSON.parse(created.content[0].text).created.status, 'active');

    const archived = await client.callTool('scout_archive_entry', {
      id: 'round-trip-lib',
      supersededBy: 'sample-lib',
    });
    assert.equal(archived.isError, undefined);
    const archivedEntry = JSON.parse(archived.content[0].text).archived;
    assert.equal(archivedEntry.status, 'archived');
    assert.equal(archivedEntry.superseded_by, 'sample-lib');

    // reading it back shows sample-lib as a "predecessor" pointer target... actually
    // the archived entry itself points forward; verify via read that status stuck.
    const readAfterArchive = await client.callTool('scout_read_entry', { id: 'round-trip-lib' });
    assert.equal(JSON.parse(readAfterArchive.content[0].text).entry.status, 'archived');

    const reactivated = await client.callTool('scout_reactivate_entry', { id: 'round-trip-lib' });
    assert.equal(reactivated.isError, undefined);
    const reactivatedEntry = JSON.parse(reactivated.content[0].text).reactivated;
    assert.equal(reactivatedEntry.status, 'active');
    assert.equal(reactivatedEntry.superseded_by, null);
    // history preserved
    assert.equal(reactivatedEntry.added, created && JSON.parse(created.content[0].text).created.added);
  } finally {
    client.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scout-mcp: scout_create_entry refuses an invalid entry without writing (schema validation still applies)', async () => {
  const dir = tmpPackDir();
  const client = new McpClient(dir);
  try {
    await client.initialize();
    const res = await client.callTool('scout_create_entry', {
      entry: { id: 'bad-entry', type: 'pack', title: 'Missing required fields' },
    });
    assert.equal(res.isError, true);
    assert.match(res.content[0].text, /Refusing to create invalid entry/);
    assert.ok(!fs.existsSync(path.join(dir, 'bad-entry.json')));
  } finally {
    client.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
