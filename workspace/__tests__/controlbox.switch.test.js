import { jest } from '@jest/globals';

const previousYargsParserGlobal = globalThis.yargsParser;
const previousYargsParserWindow = typeof window !== 'undefined' ? window.yargsParser : undefined;

let ControlBox;

function stubYargsParser(input) {
  const tokens = input ? input.trim().split(/\s+/).filter(Boolean) : [];
  const result = { _: [] };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '-c' || token === '--create') {
      const value = tokens[i + 1];
      if (value !== undefined) {
        result.c = value;
        result.create = value;
        i += 1;
      }
    } else {
      result._.push(token);
    }
  }

  return result;
}

beforeAll(async () => {
  globalThis.yargsParser = stubYargsParser;
  if (typeof window !== 'undefined') {
    window.yargsParser = stubYargsParser;
  }

  ({ default: ControlBox } = await import('../src/modules/ControlBox.js'));
});

afterAll(() => {
  if (previousYargsParserGlobal === undefined) {
    delete globalThis.yargsParser;
  } else {
    globalThis.yargsParser = previousYargsParserGlobal;
  }

  if (typeof window !== 'undefined') {
    if (previousYargsParserWindow === undefined) {
      delete window.yargsParser;
    } else {
      window.yargsParser = previousYargsParserWindow;
    }
  }
});

function createHistoryStub() {
  return {
    serialize: jest.fn().mockReturnValue('{}'),
    on: jest.fn().mockReturnValue(() => {}),
    getCommit: jest.fn().mockReturnValue({ id: 'abc123' }),
    checkout: jest.fn(),
    addReflogEntry: jest.fn()
  };
}

function createControlBox() {
  const historyView = createHistoryStub();
  const controlBox = new ControlBox({
    historyView,
    originView: null,
    initialMessage: 'ready'
  });

  return { controlBox, historyView };
}

describe('ControlBox git switch support', () => {
  test('delegates simple switch to checkout', () => {
    const { controlBox } = createControlBox();
    const checkoutSpy = jest.spyOn(controlBox, 'checkout').mockImplementation(() => {});

    controlBox.switch(['feature'], {}, 'feature');

    expect(checkoutSpy).toHaveBeenCalledWith(['feature'], expect.objectContaining({ _: ['feature'] }));

    checkoutSpy.mockRestore();
  });

  test('supports branch creation with -c alias', () => {
    const { controlBox } = createControlBox();
    const checkoutSpy = jest.spyOn(controlBox, 'checkout').mockImplementation(() => {});

    controlBox.switch(['-c', 'feature'], { _: [], c: 'feature' }, '-c feature');

    expect(checkoutSpy).toHaveBeenCalledWith([], expect.objectContaining({ b: 'feature', _: [] }));

    checkoutSpy.mockRestore();
  });

  test('passes start point when creating a branch', () => {
    const { controlBox } = createControlBox();
    const checkoutSpy = jest.spyOn(controlBox, 'checkout').mockImplementation(() => {});

    controlBox.switch(['-c', 'feature', 'base'], { _: ['base'], c: 'feature' }, '-c feature base');

    expect(checkoutSpy).toHaveBeenCalledWith(['base'], expect.objectContaining({ b: 'feature', _: ['base'] }));

    checkoutSpy.mockRestore();
  });
});
