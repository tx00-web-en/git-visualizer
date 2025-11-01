# Project Improvement Plan

This plan outlines follow-up enhancements for the Vite-based Explain Git workspace. It focuses on expanding simulated Git functionality, removing build warnings, and keeping the test suite healthy.

## 1. Broaden Git Command Coverage
- **Assess high-value commands:** Review user feedback and existing tutorials to prioritize additions such as `git restore`, `git worktree`, `git stash pop`, and `git remote set-url`. Document expected behavior versus real Git.
- **Model state transitions:** For each command, sketch how the command mutates repo state (branches, HEAD, reflog). Validate against current `HistoryView` and `ControlBox` capabilities, adding helpers where needed.
- **Design UX affordances:** Update control-box help text and command auto-complete (if any) so the new commands are discoverable. Ensure error messages remain clear for unsupported flags.
- **Iterative delivery:** Implement commands in small batches (e.g., stash enhancements, then worktree), landing parity tests and targeted unit tests with each batch.

## 2. Resolve Vite Warning About jQuery
- **Identify root cause:** Reproduce the warning (`npm run dev`) and capture the exact message. It likely stems from loading the legacy vendor bundle via `<script>` tags.
- **Adopt ESM-friendly import path:** Replace the global script include with Vite-managed dependencies: install `jquery` and `jquery-ui` via npm, then import them in `main.js` or specific modules. Use Vite `optimizeDeps.include` if necessary.
- **Shim legacy consumers:** Where modules expect global `$` or `jQuery`, provide an explicit import/wrapper so the code works in module scope. Consider extracting minimal jQuery UI widgets that the project actually uses to reduce bundle size.
- **Verify build cleanliness:** Run `npm run dev` and `npm run build` ensuring the jQuery-related warning no longer appears and that functionality remains intact.

## 3. Institutionalize Test-First Workflow
- **Create contribution checklist:** Add a short guide (e.g., `CONTRIBUTING.md`) that reminds contributors to write or update tests before submitting changes.
- **Set up task automation:** Configure `lint-staged` or Husky pre-commit hooks to run `npm test -- --bail` and relevant linters before commits. Provide escape hatches for emergency fixes.
- **Expand coverage metrics:** Integrate Jest coverage reporting (`npm test -- --coverage`) into CI and publish thresholds that must stay green.
- **Document testing patterns:** Capture examples of parity tests, command stubs (like the `yargsParser` shim), and UI smoke tests so future contributors can mirror existing strategies.
- **Continuous validation:** Add a CI workflow (GitHub Actions or Azure DevOps) that runs on pushes/PRs and fails on warnings or test regressions.

---
Following this roadmap will keep the visualization aligned with modern Git workflows, ensure the build remains warning-free, and maintain the robust testing discipline we established. 