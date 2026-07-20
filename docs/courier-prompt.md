# The courier prompt

Scout never reads your claude.ai chat history — it structurally can't, and
it shouldn't: that history lives on a different service, under a different
consent boundary, and reaching across it automatically would turn Scout
into exactly the kind of silent-recall system it exists to avoid. Instead,
below is a prompt *you* run yourself, in your own chat session, that reads
your tracks and surfaces only the tooling that kept reappearing — never an
assessment of you, never the content of your work. You read the output
privately, on your own screen, before anything crosses anywhere. Carrying
the result into Scout by hand — pasting only the lines you choose — is what
makes that crossing informed consent instead of a checkbox: the boundary
gets crossed by your own hands, or not at all.

## The prompt

Copy everything in the block below and paste it into a claude.ai chat
session that has access to your conversation history.

```
Look back across my conversation history on this account and find tools,
libraries, frameworks, CLI utilities, or working practices that come up
repeatedly — things I've reached for, recommended, or spoken favorably
about in more than one separate conversation.

Strict scope — follow exactly:
- Only name the tool/library/practice itself and, in one clause, what it
  is or does.
- Do not summarize, quote, or describe the subject matter, project, or
  content of any conversation.
- Do not comment on my working style, personality, skill level, or habits
  as a person — this is an inventory of tooling, not an assessment of me.
- Exclude anything that appears in only a single conversation; I only want
  things that recur.
- Exclude anything that looks confidential, proprietary, or tied to a
  specific employer or client's internal systems.

Output format:
- One line per candidate, ranked by how often it recurs, most frequent
  first.
- Each line: `<name> — <what it is, one clause> (~N conversations)`
- No more than 7 lines total.
- If nothing clearly recurs, say so plainly in one sentence instead of
  padding the list with thin candidates.
```

## What to do with the output

Read the list privately — nothing has moved yet, it's just text on your
own screen. Carry only the lines that still ring true into Scout, either by
pasting them during `/scout:setup`'s history-scan step or as separate
`/scout:add <text>` entries; every one of them still goes through the
normal draft-then-confirm gate before it lands in your pack.
