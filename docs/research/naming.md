# Naming availability — verified 2026-07-18 · Decision: D-007

**Decision (D-007):** repo `<owner>/scout`, plugin name `scout`, distributed
via this repo as its own marketplace; target Anthropic's official directory
(slug free there); skip the community marketplace (a `scout` plugin exists).
npm/domain if ever needed: `scoutcc` / scoutcc.dev or getscout.dev.

## Hard collisions (avoid)

- Plugin `scout` in anthropics/claude-plugins-community — taken
  (shidoyu/scout, web-search plugin). Official directory: free.
- npm `scout` (2011, abandoned), `scout-cli` (2018), `scoutkit` (AI-agent
  product), and **`claude-scout`** — active (v0.3.0, May 2026), generates
  .claude/ config, i.e. our exact niche. Multiple `claude-scout` repos exist.
- `scout-cli` also collides with Docker Scout (docker/scout-cli — container
  SBOM/vuln CLI).
- github.com/scout — squatted personal account (2018, inactive).
  github.com/scoutapp — Scout APM (active). scout.dev — live monitoring
  product. scout.sh — registered, parked.
- Adjacent brands: ScoutQA (scoutqa.ai, runs its own CC marketplace),
  firecrawl/open-scouts (1.3k★, "AI scouts"), nccgroup/ScoutSuite,
  laravel/scout.

## Verified available (as of 2026-07-18)

npm: `scoutcc`, `scout-pack`, `hey-scout`, `scout-for-agents`,
`claude-code-scout`, `scout-agent`, `getscout`.
GitHub orgs: scout-pack, scoutpack, scout-for-agents, scoutkit, get-scout.
Domains: scoutcc.dev, scoutpack.dev, heyscout.dev, getscout.dev.
`scoutcc` returns **zero** GitHub repos — cleanest fallback identity.

Unverified: npm user/org "scout" claimability (npmjs.com blocks anonymous
lookups); scout.sh ownership; scoutforagents.dev.

## "Recon" alternative — evaluated and declined (2026-07-19)

Nick floated "Recon" as a rename; the marketing thread evaluated it and
recommended staying with Scout (relayed here at Nick's request, for the
record next to D-007):

1. **Register clash.** Recon is military register; Scout is
   expedition/field-guide. The marketing direction (paper/cream warmth, topo
   lines, waypoint stamps, expedition patches) hangs off the scouting
   register; Recon's natural visual language is the tactical/dark default
   dev-tool aesthetic the brand positions against.
2. **Semantic mismatch.** Recon implies the tool actively investigates; the
   product carries what the user packed and hands it back at the right
   moment. "A pack your agent carries" has no Recon equivalent, and "pack"
   is scouting-native. (Concessions: "recon report" reads naturally; recon
   loosely fits the setup history scan.)
3. **Worse collisions.** Recon is a security-tooling term of art (pentest
   recon phase, recon-ng, OSINT tools) — heavier, more off-brand mindshare
   than Scout's collisions, plus a surveillance connotation that sits badly
   next to the courier-pattern privacy story. Availability (2026-07-18
   checks): recon.dev/getrecon.dev/userecon.dev registered; orgs recon,
   reconpack, getrecon taken; npm recon, recon-cli taken. Free: recon.sh,
   reconpack.dev, org recon-pack, npm claude-recon — the same
   compound-shaped leftovers Scout has, with none of the brand upside.

Net: Scout's collision anxiety is already solved by the "Scout for agents /
for Claude Code" qualifier + a self-disambiguating domain; renaming trades a
solved problem for a register problem and a worse collision profile.

**Domain decision (scoutpack.dev — marketing's standing rec — vs.
getscout.dev) remains open with Nick.**
