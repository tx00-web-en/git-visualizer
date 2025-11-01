import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';

describe('ExplainGit module parity', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const explainGitAmdPath = path.resolve(__dirname, '..', 'js', 'explaingit.js');
  const explainGitEsmUrl = pathToFileURL(
    path.resolve(__dirname, '..', 'src', 'modules', 'ExplainGit.js')
  ).href;

  class HistoryViewStub {
    static instances = [];
    static reset() {
      HistoryViewStub.instances = [];
    }

    static generateId() {
      return 'stub-id';
    }

    constructor(args) {
      this.args = args;
      this.renderedWith = [];
      this.destroyCalls = 0;
      HistoryViewStub.instances.push(this);
    }

    render(selection) {
      this.renderedWith.push(selection.selector);
    }

    destroy() {
      this.destroyCalls += 1;
    }

    serialize() {
      return '{}';
    }

    on() {
      return () => {};
    }
  }

  class ControlBoxStub {
    static instances = [];
    static reset() {
      ControlBoxStub.instances = [];
    }

    constructor(args) {
      this.args = args;
      this.renderedWith = [];
      this.destroyCalls = 0;
      ControlBoxStub.instances.push(this);
    }

    render(selection) {
      this.renderedWith.push(selection.selector);
    }

    destroy() {
      this.destroyCalls += 1;
    }
  }

  function createSelection(selector) {
    return {
      selector,
      styleCalls: [],
      classedCalls: [],
      childSelections: [],
      style(name, value) {
        this.styleCalls.push({ name, value });
        return this;
      },
      classed(name, value) {
        this.classedCalls.push({ name, value });
        return this;
      },
      select(childSelector) {
        const child = createSelection(childSelector);
        this.childSelections.push(child);
        return child;
      }
    };
  }

  function createD3Stub() {
    const selections = [];
    return {
      selections,
      select(selector) {
        const selection = createSelection(selector);
        selections.push(selection);
        return selection;
      },
      selectAll(selector) {
        const selection = createSelection(selector);
        selections.push(selection);
        return selection;
      }
    };
  }

  function createWindowStub() {
    return {
      localStorage: {
        setItem: () => {},
        getItem: () => null,
        removeItem: () => {}
      }
    };
  }

  function loadLegacyExplainGit({ windowStub, d3Stub }) {
    const source = readFileSync(explainGitAmdPath, 'utf8');
    let captured;

    const sandbox = {
      window: windowStub,
      define(_deps, factory) {
        captured = factory(HistoryViewStub, ControlBoxStub, d3Stub);
      }
    };

    sandbox.globalThis = sandbox.window;

    runInNewContext(source, sandbox, { filename: 'explaingit.legacy.js' });
    return captured;
  }

  function createArgs() {
    return {
      name: 'Zen',
      hvSavedState: '{}',
      commitRadius: 20,
      initialMessage: 'Hello',
      undoHistory: { pointer: 0, stack: [] },
      originData: [{ id: 'first' }]
    };
  }

  test('ESM export mirrors legacy AMD behavior', async () => {
    const legacyWindow = createWindowStub();
    const legacyD3 = createD3Stub();
    HistoryViewStub.reset();
    ControlBoxStub.reset();

    const explainGitLegacy = loadLegacyExplainGit({ windowStub: legacyWindow, d3Stub: legacyD3 });

    const modernWindow = createWindowStub();
    const modernD3 = createD3Stub();
    HistoryViewStub.reset();
    ControlBoxStub.reset();

    const { createExplainGit } = await import(explainGitEsmUrl);
    const explainGitModern = createExplainGit({
      HistoryView: HistoryViewStub,
      ControlBox: ControlBoxStub,
      d3: modernD3,
      windowGlobal: modernWindow
    });

    expect(Object.getOwnPropertyNames(explainGitModern)).toEqual(
      Object.getOwnPropertyNames(explainGitLegacy)
    );

    expect(modernWindow.explainGit).toBe(explainGitModern);
    expect(legacyWindow.explainGit).toBe(explainGitLegacy);

    const argsLegacy = createArgs();
    const argsModern = createArgs();

    explainGitLegacy.open(argsLegacy);
    expect(HistoryViewStub.instances.length).toBe(2);
    expect(ControlBoxStub.instances.length).toBe(1);
    expect(legacyWindow.hv).toBe(HistoryViewStub.instances[0]);
    expect(legacyWindow.ov).toBe(HistoryViewStub.instances[1]);
    expect(legacyWindow.cb).toBe(ControlBoxStub.instances[0]);
    expect(legacyD3.selections[0].styleCalls).toContainEqual({ name: 'display', value: 'block' });

    HistoryViewStub.reset();
    ControlBoxStub.reset();

    explainGitModern.open(argsModern);
    expect(HistoryViewStub.instances.length).toBe(2);
    expect(ControlBoxStub.instances.length).toBe(1);
    expect(modernWindow.hv).toBe(HistoryViewStub.instances[0]);
    expect(modernWindow.ov).toBe(HistoryViewStub.instances[1]);
    expect(modernWindow.cb).toBe(ControlBoxStub.instances[0]);
    expect(modernD3.selections[0].styleCalls).toContainEqual({ name: 'display', value: 'block' });

    explainGitLegacy.reset();
    expect(legacyWindow.hv.destroyCalls).toBe(1);
    expect(legacyWindow.cb.destroyCalls).toBe(1);
    expect(legacyD3.selections[0].styleCalls).toContainEqual({ name: 'display', value: 'none' });

    explainGitModern.reset();
    expect(modernWindow.hv.destroyCalls).toBe(1);
    expect(modernWindow.cb.destroyCalls).toBe(1);
    expect(modernD3.selections[0].styleCalls).toContainEqual({ name: 'display', value: 'none' });
  });
});
