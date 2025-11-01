import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

describe('HistoryView module parity', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const historyViewAmdPath = path.resolve(__dirname, '..', 'js', 'historyview.js');
  const historyViewEsmUrl = pathToFileURL(
    path.resolve(__dirname, '..', 'src', 'modules', 'HistoryView.js')
  ).href;

  function buildD3Stub() {
    const noop = () => {};
    const identity = (v) => v;

    return new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'event') {
            return null;
          }
          if (prop === 'select' || prop === 'selectAll') {
            return () => ({
              attr: identity,
              classed: identity,
              remove: noop,
              append: () => ({ attr: identity, classed: identity, html: identity, text: identity, node: () => ({}) }),
              on: noop,
              style: identity,
              empty: () => false
            });
          }
          if (prop === 'dispatch') {
            return () => ({ on: noop });
          }
          if (prop === 'time') {
            return { now: () => Date.now() };
          }
          if (prop === 'scale') {
            return () => identity;
          }
          return noop;
        }
      }
    );
  }

  function loadAmdHistoryView() {
    const source = readFileSync(historyViewAmdPath, 'utf8');
    const captured = { module: undefined };
    const d3Stub = buildD3Stub();

    const sandbox = {
      d3: d3Stub,
      window: { d3: d3Stub },
      define(dependencies, factory) {
        if (typeof dependencies === 'function') {
          captured.module = dependencies();
          return;
        }
        captured.module = factory(d3Stub);
      }
    };

    sandbox.globalThis = sandbox;

    runInNewContext(source, sandbox, { filename: 'historyview.amd.js' });
    return captured.module;
  }

  test('ESM export exposes the same API surface as legacy AMD module', async () => {
    const HistoryViewLegacy = loadAmdHistoryView();
    const previousD3 = globalThis.d3;
    globalThis.d3 = buildD3Stub();

    const { default: HistoryViewModule } = await import(historyViewEsmUrl);

    expect(Object.getOwnPropertyNames(HistoryViewModule.prototype)).toEqual(
      Object.getOwnPropertyNames(HistoryViewLegacy.prototype)
    );
    expect(Object.getOwnPropertyNames(HistoryViewModule)).toEqual(
      Object.getOwnPropertyNames(HistoryViewLegacy)
    );

    if (previousD3 === undefined) {
      delete globalThis.d3;
    } else {
      globalThis.d3 = previousD3;
    }
  });
});
