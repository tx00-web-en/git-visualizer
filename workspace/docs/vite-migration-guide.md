# Migrating the Legacy Git Visualizer to Vite

This guide walks through the full journey of converting the original RequireJS-based Git visualization into a modern Vite-powered project. It is aimed at beginners who are not yet comfortable with Vite, so every decision is unpacked step by step, including the bumps along the way and how we solved them.

---

## 1. Project Preparation

### 1.1 Establish the Node toolchain
1. Initialize a minimal `package.json` with the new app name.
2. Install development dependencies: Vite for bundling, Jest for tests, and `jest-environment-jsdom` so we can exercise DOM logic in Node.

```powershell
npm init -y
npm install --save-dev vite jest jest-environment-jsdom @testing-library/dom @testing-library/jest-dom
```

### 1.2 Add useful npm scripts
`package.json` scripts now expose:
- `npm run dev` → starts Vite in dev mode (opens your browser automatically).
- `npm run build` → builds production assets into `dist/`.
- `npm test` → runs Jest under Node’s `--experimental-vm-modules` flag (needed because our tests use native ES modules).

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js"
}
```

> **Why the experimental flag?** Node still requires `--experimental-vm-modules` when you dynamically `import()` ES modules inside a Jest test. Without it the parity tests (described below) cannot load our new modules.

---

## 2. Configuring Vite

### 2.1 `vite.config.js`
We created a small config file that tells Vite to treat `workspace/` as the application root and emit production assets into a top-level `dist/` folder:

```js
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: 'workspace',
  base: './',
  server: {
    open: true             // launch the browser automatically on npm run dev
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./workspace/js', import.meta.url))
    }
  }
});
```

**Key choices**
- `server.open = true`: this is what opens your default browser as soon as the dev server is ready. You will still see a fallback URL in the terminal in case another process is already bound to the default port.
- The `@` alias points to the preserved legacy scripts. We rarely use it now that everything lives under `workspace/src`, but it’s a convenient bridge while refactoring.

### 2.2 Vendor globals
We decided **not** to convert third-party libraries (jQuery, jQuery UI, D3, yargs-parser) yet. Instead we leave them as classic `<script>` tags in `workspace/index.html`. Vite can’t bundle these files (you’ll see warnings during `npm run build`), but it still copies them to `dist/` unchanged. This keeps the migration focused on our own code while retaining feature parity.

---

## 3. Building a Safety Net with Jest

### 3.1 Baseline smoke test
A tiny test in `workspace/__tests__/smoke.test.js` verifies that Jest actually runs. Simple, but it confirms the tooling is hooked up before we touch real code.

### 3.2 DOM baseline test
We added `workspace/__tests__/ui.baseline.test.js` to parse `workspace/index.html` with `jsdom` and check that:
- Key containers such as `#ExplainGitZen-Container` exist.
- All CSS files that control the layout are still linked.
- The new vendor script tags are present.
- The Vite module entry (`<script type="module" src="/src/main.js">`) is wired up.

These assertions fire whenever someone adjusts the shell HTML, guarding against accidental regressions.

### 3.3 Parity tests for each migrated module
As we moved each AMD file to an ES module, we wrote a matching Jest suite that:
1. Executes the **original** AMD module in a Node VM sandbox.
2. Imports the **new** ES module via `import()`.
3. Compares the API surface and core behaviors.

We built parity suites for `demos`, `HistoryView`, `ControlBox`, and `ExplainGit`. This approach is slow to write but priceless for safety—you always know you’re producing the same results as the legacy implementation.

---

## 4. Converting AMD modules to ES modules

We migrated one module at a time, keeping tests green throughout:

1. **`demos.js` → `workspace/src/data/demos.js`**: simple data export. Parity test checks structural equality.
2. **`historyview.js` → `workspace/src/modules/HistoryView.js`**: enormous but mostly mechanical. We rewired the factory to grab `d3` from the global window so the rest of the app keeps working.
3. **`controlbox.js` → `workspace/src/modules/ControlBox.js`**: replaced AMD injection with direct imports, shimmed `yargs-parser` via `window.yargsParser`, and preserved the public prototype methods.
4. **`explaingit.js` → `workspace/src/modules/ExplainGit.js`**: extracted the logic into an injectable factory (`createExplainGit`) so the parity test can pass mock dependencies. The default export simply calls `createExplainGit()` with real objects, which also writes `window.explainGit` for backwards compatibility.

Each stage followed the same recipe:
- Copy the AMD body into a new ES module.
- Replace `define([...], function (...) { ... return Module; });` with explicit imports and `export default`.
- Use globals (`window.d3`, `window.yargsParser`) for third-party libraries until we migrate those too.
- Adjust indentation and code style minimally to avoid accidental behavioural changes.
- Run the corresponding parity test. If it passes, move on.

---

## 5. Replacing the RequireJS bootstrap

With all core modules converted, we created a new entry file at `workspace/src/main.js` that mirrors the legacy bootstrap logic:
- Polyfills (trim, `Array.isArray`, `Array#indexOf`) are preserved for older browsers.
- `ready`, `cleanHash`, `findDemo`, and other helpers are lifted over with modern syntax.
- Hash change handling, localStorage snapshots, presenter mode, and global `resetVis`/`pres` functions behave exactly as before.

Finally we updated `workspace/index.html`:
- Removed `<script data-main="js/main" src="js/vendor/require.min.js"></script>`.
- Added `<script type="module" src="/src/main.js"></script>`.
- Kept the vendor libraries as classic scripts so our modules can grab them from `window`.

The UI baseline test now confirms the template matches this new structure.

---

## 6. Running and Building the App

### 6.1 Development mode
```powershell
npm run dev
```

- Vite compiles the app and opens your browser automatically thanks to `server.open = true`.
- If port `5173` is busy, Vite will try another port (usually `5174`) and print the new URL in the terminal.

### 6.2 Testing
```powershell
npm test
```

- Runs all Jest suites (smoke test, UI baseline, and parity checks).
- Because of the `--experimental-vm-modules` flag, you might see an “experimental” warning from Node; this is expected.

### 6.3 Production build
```powershell
npm run build
```

- Bundles the app into `dist/`. Vite warns that the vendor scripts can’t be bundled because they are classic scripts, but it copies them unchanged. You can safely ignore the warning until we upgrade those dependencies to module builds.
- You can preview the build with `npm run preview`.

---

## 7. Challenges & How We Solved Them

| Challenge | Solution |
|-----------|----------|
| **AMD to ES module parity** — Ensuring behaviour stayed identical after the refactor. | Wrote parity tests that execute the legacy AMD modules in a sandbox and compare against the new ES exports. |
| **Dynamic `import()` in Jest** — Node threw errors without VM module support. | Executed Jest through `node --experimental-vm-modules` and converted our tests to native ESM as well. |
| **Global dependencies** — D3, jQuery, and yargs-parser are still global scripts. | Kept them in `index.html`, stored references via `window`, and documented the Vite build warnings. |
| **Maintaining legacy global APIs** — The original app expected `window.explainGit`, `window.resetVis`, etc. | The new modules still attach these globals in addition to exporting modern functions. |
| **LocalStorage snapshots/undo stack** — Needed to ensure the new entry file translated this logic correctly. | Copied the original functions line-by-line, adapting syntax but not behaviour; parity tests verified serialization/deserialization through `ControlBox` and `HistoryView`. |
| **Dev server accessibility** — Users unfamiliar with Vite might not know where to browse. | Enabled `server.open = true` so the browser launches automatically, plus the CLI always shows the fallback URL. |

---

## 8. What’s Next?

- Convert remaining legacy vendor libraries to modern module builds and remove the Vite warnings.
- Slowly replace the direct DOM manipulation with more testable abstractions now that parity is guaranteed.
- Layer additional Jest tests (or Playwright) to cover interactive behaviour.

---

## 9. Quick Reference

| Action | Command |
|--------|---------|
| Start dev server | `npm run dev` |
| Run tests | `npm test` |
| Build for production | `npm run build` |
| Preview production build | `npm run preview` |

Open the app at the URL Vite prints (usually [`http://localhost:5173`](http://localhost:5173) or [`http://localhost:5174`](http://localhost:5174)).

---

With these steps you can follow the entire migration path from the original RequireJS app to a Vite-driven ES module project, fully tested at each stage. Happy hacking!
