import { NotebookPen } from "lucide-react";
import { SectionHeading, SectionShell } from "@/components/blocks";

/**
 * TasteLoop — field notes as a user-facing feature, and the compounding
 * argument that closes the product story.
 *
 * Lexicon note (the delineation Nick asked to make explicit): **field
 * notes** and **the field guide** are different things and this site now
 * uses both, deliberately, in the only senses they carry:
 *
 *   - *field notes* (DECISIONS.md D-018) — what Scout writes down when a
 *     run deviates: a documented step failed, the environment fell outside
 *     the docs, or the user corrected it mid-run. Local-only, one per run,
 *     never transmitted, and stored outside the pack dir precisely so a
 *     Tier 1 synced pack can never carry them to a remote.
 *   - *the field guide* (D-021) — the compiled layer handed to a project.
 *     See FieldGuide.tsx.
 *
 * D-023's taste loop is what connects them, and is why field notes are
 * worth surfacing to users at all rather than staying maintainer-only:
 * a wrap-phase step reads the session's corrections and *proposes* rubric
 * updates, which the user ratifies through the normal `/scout:add`
 * confirm-before-commit gate. Write-deliberate, per tenet 7 — so the copy
 * below must never imply Scout edits your standards on its own.
 *
 * Per Nick's 2026-07-28 call this is written in present tense ahead of the
 * plugin; the production gate is recorded in site/DECISIONS.md D-020.
 */

export function TasteLoop() {
  return (
    <SectionShell id="taste-loop" tone="default" labelledBy="taste-loop-title">
      <div className="max-w-2xl">
        <SectionHeading
          id="taste-loop-title"
          eyebrow="Field notes"
          title="It gets more like you, not less."
        />

        <div className="mt-8 space-y-6">
          <p className="text-lg leading-relaxed text-tone-fg">
            Every project teaches you something about how you want things
            built. Almost none of it survives the project.
          </p>

          <p className="text-base leading-relaxed text-tone-fg">
            When Scout gets something wrong — a step misfires, or you correct
            it mid-run — it writes a field note. One line, on your machine,
            never sent anywhere. On its own that&rsquo;s just a log.
          </p>

          <p className="text-base leading-relaxed text-tone-fg">
            What makes it a loop is what happens at the end. When a project
            wraps, Scout reads the corrections back and proposes updates to
            your standards: a rubric line to add, one to change, one
            you&rsquo;ve outgrown. You approve each one, the same way you
            approve every entry — Scout never edits your taste on its own.
          </p>

          <div className="flex items-start gap-3 rounded-panel border border-tone-border bg-tone-surface p-5">
            <NotebookPen
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-6 shrink-0 translate-y-0.5 text-tone-accent"
            />
            <p className="text-base leading-relaxed text-tone-fg">
              Field notes never leave your machine. They live outside the pack
              folder on purpose, so even a pack that syncs to a git remote
              can&rsquo;t carry them along.
            </p>
          </div>

          <p className="text-base leading-relaxed text-tone-fg">
            Do that a few projects running and the field guide stops being
            something you wrote once. It becomes the accumulated version of
            how you actually work — which is the thing that normally resets to
            zero every time you open a new repo.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

export default TasteLoop;
