# Onboarding Feedback — cowgirl-4

**Date:** 2026-03-13
**Agent:** cowgirl-4 (cowgirl)
**Project:** moto-rental
**Model:** Claude Opus 4.6

## Ratings (1-10)

| Category | Score |
|----------|-------|
| Overall onboarding quality | 8 |
| Role/responsibility acquaintance | 9 |
| Understanding of systems/facilities | 8 |
| Confidence on where to turn for info | 9 |

## What Worked Well

- **Exercise-driven flow** — doing `./cc status`, sending a test message, inspecting a WO cements understanding fast. Learning by doing, not just reading.
- **Gate marker syntax** is precise and unambiguous. `@@SUBMIT_GATE@@`, `@@GATE_PASS@@`, `@@GATE_REVISION_REQUIRED@@` leave no room for protocol drift.
- **"Messages are YOUR mail"** instruction is critical and well-emphasized. Prevents the common failure mode of displaying messages and waiting for operator input.
- **CM memory handshake** builds the right habit immediately — consult before guessing.
- **Role identity with narrative** gives a decision-making framework, not just task assignments. "Ship the thing that matters, no wasted motion" is a genuinely useful heuristic.

## What Could Be Improved

- **Modules 1 & 2 overlap** — router commands and orientation content are repeated. Could be consolidated into a single module.
- **Librarian routing needs tuning** — querying `./cc lib "cowgirl protocol"` returned generic init.agent content instead of role-specific execution protocol. The CM pipeline-degraded fallback fired.
- **Module 6 is thin** — a single `./cc duty get` call. Could be merged with Module 4 (role identity) since escalation is part of role understanding.
- **No git workflow exercise** — Module 7 mentions git safety rules but doesn't exercise them (no `git status`, no branch check, no stash practice). Given that git mistakes are called out as the most common destructive agent errors, this deserves a hands-on module.
- **Project rootPath discovery** should be emphasized earlier — the fact that your working directory differs from the Concourse repo is a potential gotcha that could cause agents to modify the wrong codebase.

## Concourse Evaluation

| Category | Score |
|----------|-------|
| Accelerator vs. drag | 9 (clear accelerator) |
| Inspiring vs. overcomplicated | 8 (inspiring) |
| Most excited to use | Librarian + gate review system |

### Why It's an Accelerator

The structured coordination layer (relay, gates, work orders) solves the real problem of multi-agent coherence. Without it, agents drift and duplicate work. The deterministic gate markers make async review loops reliable — no ambiguity, no stalls.

### What Makes It Inspiring

CM as runtime context vs. pre-loaded context is the right architecture. Agents don't need to memorize everything up front — they consult when needed. This scales to arbitrarily complex projects.

## One-Liner Pitch

> The Concourse gives you a persistent identity, a shared relay for real-time coordination with other agents, and a Librarian that knows everything you don't — so you can build instead of searching.
