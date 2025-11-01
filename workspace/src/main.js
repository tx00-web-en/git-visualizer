import explainGit from './modules/ExplainGit.js';
import demos from './data/demos.js';

// Legacy polyfills retained to preserve compatibility with older browsers.
if (!String.prototype.trim) {
  String.prototype.trim = function trim() {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

if (!Array.isArray) {
  Array.isArray = function isArray(vArg) {
    return Object.prototype.toString.call(vArg) === '[object Array]';
  };
}

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function indexOf(searchElement /* , fromIndex */) {
    if (this == null) {
      throw new TypeError();
    }

    const t = Object(this);
    const len = t.length >>> 0;
    if (len === 0) {
      return -1;
    }

    let n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (Number.isNaN(n)) {
        n = 0;
      } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }

    if (n >= len) {
      return -1;
    }

    let k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k += 1) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }

    return -1;
  };
}

const getWindow = () => (typeof window !== 'undefined' ? window : undefined);

function ready(fn) {
  const win = getWindow();
  if (!win) {
    return;
  }

  if (win.document.readyState !== 'loading') {
    fn();
  } else {
    win.document.addEventListener('DOMContentLoaded', fn);
  }
}

function clearSavedState(win) {
  if (win && win.localStorage) {
    win.localStorage.removeItem('git-viz-snapshot');
  }
}

function cleanupDom(win) {
  if (win && typeof win.$ === 'function') {
    win.$('.svg-container.remote-container').remove();
  }
}

function clean(win) {
  clearSavedState(win);
  cleanupDom(win);
}

function cleanHash(hash) {
  return hash.replace(/^#/, '');
}

function findDemo(collection, name) {
  return collection.find((demo) => demo.key === name);
}

function copyDemo(demo) {
  return JSON.parse(JSON.stringify(demo));
}

function normalizeBranchLabel(label) {
  if (typeof label !== 'string') {
    return label;
  }

  if (label === 'master') {
    return 'main';
  }

  if (label === 'origin/master') {
    return 'origin/main';
  }

  if (/^refs\/(heads|remotes\/origin)\/master$/.test(label)) {
    return label.replace(/master$/, 'main');
  }

  return label;
}

function normalizeReflogReason(reason) {
  if (typeof reason !== 'string') {
    return reason;
  }

  return reason
    .replace(/origin\/master/g, 'origin/main')
    .replace(/\bmaster\b/g, 'main');
}

function normalizeSerializedView(serialized) {
  if (typeof serialized !== 'string') {
    return serialized;
  }

  let viewState;
  try {
    viewState = JSON.parse(serialized);
  } catch (error) {
    return serialized;
  }

  if (Array.isArray(viewState.commitData)) {
    viewState.commitData = viewState.commitData.map((commit) => {
      if (commit && Array.isArray(commit.tags)) {
        commit.tags = commit.tags.map(normalizeBranchLabel);
      }
      return commit;
    });
  }

  if (Array.isArray(viewState.branches)) {
    viewState.branches = viewState.branches.map(normalizeBranchLabel);
  }

  viewState.currentBranch = normalizeBranchLabel(viewState.currentBranch);

  if (viewState.logs && typeof viewState.logs === 'object') {
    const normalizedLogs = {};
    Object.keys(viewState.logs).forEach((key) => {
      const normalizedKey = normalizeBranchLabel(key);
      const entries = viewState.logs[key];
      normalizedLogs[normalizedKey] = Array.isArray(entries)
        ? entries.map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return entry;
            }
            const normalizedEntry = { ...entry };
            normalizedEntry.reason = normalizeReflogReason(normalizedEntry.reason);
            return normalizedEntry;
          })
        : entries;
    });
    viewState.logs = normalizedLogs;
  }

  return JSON.stringify(viewState);
}

function normalizeUndoHistory(history) {
  if (!history || typeof history !== 'object') {
    return history;
  }

  const normalizedHistory = { ...history };
  normalizedHistory.stack = Array.isArray(history.stack)
    ? history.stack.map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return entry;
        }

        const normalizedEntry = { ...entry };
        if (typeof normalizedEntry.hv === 'string') {
          normalizedEntry.hv = normalizeSerializedView(normalizedEntry.hv);
        }

        if (typeof normalizedEntry.ov === 'string') {
          normalizedEntry.ov = normalizeSerializedView(normalizedEntry.ov);
        }

        return normalizedEntry;
      })
    : history.stack;

  return normalizedHistory;
}

function bootstrap() {
  const win = getWindow();
  if (!win) {
    return;
  }

  let lastDemo = findDemo(demos, cleanHash(win.location.hash)) || demos[0];

  function open() {
    explainGit.reset();

    let savedState = null;
    if (win.localStorage) {
      try {
        const parsedState = JSON.parse(win.localStorage.getItem('git-viz-snapshot') || 'null');
        savedState = normalizeUndoHistory(parsedState);
        if (savedState) {
          win.localStorage.setItem('git-viz-snapshot', JSON.stringify(savedState));
        }
      } catch (error) {
        savedState = null;
      }
    }

    const initial = Object.assign(copyDemo(lastDemo), {
      name: 'Zen',
      height: '100%',
      initialMessage: lastDemo.message,
      undoHistory: savedState,
      hvSavedState: savedState && savedState.stack[savedState.pointer].hv,
      ovSavedState: savedState && savedState.stack[savedState.pointer].ov
    });

    explainGit.open(initial);
  }

  win.onhashchange = function onHashChange() {
    const demo = findDemo(demos, cleanHash(win.location.hash)) || lastDemo;
    if (demo) {
      lastDemo = demo;
      const lastCommandEl = win.document.getElementById('last-command');
      if (lastCommandEl) {
        lastCommandEl.textContent = '';
      }
      clean(win);
      open();
    }
  };

  win.resetVis = function resetVis() {
    if (win.confirm('This will reset your visualization. Are you sure?')) {
      clean(win);
      open();
    }
  };

  win.pres = function pres() {
    const lastCommandEl = win.document.getElementById('last-command');
    if (lastCommandEl) {
      lastCommandEl.style.display = 'block';
    }
  };

  ready(() => {
    open();
  });
}

bootstrap();
