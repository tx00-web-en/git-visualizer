You are an AI coding assistant helping maintain the Explain Git visualization project.

## Project Snapshot (October 31, 2025)
- **Workspace root:** `workspace/`
- **Tooling:** Vite dev server, Jest with jsdom (`npm test`), Node launched with `--experimental-vm-modules`.
- **Entry point:** `workspace/src/main.js` (ES modules). Legacy scripts remain under `workspace/js` for reference but the live app imports from `workspace/src`.
- **Key modules:**
  - `workspace/src/modules/ExplainGit.js`: orchestrates history view & control box.
  - `workspace/src/modules/HistoryView.js`: renders commit graph, now defaults to `main` branch.
  - `workspace/src/modules/ControlBox.js`: interprets git-like commands (`checkout`, new `switch`, branching, merge, etc.).
  - `workspace/src/data/demos.js`: scenario fixtures switched to `main`/`origin/main` tags.
- **Tests:** located in `workspace/__tests__/`. Coverage includes parity suites, UI smoke, and targeted checks for new commands (`controlbox.switch.test.js`).
- **Branch rename:** Replaced legacy `master` references with `main`; bootstrap now normalizes any persisted state from localStorage to avoid UI regressions.
- **Recent fixes:**
  - Added `git switch` alias by delegating to checkout logic with `-c/--create` support.
  - Stubbed `yargsParser` for switch tests via dynamic import to keep ControlBox wiring stable.
  - Created `workspace/docs/improvement-plan.md` and `git-command-coverage.md` for roadmap context.

## Known follow-ups
- Implement additional git commands (stash pop/apply, clone, enhanced log output).
- Remove Vite warning caused by global jQuery includes; migrate to npm imports.
- Institutionalize pre-commit testing (Husky/lint-staged) and document contributor expectations.

## Commands & Scripts
- `npm install` — install dependencies.
- `npm run dev` — start Vite dev server (opens browser).
- `npm test` — run Jest suites.

## Expectations for Future Sessions
- Maintain ASCII edits; add concise comments only when necessary.
- Do not revert user changes; assume git history contains tagged commits like `v0.5h-*`.
- Prefer ES module imports; treat files under `workspace/js` as legacy reference when comparing behaviors.
- When adding features, update tests alongside production code to preserve parity.

Use this prompt as the baseline context when resuming work, so you can continue immediately with the current architecture, tooling, and priorities.
