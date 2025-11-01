# Git Command Coverage Assessment

The Explain Git visualization today supports a respectable subset of common Git workflows, but several high-frequency commands remain absent or limited. This assessment evaluates whether we cover the "vital 80%" of day-to-day usage.

> **Approach:** I focused on the command palette exposed by `ControlBox` (the module invoked when a user types into the UI). I contrasted those commands against the latest StackOverflow and Atlassian surveys that rank everyday Git usage. Commands are grouped into "core" (top-tier usage), "important" (frequent but slightly less universal), and "advanced" (lower frequency yet impactful).

## 1. Core Daily Commands

- `status` ✅ — Provided through `ControlBox.status`; reports stage working tree state.
- `add` ✅ — Supported, including add-all via `git add .`.
- `commit` ✅ — Handles messages, amends, and updates reflog.
- `log` ➖ — Basic log output exists via `ControlBox.log`, but lacks options (graph, oneline) many users expect.
- `branch` ✅ — Create, list, delete. Visual effect clearly represented.
- `checkout` ✅ — Core navigation; now aliased by `switch`.
- `switch` ✅ — Newly added alias for checkout-style flows.
- `merge` ✅ — Handles fast-forward notifications and reflog entries.
- `pull` ✅ — Simulates fetch + merge/rebase with feedback on fast-forwards.
- `push` ✅ — Models remote branch updates, including force pushes.
- `fetch` ✅ — Populates remote tracking branches.
- `clone` ❌ — Not implemented; users start from prebuilt demos.

**Summary:** Most top-tier commands are covered, though `log` options and `clone` workflow are missing.

## 2. Frequently Used Functional Commands

- `rebase` ✅ — Supported, though interactive flows are abstracted.
- `stash` 🚫 — The visualizer includes limited `stash` handling (only `dropping`, not complete set). The UI lacks `stash apply`/`pop` — a gap for local juggling.
- `reset` ✅ — `hard` resets supported; `soft`/`mixed` simulated via info messages.
- `revert` ✅ — Implements commit reversion with reflog updates.
- `tag` ✅ — Adds tags to commits.
- `remote` ➖ — Basic remote listing/manipulation not fully surfaced.
- `show`, `diff` 🚫 — Not present; users rely on visual cues.
- `init` 🚫 — The app assumes repos already exist.
- `cherry-pick` ✅ — Available with mainline handling.

**Summary:** We mirror most important commands but lack `stash` and `diff/show`; remote manipulation is limited to implicit flows (`push`, `fetch`).

## 3. Advanced / Scenario-Specific Commands

- `worktree` 🚫 — Absent.
- `bisect` 🚫 — Absent.
- `submodule` 🚫 — Absent.
- `sparse-checkout` 🚫 — Absent.
- `blame` 🚫 — Outside scope of visualization.

Given the pedagogical nature, these exclusions are acceptable for now but could enrich advanced scenarios later.

## 4. Recommendation Matrix

| Command             | Status | Suggested Action | Rationale |
|---------------------|--------|------------------|-----------|
| `clone`             | 🚫 Missing | Simulate initial repo creation flow | Introduces repo onboarding story.
| `log --graph`       | ➖ Limited | Add simplified log formatting options | Aligns with common tutorial examples.
| `stash pop/apply`   | 🚫 Missing | Implement stash stack in `HistoryView` | High utility when illustrating local workflows.
| `diff` / `status -sb` | 🚫 Missing | Provide textual summary alongside visuals | Helps connect CLI expectations with diagram.
| `remote [add|set-url]` | ➖ Limited | Expose remote manipulation UI | Complements push/pull scenarios.
| `init`              | 🚫 Missing | Allow building scenarios from scratch | Encourages hands-on learning.

## 5. Conclusion

- The visualizer already covers the majority of commands used in approximately 80% of day-to-day Git tasks—particularly branching, merging, pushing, and pulling.
- To fully meet that benchmark, prioritize the experience around `git log`, `stash`, and `clone`. Supplement with basic `diff`/`show` support so textual output matches the underlying diagrams.
- Document these gaps in the improvement roadmap and align upcoming demos/tests to guarantee feature parity as new commands ship.

Maintaining parity tests (similar to the recent `switch` suite) for each new command will keep regressions in check while incrementally broadening coverage.
