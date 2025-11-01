import HistoryView from './HistoryView.js';
import ControlBox from './ControlBox.js';

const d3 = (typeof window !== 'undefined' && window.d3) || globalThis.d3;

function resolveWindow(override) {
  if (override !== undefined) {
    return override;
  }

  if (typeof window !== 'undefined') {
    return window;
  }

  return undefined;
}

function createExplainGit({
  HistoryView: HistoryViewImpl = HistoryView,
  ControlBox: ControlBoxImpl = ControlBox,
  d3: d3Impl = d3,
  windowGlobal
} = {}) {
  const prefix = 'ExplainGit';
  const openSandBoxes = [];
  const globalWindow = resolveWindow(windowGlobal);

  function open(_args) {
    const args = Object.create(_args);
    const name = prefix + args.name;
    const containerId = name + '-Container';
    const container = d3Impl.select('#' + containerId);
    const playground = container.select('.playground-container');
    let historyView;
    let originView = null;
    let controlBox;

    container.style('display', 'block');

    args.name = name;
    args.savedState = args.hvSavedState;
    historyView = new HistoryViewImpl(args);

    if (globalWindow) {
      globalWindow.hv = historyView;
    }

    if (args.originData) {
      originView = new HistoryViewImpl({
        name: name + '-Origin',
        width: 300,
        height: 400,
        commitRadius: args.commitRadius,
        remoteName: 'origin',
        commitData: args.originData,
        savedState: args.ovSavedState
      });

      originView.render(playground);

      if (globalWindow) {
        globalWindow.ov = originView;
      }
    }

    controlBox = new ControlBoxImpl({
      historyView,
      originView,
      initialMessage: args.initialMessage,
      undoHistory: args.undoHistory
    });

    if (globalWindow) {
      globalWindow.cb = controlBox;
    }

    controlBox.render(playground);
    historyView.render(playground);

    openSandBoxes.push({
      hv: historyView,
      cb: controlBox,
      container
    });
  }

  function reset() {
    for (let i = 0; i < openSandBoxes.length; i += 1) {
      const osb = openSandBoxes[i];
      osb.hv.destroy();
      osb.cb.destroy();
      osb.container.style('display', 'none');
    }

    openSandBoxes.length = 0;
    d3Impl.selectAll('a.openswitch').classed('selected', false);
  }

  const explainGit = {
    HistoryView: HistoryViewImpl,
    ControlBox: ControlBoxImpl,
    generateId: HistoryViewImpl.generateId,
    open,
    reset
  };

  if (globalWindow) {
    globalWindow.explainGit = explainGit;
  }

  return explainGit;
}

const explainGit = createExplainGit();

export { createExplainGit };
export default explainGit;
