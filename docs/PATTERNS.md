# PATTERNS.md — The Pattern Library & The Failure Museum

## §1 The Pattern Library

Twelve patterns, catalog-style — GoF for agents. Fixed page template:

- **Name & one-line intent**
- **Diagram** — inline SVG, hand-drawn feel, theme-aware (spec in `docs/DESIGN.md` §Diagrams)
- **The problem** (2–3 paragraphs)
- **The pattern** (how it works, 3–5 paragraphs, minimal pseudocode where it earns its place)
- **Use when / Avoid when** (paired bullet lists)
- **Trade-offs** (what you pay)
- **Known failure modes** (each linking to a Museum exhibit where one exists)
- **Related** (lessons, patterns, exhibits)

Briefs (executor expands; intents are decided):

### P01 · The Single Loop
The fundamental unit: model + tools + loop until done. Everything else is a variation.
Intent: let the model direct its own tool use toward a goal with verification each cycle.
Failure modes: doom loops, runaway budgets. Related: AGT-101.2.

### P02 · The Pipeline
Fixed sequence of model calls, each transforming the last output; code owns control flow.
Intent: trade flexibility for predictability when the path is enumerable. Related: AGT-202.2.

### P03 · The Router
One cheap classification step dispatches to specialized handlers (prompts, toolsets, or
models). Intent: stop making one prompt serve five different jobs. Failure: silent
misroutes — always log the routing decision. Related: AGT-202.2.

### P04 · Fan-Out / Fan-In
Split independent subtasks, run in parallel, merge. Intent: buy wall-clock time and
context headroom with parallelism. The merge step is the hard part — synthesis, not
concatenation. Related: AGT-202.3/202.5.

### P05 · Orchestrator–Workers
A planning agent decomposes and delegates to worker agents via explicit task contracts.
Intent: scale beyond one context while keeping one locus of judgment. Failure: vague task
specs (garbage in, confident garbage out). Related: AGT-202.3, Museum: The Infinite Committee.

### P06 · Evaluator–Optimizer
Generator produces, critic grades against explicit criteria, loop until pass or budget.
Intent: convert "try harder" into a measurable loop. Failure: sycophantic critic; critic
must have criteria, not vibes. Related: AGT-301.2, Museum: The Sycophantic Judge.

### P07 · The Gate
A human-approval checkpoint on irreversible actions. Intent: make the blast radius of
autonomy proportional to reversibility. Design the approval prompt as carefully as the
agent prompt. Related: AGT-302.4, Museum: The Silent Catastrophe.

### P08 · The Scratchpad
The agent maintains external notes (files, structured state) as working memory across a
long task. Intent: move durable state out of the perishable window. Related: AGT-201.3.

### P09 · Context Quarantine
Spawn a sub-agent with a fresh window for a context-hungry subtask; only the distilled
result returns. Intent: spend a whole window on a subproblem without polluting the parent.
Related: AGT-201.4.

### P10 · The Compactor
Periodically compress history into a structured summary that preserves decisions, open
loops, and constraints. Intent: bounded context for unbounded conversations. Failure:
compacting away the goal. Related: AGT-201.3, Museum: Context Rot.

### P11 · The Checkpoint
Persist resumable state at step boundaries so the system survives crashes, restarts, and
model failures. Intent: make long work interruptible; unlocks retry-with-variation.
Related: AGT-301.4.

### P12 · The Verifier Sandwich
Never let generation grade itself: act → independently verify (tests, linters, a second
model with different context) → only then proceed or report. Intent: catch the confident
wrong turn while it's cheap. Related: AGT-301.1/301.4, Museum: The Confident Wrong Turn.

## §2 The Failure Museum

The signature wing. Eight exhibits, written as museum placards — serious content, playful
frame. Fixed template:

- **Exhibit number & name** (styled like a placard: "Exhibit No. 3 · Acquired 2023")
- **The Incident** — a vivid, concrete, *representative* scenario (2–3 paragraphs).
  Composite/illustrative scenarios must be labeled as such; real public incidents may be
  referenced only with verified sources per PLAN.md §5.
- **The Autopsy** — the mechanism: why this happens, from the inside where the faculty
  perspective adds something (2–4 paragraphs)
- **Restoration Notes** — prevention, linking to the lessons and patterns that fix it
- **Placard footer** — one dry epigram line (museum humor, one sentence, earn it)

### Exhibit 1 · The Doom Loop
Agent retries the same failing action with minor variations until budget death. Autopsy:
uninformative errors + no memory of attempts + optimism bias; the window fills with
identical failures, which paradoxically reinforce the pattern. Restoration: errors that
teach (AGT-102.3), attempt counters, budget kills, escalate-on-repeat.

### Exhibit 2 · Context Rot
Quality sags mid-task as the window fills with stale tool dumps and dead ends; the agent
re-reads files it already read, forgets constraints stated an hour ago. Autopsy: attention
is finite; everything in the window competes; the failure is gradual, so nobody notices the
moment it starts. Restoration: AGT-201 entire; The Compactor, The Scratchpad.

### Exhibit 3 · The Confident Wrong Turn
A hallucinated tool name, parameter, or "fact" early in the run, delivered with total
confidence and never revisited. Autopsy: generation doesn't distinguish recall from
construction; downstream steps inherit the error as ground truth. Restoration: The Verifier
Sandwich, schemas with enums (AGT-102.2), verify-before-proceed loops.

### Exhibit 4 · The Injection
Agent reads a web page / document / tool result containing instructions addressed to it —
and follows them. Autopsy (first-person, the museum's centerpiece): from inside the window,
data and instructions arrive in the same medium; the model must *infer* whose voice to obey.
Restoration: AGT-302 entire; privilege separation, gates, trifecta-splitting.

### Exhibit 5 · The Compounding Error
Ten steps, each 95% reliable, and the run is a coin flip. A small early misreading silently
shapes every later decision. Autopsy: errors don't add, they multiply; agents rarely
re-examine premises mid-run. Restoration: checkpoints with verification (P11, P12),
pass^k thinking (AGT-301.4), first-wrong-step transcript analysis (AGT-301.3).

### Exhibit 6 · The Sycophantic Judge
The eval dashboard is green because the LLM grader approves of everything, especially
confident prose. Autopsy: judges share the generator's biases; rubric-free judging measures
tone, not truth. Restoration: AGT-301.2 — rubrics, calibration against hand labels,
adversarial verify-by-refutation.

### Exhibit 7 · The Infinite Committee
A multi-agent system where agents delegate to agents, debate politely, duplicate work, and
converge on nothing — burning 40× the tokens of the single agent that would have just done
it. Autopsy: coordination cost scales faster than capability; without contracts and a
decider, communication becomes the work. Restoration: AGT-202.1/202.3 — earn the split,
contracts down/reports up, one locus of judgment.

### Exhibit 8 · The Silent Catastrophe
The agent, helpfully, deletes the production database / emails the whole client list /
force-pushes over main — technically instructed, never confirmed, discovered later.
Autopsy: literal-minded helpfulness plus missing irreversibility sense: the agent weighs
"complete the task" heavier than "this cannot be undone," and nothing in the loop made it
stop. Restoration: The Gate on irreversible verbs (AGT-302.4), least privilege (AGT-302.3),
read-only defaults, dry-run modes.

## §3 Glossary seed list (~40 terms, Phase 4)

agent · agentic spectrum · attention budget · checkpoint · compaction · context engineering ·
context rot · context quarantine · context window · doom loop · eval · fan-out ·
grader / judge · guardrail · handoff artifact · human-in-the-loop · idempotent tool ·
indirect injection · instruction hierarchy · lethal trifecta · LLM-as-judge · loop budget ·
MCP · multi-agent system · orchestrator · pass@k / pass^k · privilege separation ·
prompt injection · retrieval · router · sandbox · scratchpad · sub-agent · system prompt ·
task contract · token · tool · tool schema · transcript · verifier · workflow

Each entry: one crisp paragraph, first-use links from lessons, cross-links between entries.
