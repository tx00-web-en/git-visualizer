import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('legacy index bootstrap', () => {
  let documentRoot;

  beforeAll(() => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
    const html = readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    documentRoot = parser.parseFromString(html, 'text/html');
  });

  test('exposes the visualization containers needed by the UI', () => {
    expect(documentRoot.querySelector('#ExplainGitZen-Container')).not.toBeNull();
    expect(documentRoot.querySelector('svg')).not.toBeNull();
  });

  test('loads the vendor scripts needed by the ES modules', () => {
    const scripts = Array.from(documentRoot.querySelectorAll('script[src]'));
    const srcs = scripts.map((script) => script.getAttribute('src'));
    expect(srcs).toEqual(
      expect.arrayContaining([
        'js/vendor/jquery.js',
        'js/vendor/jquery-ui.min.js',
        'js/vendor/d3.js',
        'js/vendor/yargs-parser.js'
      ])
    );
  });

  test('boots the application through the Vite module entrypoint', () => {
    const moduleScript = documentRoot.querySelector('script[type="module"]');
    expect(moduleScript).not.toBeNull();
    expect(moduleScript?.getAttribute('src')).toBe('/src/main.js');
  });

  test('retains all stylesheet links that control layout', () => {
    const links = Array.from(documentRoot.querySelectorAll('link[rel="stylesheet"]'));
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        'css/normalize.css',
        'css/1140.css',
        'css/explaingit.css',
        'css/jquery-ui.min.css'
      ])
    );
  });
});
