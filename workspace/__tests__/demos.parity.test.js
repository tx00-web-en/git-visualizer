import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('demos module parity', () => {
  function normalizeBranches(data) {
    const serialized = JSON.stringify(data);
    const normalized = serialized
      .replace(/origin\/master/g, 'origin/main')
      .replace(/master/g, 'main');
    return JSON.parse(normalized);
  }

  function loadLegacy() {
    const filePath = path.resolve(__dirname, '..', 'js', 'demos.js');
    const source = readFileSync(filePath, 'utf-8');
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

  runInNewContext(source, sandbox, { filename: 'demos.amd.js' });
    return captured;
  }

  test('esm version matches legacy AMD export', async () => {
    const legacy = normalizeBranches(loadLegacy());
    const { default: esmDemos } = await import('../src/data/demos.js');

    expect(esmDemos).toEqual(legacy);
  });
});
