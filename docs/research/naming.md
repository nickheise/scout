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
