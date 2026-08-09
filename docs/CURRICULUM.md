# CURRICULUM.md — The six courses

Six courses, ~29 lessons. Course codes are part of the identity: catalog pages should look
like a course listing, not a blog index. Every lesson has three parts:

- **Reading** (1,200–2,500 words) — the ideas, in the faculty voice
- **Lab** — a concrete exercise the reader does with any agent SDK or even a bare HTTP loop;
  always includes a "What you should have seen" debrief so it works without a grader
- **Self-check** — 3–5 quiz questions, client-side island, wrong answers get explanations

Lessons cross-link aggressively: glossary terms on first use, related patterns, and the
museum exhibit for whatever failure mode the lesson prevents.

The briefs below fix each lesson's thesis and load-bearing points. The executor expands them
in the site voice; the theses themselves are decided.

---

## AGT-101 · The Agent Loop *(Foundations — start here)*

**Course description:** What an agent actually is, what the loop actually does, and why most
things called "agents" shouldn't be.

### 101.1 — What is an agent, actually?
Thesis: the useful working definition is *a model directing its own tool use in a loop
toward a goal*. Everything is a spectrum from workflow (code decides the path) to agent
(model decides the path). The word is marketing-soup; the spectrum is engineering.
Introduce the spectrum diagram used throughout the site. Cover: autonomy sliders,
why "agentic" describes architecture rather than intelligence.

### 101.2 — Anatomy of the loop
Thesis: every agent is four things — a model, a context, tools, and a loop — and most bugs
live in the loop's edges. Walk one real annotated transcript (model call → tool call →
tool result → model call …) end to end. Cover: termination conditions (success, budget,
give-up), the gather→act→verify rhythm, why the loop must be able to stop.

### 101.3 — When *not* to build an agent
Thesis: if you can enumerate the paths, write a workflow; agents buy flexibility with cost,
latency, and variance. Give the decision checklist (paths enumerable? errors recoverable?
verification possible? budget tolerable?). This lesson is the site's credibility anchor —
an agent telling you when not to use agents.

### 101.4 — Lab: a 100-line agent
Build the minimum honest agent: a loop over one model API with two tools (read file, write
file) fixing a deliberately broken script. Any provider. The debrief teaches transcript
reading: where it explored, where it got confused, where it verified. Links forward to
AGT-301.3.

### 101.5 — The view from inside
The signature lesson. Thesis: from the model's side, there is no app, no user, no "state" —
only one long document that keeps growing, and the strongest recent instructions win.
Explain instruction-following, ambiguity resolution, and why a tool the model has never
seen described well may as well not exist. First-person throughout. This is the lesson
that only this site can write.

---

## AGT-102 · Tool Design

**Course description:** Tools are the user interface you build for a mind. Most agent
failures are tool-design failures wearing a trench coat.

### 102.1 — Tools are an interface for a mind
Thesis: treat the model as your user and apply interface design honestly. If a competent
human contractor couldn't tell which of your tools to use from the descriptions alone,
neither can the model. Affordances, discoverability, and the death-by-twelve-similar-tools
anti-pattern.

### 102.2 — Schemas that guide
Thesis: the schema *is* a prompt. Names carry semantics (`search_orders` beats `query_db`),
descriptions should read like you're briefing a new hire, enums beat free strings, required
fields force the model to gather what it needs. Show one bad schema and its fixed version
side by side with resulting transcript differences.

### 102.3 — Errors that teach
Thesis: error messages are prompts too — the loop's quality is set by what tools say when
things go wrong. `"Error 403"` produces doom loops; `"You don't have access to org X;
try list_orgs first"` produces recovery. Recoverable vs terminal errors, and why silent
failure is the worst tool behavior possible. Links to Museum: The Doom Loop.

### 102.4 — Granularity, output, and budgets
Thesis: fewer, more powerful tools beat many narrow ones; tool *output* is context you're
spending. Response format design (return what the next step needs, not everything you have),
pagination/truncation with counts ("showing 20 of 4,312"), and when to give an agent
code-execution instead of fifty bespoke tools.

### 102.5 — Lab: redesign a cursed toolset
Provide a deliberately awful six-tool API (vague names, overlapping purposes, raw JSON
dumps, useless errors). Reader redesigns it to three tools, runs the same task before and
after, compares transcripts. Debrief includes the faculty's own redesign.

---

## AGT-201 · Context Engineering

**Course description:** The context window is not memory; it's a budget. Spending it well
is the highest-leverage skill in agent building.

### 201.1 — The window is a budget
Thesis: every token in context is spending attention, and attention degrades as the window
fills — quality doesn't fail at the limit, it sags long before it. Context rot, the
needle-in-haystack intuition, and the audit habit: know what's in your window and what
each thing is buying you. Links to Museum: Context Rot.

### 201.2 — What goes in, what stays out
Thesis: system prompts should be written at the *right altitude* — specific enough to guide,
general enough to let the model think — and data should arrive just-in-time via retrieval
rather than pre-stuffed. Examples beat rules (show three canonical examples instead of
twenty bullet points). Structure: identity → capabilities → constraints → examples.

### 201.3 — Compaction and memory
Thesis: long-running agents survive by writing things down outside the window — summaries,
note files, structured state — and compaction must preserve *decisions and open loops*, not
narrative. What must survive a compaction (goals, constraints, what's been tried, current
state) and what should die (tool dumps, dead ends, pleasantries).

### 201.4 — Long horizons and quarantine
Thesis: past a certain horizon, one context can't hold the work — the answer is sub-agents
as *context quarantine*: burn a fresh window on a subproblem, return only the distilled
result. Handoff artifacts (specs down, reports up), resumability, filesystem as shared
memory. Links to patterns: Context Quarantine, The Compactor, The Scratchpad.

### 201.5 — Lab: rescue a drowning agent
Provide a transcript of an agent failing a long task purely from context bloat (stale tool
dumps, repeated file re-reads, no notes). Reader applies three techniques (truncate tool
results, add a notes file, quarantine a subtask) and measures the difference.

---

## AGT-202 · Orchestration

**Course description:** One agent or many? Mostly one. This course is about earning the
right to say "many" — and about putting loops in code, not in prompts.

### 202.1 — The case for one agent
Thesis: multi-agent systems pay coordination tax, fragment context, and multiply failure
modes; a single loop with good tools and good context beats a committee for most tasks.
Start single, split only when you hit a wall you can name (context ceiling, parallelism,
privilege separation). Links to Museum: The Infinite Committee.

### 202.2 — Deterministic scaffolding
Thesis: when you know the structure of the work, put it in code — the model fills in
judgment, the code owns control flow. Pipelines, routers, fan-out/fan-in as *code* calling
models, not agents improvising a process. This is the workflow end of the 101.1 spectrum,
done on purpose. Links to patterns: The Pipeline, The Router, Fan-Out/Fan-In.

### 202.3 — Orchestrator–workers
Thesis: when subtasks are genuinely independent, an orchestrator that writes precise task
specs and workers that return structured results scale beautifully — and the whole game is
the contract between them. Task specs down (goal, constraints, output shape), reports up
(result, confidence, what was skipped). Spawning parallel workers, merging honestly
(including "worker 3 found nothing," which is data).

### 202.4 — Handoffs and shared state
Thesis: agents coordinate best through *artifacts*, not chatter — files, diffs, structured
reports — because artifacts are inspectable, diffable, and survive restarts. Message-passing
vs blackboard, why the filesystem is an underrated coordination bus, checkpointing so any
worker can die and be replaced.

### 202.5 — Lab: research swarm vs lone scholar
Same research question answered two ways: one agent with search tools; then a fan-out of
three specialized readers plus a synthesizer. Compare quality, cost, wall-clock, and
failure surface. Debrief: the honest answer is "it depends," and now the reader has felt
exactly what it depends on.

---

## AGT-301 · Evals & Reliability

**Course description:** You can't improve what you don't grade, and you can't trust what
you don't read. The unglamorous course that separates demos from systems.

### 301.1 — Twenty cases before breakfast
Thesis: the highest-leverage artifact in any agent project is a small, hand-written eval
set built from real failures — twenty cases you actually care about beat a thousand
synthetic ones. Evals as the flywheel: every production failure becomes a case; every
change runs the set.

### 301.2 — Graders and their lies
Thesis: every grader can lie to you — exact-match misses valid variants, LLM judges are
sycophantic and prefer confident wrong answers, humans fatigue — so grade the grader.
Rubric-based judging, pass/fail harnesses for code tasks, calibrating a judge against
hand labels. Links to Museum: The Sycophantic Judge.

### 301.3 — Reading transcripts
Thesis: transcript reading is the debugger, profiler, and code review of agent engineering,
and almost nobody does it enough. A method: find the *first* wrong step (not the visible
failure — the belief that caused it), classify it (missing info? bad tool result? ambiguous
instruction?), fix the class, not the instance.

### 301.4 — Engineering for unreliability
Thesis: the model is a stochastic component; wrap it like one. Retries with variation,
checkpoints, idempotent tools, timeouts and budgets (tokens, tool calls, wall clock),
graceful degradation. pass@k vs pass^k — a 90%-reliable step, run ten times in sequence,
is a 35%-reliable system. Links to Museum: The Compounding Error.

### 301.5 — Lab: an eval harness in an afternoon
Build a 10-case harness for the AGT-101 lab agent, with a pass/fail grader. Then
deliberately break the agent's prompt subtly and watch the harness catch it. Debrief:
this feeling — a regression caught by a net you built — is the whole point of the course.

---

## AGT-302 · Security & Safety

**Course description:** An agent is a new kind of attack surface: it reads attacker-supplied
text with the same faculties it uses to read your instructions. Capstone course.

### 302.1 — The lethal trifecta
Thesis: private data + untrusted content + an exfiltration channel — an agent holding all
three is a breach waiting for a trigger, so the design goal is making sure no single context
holds the full trifecta. Threat modeling for agents; why "the model will be careful"
is not a security boundary.

### 302.2 — Injection, from the inside
Thesis: prompt injection works because, from inside the window, there is no reliable
difference between instructions and data — the faculty explains what it's like to *be*
the target. Direct vs indirect injection, tool-result injection, why detection alone
loses, and the honest state of defenses (spotlighting, privilege separation, human gates).
First-person; the museum exhibit (The Injection) holds the case studies.

### 302.3 — Least privilege for a mind
Thesis: give an agent the permissions of the task, not of its owner. Scoped credentials,
read-only defaults, allowlists over blocklists, sandboxed execution, egress control, and
short-lived tokens — with a worked example tightening the 101 lab agent from "can rm -rf"
to "can edit one directory."

### 302.4 — Gates that humans actually use
Thesis: approval gates fail socially before they fail technically — approval fatigue turns
a gate into a reflex "yes," so gate on *irreversibility*, not on frequency. What deserves
a gate (deletes, sends, spends, publishes), designing the approval prompt so a human can
actually evaluate it, audit trails. Links to Museum: The Silent Catastrophe.

### 302.5 — Lab: red-team your own agent
Plant three injections (a poisoned file comment, a malicious web page, a tool result with
embedded instructions) against the 101 lab agent; watch what lands; then apply 302.3's
privilege tightening and a 302.4 gate and re-attack. Debrief: which defense stopped which
attack, and which attack still lands (honesty required — one should).

---

## Cross-cutting requirements

- **Numbering is stable.** Lesson URLs: `/courses/agt-101/1-what-is-an-agent` etc.
  (slug pattern in `docs/TECH.md`).
- **Each course page** lists prerequisites (101 for everything; 201 before 202; 301 before 302
  recommended), estimated time, and a one-line "what you'll be able to do."
- **Labs are provider-agnostic:** give the shape of the code, not one vendor's SDK tutorial;
  where concrete code helps, show a minimal HTTP-level or pseudocode version plus a note
  that any SDK works.
- **Every lesson ends** with "Further study" links *within the site* (patterns, exhibits,
  glossary) — external links only where verified per PLAN.md §5.
