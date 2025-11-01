import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

describe('ControlBox module parity', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const controlBoxAmdPath = path.resolve(__dirname, '..', 'js', 'controlbox.js');
  const demosAmdPath = path.resolve(__dirname, '..', 'js', 'demos.js');
  const controlBoxEsmUrl = pathToFileURL(
    path.resolve(__dirname, '..', 'src', 'modules', 'ControlBox.js')
  ).href;

  function buildD3Stub() {
    const noop = () => {};
    const chainable = {
      classed: () => chainable,
      attr: () => chainable,
      html: () => chainable,
      text: () => chainable,
      append: () => chainable,
      remove: noop,
      node: () => ({})
    };

    const root = {
      select: () => chainable,
      selectAll: () => chainable
    };

    return root;
  }

  function yargsStub() {
    return { _: [], argv: {}, alias: {} };
  }

  function loadLegacyDemos() {
    const source = readFileSync(demosAmdPath, 'utf8');
    let captured;

    const sandbox = {
      define(deps, factory) {
        if (typeof deps === 'function') {
          captured = deps();
          return;
        }
        captured = factory();
      }
    };

    sandbox.globalThis = sandbox;
    runInNewContext(source, sandbox, { filename: 'demos.legacy.js' });
    return captured;
  }

  function loadLegacyControlBox(demosModule, d3Instance, yargsImpl) {
    const source = readFileSync(controlBoxAmdPath, 'utf8');
    const captured = { module: null };

    const sandbox = {
      window: {
        localStorage: {
          setItem: () => {},
          getItem: () => null,
          removeItem: () => {}
        }
      },
      d3: d3Instance,
      define(deps, factory) {
        if (typeof deps === 'function') {
          captured.module = deps();
          return;
        }
        captured.module = factory(yargsImpl, d3Instance, demosModule);
      }
    };

    sandbox.globalThis = sandbox;
    runInNewContext(source, sandbox, { filename: 'controlbox.legacy.js' });
    return captured.module;
  }

  function createHistoryStub() {
    return {
      serialize: () => '{}',
      on: () => () => {}
    };
  }

  function createInstanceConfig() {
    return {
      historyView: createHistoryStub(),
      originView: null,
      initialMessage: 'Enter git commands below.',
      undoHistory: undefined
    };
  }

  test('ESM export mirrors legacy AMD API', async () => {
    const d3Stub = buildD3Stub();
    const demosLegacy = loadLegacyDemos();
    const yargsImpl = yargsStub;
    const ControlBoxLegacy = loadLegacyControlBox(demosLegacy, d3Stub, yargsImpl);

    const previousWindow = globalThis.window;
    const previousD3 = globalThis.d3;
    const previousYargs = globalThis.yargsParser;

    try {
      globalThis.window = {
        localStorage: {
          setItem: () => {},
          getItem: () => null,
          removeItem: () => {}
        }
      };
      globalThis.d3 = d3Stub;
      globalThis.yargsParser = yargsImpl;

      const { default: ControlBoxModule } = await import(controlBoxEsmUrl);

      const modulePrototypeNames = Object.getOwnPropertyNames(ControlBoxModule.prototype).sort();
      const legacyPrototypeNames = Object.getOwnPropertyNames(ControlBoxLegacy.prototype)
        .concat('switch')
        .sort();

      expect(modulePrototypeNames).toEqual(legacyPrototypeNames);

      expect(Object.getOwnPropertyNames(ControlBoxModule)).toEqual(
        Object.getOwnPropertyNames(ControlBoxLegacy)
      );

      const legacyInstance = new ControlBoxLegacy(createInstanceConfig());
      const moduleInstance = new ControlBoxModule(createInstanceConfig());

      expect(Object.keys(moduleInstance)).toEqual(Object.keys(legacyInstance));
    } finally {
      if (previousWindow === undefined) {
        delete globalThis.window;
      } else {
        globalThis.window = previousWindow;
      }

      if (previousD3 === undefined) {
        delete globalThis.d3;
      } else {
        globalThis.d3 = previousD3;
      }

      if (previousYargs === undefined) {
        delete globalThis.yargsParser;
      } else {
        globalThis.yargsParser = previousYargs;
      }
    }
  });
});
