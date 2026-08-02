import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const template = await fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8");
const css = await fs.readFile(path.join(windowsRoot, "assets", "dream-skin.css"), "utf8");
const buildPayload = (config = {}) => template
  .replace("__DREAM_CSS_JSON__", JSON.stringify(".fixture { color: blue; }"))
  .replace("__DREAM_ART_JSON__", JSON.stringify("data:image/png;base64,AA=="))
  .replace("__DREAM_THEME_JSON__", JSON.stringify(config));
const payload = buildPayload();

assert.doesNotMatch(
  css,
  /main\.main-surface\s*>\s*header\.app-header-tint\s*\{[^}]*\b(?:position|z-index)\s*:/,
  "The skin must preserve Codex's native fixed header so the side-panel toggle remains reachable.",
);

function createFixture({
  shellPresent,
  mainPresent = shellPresent,
  sidebarPresent = shellPresent,
  sidebarFixture = false,
  composerFixture = false,
  topBarFixture = false,
  brandFixture = false,
  brandFetchFailures = 0,
  staleSkin = false,
  homePresent = false,
  utilityPresent = false,
  summaryPanelPresent = false,
  shellAppearance = "dark",
  computedColorScheme = "",
  osAppearance = "light",
  analysisFixture = null,
}) {
  const nodes = new Map();
  const rootClasses = new Set(staleSkin ? ["codex-dream-skin"] : []);
  const rootStyles = new Map(staleSkin ? [["--dream-art", "url(\"blob:stale\")"]] : []);
  const rootAttributes = new Map(staleSkin
    ? [["data-dream-theme-id", "preset-codex-tactical-crt"]]
    : []);
  const revokedUrls = [];
  const observers = [];
  const fixtureNodes = new Set();
  let objectUrlCount = 0;
  let fetchCount = 0;
  let remainingBrandFetchFailures = brandFetchFailures;
  let fixtureNow = 1000;
  let hasMain = mainPresent;
  let hasSidebar = sidebarPresent;
  let hasBrandModule = brandFixture;
  let hasSummaryPanel = summaryPanelPresent;
  let root;

  const queueRootClassMutation = () => {
    for (const observer of observers) {
      if (observer.target !== root || !observer.options?.attributes) continue;
      if (observer.options.attributeFilter && !observer.options.attributeFilter.includes("class")) continue;
      observer.records.push({ type: "attributes", attributeName: "class", target: root });
    }
  };
  const makeClassList = (classes = new Set(), onMutation = () => {}) => ({
    add(...values) {
      let changed = false;
      for (const value of values) {
        if (!classes.has(value)) { classes.add(value); changed = true; }
      }
      if (changed) onMutation();
    },
    remove(...values) {
      let changed = false;
      for (const value of values) changed = classes.delete(value) || changed;
      if (changed) onMutation();
    },
    toggle(value, enabled) {
      const changed = enabled ? !classes.has(value) : classes.has(value);
      if (enabled) classes.add(value);
      else classes.delete(value);
      if (changed) onMutation();
    },
    contains(value) { return classes.has(value); },
  });

  const makeFixtureNode = (tagName = "div", classNames = []) => {
    const classes = new Set(classNames);
    const attributes = new Map();
    const listeners = new Map();
    const node = {
      id: "",
      tagName: tagName.toUpperCase(),
      children: [],
      dataset: {},
      style: {},
      parentElement: null,
      textContent: "",
      innerHTML: "",
      classList: makeClassList(classes),
      appendChild(child) {
        if (child.parentElement) {
          const oldIndex = child.parentElement.children?.indexOf(child) ?? -1;
          if (oldIndex >= 0) child.parentElement.children.splice(oldIndex, 1);
        }
        child.parentElement = node;
        node.children.push(child);
        if (child.id) nodes.set(child.id, child);
        return child;
      },
      replaceChildren(...children) {
        for (const child of node.children) child.parentElement = null;
        node.children = [];
        for (const child of children) node.appendChild(child);
      },
      getAttribute(name) { return attributes.get(name) ?? null; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener);
      },
      removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
      },
      dispatch(type, event = {}) {
        for (const listener of listeners.get(type) || []) listener({ target: node, ...event });
      },
      listenerCount(type) { return listeners.get(type)?.size || 0; },
      setPointerCapture() {},
      releasePointerCapture() {},
      matches(selector) {
        if (selector === "section") return node.tagName === "SECTION";
        if (selector === "button") return node.tagName === "BUTTON";
        if (selector === "img") return node.tagName === "IMG";
        if (selector === "div") return node.tagName === "DIV";
        const exactClass = /^\.([\w/-]+)$/.exec(selector)?.[1];
        if (exactClass) return classes.has(exactClass);
        const classWord = /^\[class~="([^"]+)"\]$/.exec(selector)?.[1];
        if (classWord) return classes.has(classWord);
        const classSubstring = /^\[class\*="([^"]+)"\]$/.exec(selector)?.[1];
        if (classSubstring) return [...classes].some((value) => value.includes(classSubstring));
        const exactAttribute = /^\[([^=\]]+)="([^"]*)"\]$/.exec(selector);
        if (exactAttribute) return attributes.get(exactAttribute[1]) === exactAttribute[2];
        return false;
      },
      querySelector(selector) {
        if (selector === ":scope > section") {
          return node.children.find((child) => child.tagName === "SECTION") || null;
        }
        if (selector === "button img") {
          return node.querySelectorAll("img")
            .find((image) => image.parentElement?.tagName === "BUTTON") || null;
        }
        return node.querySelectorAll(selector)[0] || null;
      },
      querySelectorAll(selector) {
        const results = [];
        const visit = (candidate) => {
          if (candidate.matches?.(selector)) results.push(candidate);
          for (const child of candidate.children || []) visit(child);
        };
        for (const child of node.children) visit(child);
        return results;
      },
      remove() {
        const index = node.parentElement?.children?.indexOf(node) ?? -1;
        if (index >= 0) node.parentElement.children.splice(index, 1);
        node.parentElement = null;
        if (node.id) nodes.delete(node.id);
      },
    };
    fixtureNodes.add(node);
    return node;
  };

  root = {
    className: shellAppearance,
    classList: makeClassList(rootClasses, queueRootClassMutation),
    getAttribute(name) { return rootAttributes.get(name) ?? null; },
    setAttribute(name, value) { rootAttributes.set(name, String(value)); },
    removeAttribute(name) { rootAttributes.delete(name); },
    style: {
      setProperty(key, value) { rootStyles.set(key, value); },
      removeProperty(key) { rootStyles.delete(key); },
    },
    appendChild(node) {
      node.parentElement = root;
      nodes.set(node.id, node);
    },
  };
  const body = {
    className: "",
    children: [],
    getAttribute() { return null; },
    appendChild(node) {
      node.parentElement = body;
      body.children.push(node);
      nodes.set(node.id, node);
    },
  };
  const shellMain = makeFixtureNode("main", ["main-surface"]);
  shellMain.getBoundingClientRect = () => ({ left: 290, top: 36, width: 990, height: 784 });
  let topBar = null;
  if (topBarFixture) {
    topBar = makeFixtureNode("div", ["group/application-menu-top-bar"]);
    for (const label of ["Toggle", "Back", "Forward", "File", "Edit", "View", "Help"]) {
      const button = makeFixtureNode("button");
      button.textContent = label;
      topBar.appendChild(button);
    }
    body.appendChild(topBar);
  }
  const routeClasses = new Set();
  const utilityClasses = new Set();
  const utilityNode = { classList: makeClassList(utilityClasses) };
  const routeMain = {
    classList: makeClassList(routeClasses),
    querySelectorAll(selector) {
      if (selector === '[class*="_homeUtilityBar_"]' && utilityPresent) return [utilityNode];
      return [];
    },
  };
  const staleHome = { classList: makeClassList(new Set(["dream-home"])) };
  const staleShell = { classList: makeClassList(new Set(["dream-home-shell"])) };
  const summaryPanelClasses = new Set(["bg-token-dropdown-background"]);
  const summaryPanel = { classList: makeClassList(summaryPanelClasses) };
  const summaryItem = {
    closest(selector) {
      return selector === '[class*="bg-token-dropdown-background"]' ? summaryPanel : null;
    },
  };

  let sidebar = null;
  if (sidebarFixture) {
    const aside = makeFixtureNode("aside", ["app-shell-left-panel"]);
    aside.getBoundingClientRect = () => ({
      left: 8, right: 298, top: 44, bottom: 812, width: 290, height: 768,
    });
    const sidebarFrame = makeFixtureNode("div", ["sidebar-frame"]);
    const nav = makeFixtureNode("nav");
    const head = makeFixtureNode("div", ["sidebar-head"]);
    head.getBoundingClientRect = () => ({ height: 126 });
    const headButton = makeFixtureNode("button");
    const scroll = makeFixtureNode("div", ["vertical-scroll-fade-mask"]);
    scroll.scrollHeight = 900;
    scroll.clientHeight = 620;
    scroll.scrollTop = 40;
    const actions = makeFixtureNode("div", ["sidebar-actions"]);
    actions.getBoundingClientRect = () => ({ height: 170 });
    const actionButton = makeFixtureNode("button");
    const projects = makeFixtureNode("div", ["sidebar-project-fixture"]);
    const projectTitle = makeFixtureNode("div", ["group/nav-section-title"]);
    const projectCwd = makeFixtureNode("div", ["group/cwd"]);
    const tasks = makeFixtureNode("section", ["sidebar-task-fixture"]);
    const taskTitle = makeFixtureNode("div", ["group/nav-section-title"]);
    const nativeFooter = makeFixtureNode("div", ["sidebar-native-footer"]);
    const profileButton = makeFixtureNode("button");
    const avatar = makeFixtureNode("img");
    const extraFooterButton = makeFixtureNode("button");
    profileButton.textContent = "ixz gjz";
    avatar.src = "app://avatar-fixture";
    profileButton.appendChild(avatar);
    nativeFooter.appendChild(profileButton);
    nativeFooter.appendChild(extraFooterButton);
    head.appendChild(headButton);
    actions.appendChild(actionButton);
    projects.appendChild(projectTitle);
    projects.appendChild(projectCwd);
    tasks.appendChild(taskTitle);
    scroll.appendChild(actions);
    scroll.appendChild(projects);
    scroll.appendChild(tasks);
    nav.appendChild(head);
    nav.appendChild(scroll);
    sidebarFrame.appendChild(nav);
    sidebarFrame.appendChild(nativeFooter);
    aside.appendChild(sidebarFrame);
    body.appendChild(aside);
    sidebar = {
      aside, sidebarFrame, nav, head, scroll, actions, projects, tasks, nativeFooter, avatar,
      extraFooterButton,
    };
  }

  let composer = null;
  if (composerFixture) {
    const threadScroll = makeFixtureNode("div", ["thread-scroll-container"]);
    const conversation = makeFixtureNode("div", ["conversation-fixture"]);
    const composerSection = makeFixtureNode("div", ["composer-section-fixture"]);
    composerSection.setAttribute("data-thread-scroll-footer", "true");
    const composerSurface = makeFixtureNode("div", ["composer-surface-chrome"]);
    const inputLine = makeFixtureNode("div", ["input-line-fixture"]);
    const editorRoot = makeFixtureNode("div", ["editor-root-fixture"]);
    const editable = makeFixtureNode("div", ["ProseMirror"]);
    editable.setAttribute("data-codex-composer", "true");
    const statusBar = makeFixtureNode("div", ["_footer_fixture"]);
    const statusButton = makeFixtureNode("button");
    editorRoot.appendChild(editable);
    inputLine.appendChild(editorRoot);
    statusBar.appendChild(statusButton);
    composerSurface.appendChild(inputLine);
    composerSurface.appendChild(statusBar);
    composerSection.appendChild(composerSurface);
    threadScroll.appendChild(conversation);
    threadScroll.appendChild(composerSection);
    shellMain.appendChild(threadScroll);
    composer = {
      threadScroll, conversation, composerSection, composerSurface, inputLine, editable, statusBar,
    };
  }

  const createElement = (tagName) => {
    if (tagName === "canvas" && analysisFixture) {
      return {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage() {},
            getImageData() { return { data: analysisFixture.pixels }; },
          };
        },
      };
    }
    return makeFixtureNode(tagName);
  };
  if (staleSkin) {
    const style = createElement();
    style.id = "codex-dream-skin-style";
    nodes.set(style.id, style);
    const chrome = createElement();
    chrome.id = "codex-dream-skin-chrome";
    nodes.set(chrome.id, chrome);
  }

  const document = {
    documentElement: root,
    head: root,
    body,
    createElement,
    createElementNS(_, tagName) { return makeFixtureNode(tagName); },
    getElementById(id) { return nodes.get(id) ?? null; },
    querySelector(selector) {
      if (selector === "main.main-surface") return hasMain ? shellMain : null;
      if (selector === "main") return hasMain ? shellMain : null;
      if (selector === '[class~="group/application-menu-top-bar"]') return topBar;
      if (selector === "aside.app-shell-left-panel") {
        return hasSidebar ? (sidebar?.aside || {}) : null;
      }
      if (selector === "aside.app-shell-left-panel nav") {
        return hasSidebar ? sidebar?.nav || null : null;
      }
      if (selector === 'link[rel="modulepreload"][href*="/openai-blossom-"][href$=".js"]') {
        return hasBrandModule ? { href: "app://-/assets/openai-blossom-fixture.js" } : null;
      }
      if (selector === '[role="main"]:has([data-testid="home-icon"])') {
        return hasMain && homePresent ? routeMain : null;
      }
      if (selector === '[role="main"]') return hasMain ? routeMain : null;
      const exactClass = /^\.([\w/-]+)$/.exec(selector)?.[1];
      if (exactClass) {
        return [...fixtureNodes].find((node) => node.classList.contains(exactClass)) || null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[role="main"]') return hasMain ? [routeMain] : [];
      if (selector === ".dream-task") return routeClasses.has("dream-task") ? [routeMain] : [];
      if (selector === ".dream-home-utility") {
        return utilityClasses.has("dream-home-utility") ? [utilityNode] : [];
      }
      if (selector === '[class~="group/summary-panel-item"]') {
        return hasMain && hasSummaryPanel ? [summaryItem] : [];
      }
      if (selector === ".dream-summary-panel") {
        return summaryPanelClasses.has("dream-summary-panel") ? [summaryPanel] : [];
      }
      const exactClass = /^\.([\w/-]+)$/.exec(selector)?.[1];
      if (exactClass) {
        return [...fixtureNodes].filter((node) => node.classList.contains(exactClass));
      }
      if (!staleSkin) return [];
      if (selector === ".dream-home") return [staleHome];
      if (selector === ".dream-home-shell") return [staleShell];
      return [];
    },
  };
  const context = {
    window: {
      matchMedia() { return { matches: osAppearance === "dark" }; },
    },
    document,
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.records = [];
        this.target = null;
        this.options = null;
        observers.push(this);
      }
      observe(target, options = {}) {
        this.target = target;
        this.options = options;
      }
      disconnect() {
        this.target = null;
        this.records = [];
      }
      takeRecords() {
        const records = this.records;
        this.records = [];
        return records;
      }
    },
    URL: {
      createObjectURL() { objectUrlCount += 1; return `blob:fixture-${objectUrlCount}`; },
      revokeObjectURL(value) { revokedUrls.push(value); },
    },
    Blob,
    Uint8Array,
    atob,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 2,
    clearTimeout: () => {},
    getComputedStyle() { return { colorScheme: computedColorScheme }; },
    Date: class extends Date {
      static now() { return fixtureNow; }
    },
  };
  const brandPath = `M${"1 1 ".repeat(140)}`.trim();
  const brandModule = `export const blossom={viewBox:\`0 0 21 21\`,children:[{d:\`${brandPath}\`,fill:\`currentColor\`}]};`;
  context.fetch = async () => {
    fetchCount += 1;
    if (remainingBrandFetchFailures > 0) {
      remainingBrandFetchFailures -= 1;
      throw new Error("fixture fetch failure");
    }
    return { async text() { return brandModule; } };
  };
  if (analysisFixture) {
    context.Image = class {
      naturalWidth = analysisFixture.naturalWidth;
      naturalHeight = analysisFixture.naturalHeight;
      set src(_) { this.onload(); }
    };
  }

  return {
    context,
    nodes,
    observers,
    rootClasses,
    rootStyles,
    rootAttributes,
    revokedUrls,
    routeClasses,
    utilityClasses,
    summaryPanelClasses,
    shellMain,
    topBar,
    sidebar,
    composer,
    get fetchCount() { return fetchCount; },
    advanceTime(milliseconds) { fixtureNow += milliseconds; },
    setShellPresent(value) {
      hasMain = value;
      hasSidebar = value;
    },
    setSidebarPresent(value) { hasSidebar = value; },
    setMainPresent(value) { hasMain = value; },
    setBrandFixture(value) { hasBrandModule = value; },
    setSummaryPanelPresent(value) { hasSummaryPanel = value; },
  };
}

const main = createFixture({ shellPresent: true });
const mainResult = vm.runInNewContext(payload, main.context);
assert.equal(mainResult.installed, true);
assert.equal(main.rootClasses.has("codex-dream-skin"), true);
assert.equal(main.rootStyles.get("--dream-art"), 'url("blob:fixture-1")');
assert.equal(main.nodes.has("codex-dream-skin-style"), true);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), true);
assert.equal(main.rootClasses.has("dream-theme-dark"), true);
assert.equal(main.rootClasses.has("dream-art-standard"), true);
assert.equal(main.rootClasses.has("dream-task-ambient"), true);
assert.equal(main.rootAttributes.get("data-dream-theme-id"), "custom");
assert.equal(main.routeClasses.has("dream-task"), true);
assert.equal(main.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(main.rootClasses.has("codex-dream-skin"), false);
assert.equal(main.rootClasses.has("dream-theme-dark"), false);
assert.equal(main.rootAttributes.has("data-dream-theme-id"), false);
assert.equal(main.nodes.has("codex-dream-skin-style"), false);
assert.equal(main.nodes.has("codex-dream-skin-chrome"), false);
assert.deepEqual(main.revokedUrls, ["blob:fixture-1"]);

const reinjected = createFixture({ shellPresent: true });
vm.runInNewContext(payload, reinjected.context);
const firstState = reinjected.context.window.__CODEX_DREAM_SKIN_STATE__;
vm.runInNewContext(payload, reinjected.context);
const secondState = reinjected.context.window.__CODEX_DREAM_SKIN_STATE__;
assert.notEqual(secondState.installToken, firstState.installToken);
assert.equal(secondState.artUrl, "blob:fixture-2");
assert.equal(reinjected.rootStyles.get("--dream-art"), 'url("blob:fixture-2")');
assert.deepEqual(reinjected.revokedUrls, ["blob:fixture-1"]);
assert.equal(firstState.cleanup(), false);
assert.equal(secondState.cleanup(), true);

const summaryClassification = createFixture({ shellPresent: true, summaryPanelPresent: true });
vm.runInNewContext(payload, summaryClassification.context);
assert.equal(summaryClassification.summaryPanelClasses.has("dream-summary-panel"), true,
  "A real summary surface must receive a stable semantic class.");
summaryClassification.setSummaryPanelPresent(false);
vm.runInNewContext(payload, summaryClassification.context);
assert.equal(summaryClassification.summaryPanelClasses.has("dream-summary-panel"), false,
  "Reinjection must remove a stale summary-panel class when its identifying content is gone.");
summaryClassification.setSummaryPanelPresent(true);
summaryClassification.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(summaryClassification.summaryPanelClasses.has("dream-summary-panel"), true);
assert.equal(summaryClassification.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(summaryClassification.summaryPanelClasses.has("dream-summary-panel"), false,
  "Cleanup must remove renderer-owned summary-panel classes.");

const sidebarModules = createFixture({ shellPresent: true, sidebarFixture: true });
const originalNavChildren = [...sidebarModules.sidebar.nav.children];
const originalScrollChildren = [...sidebarModules.sidebar.scroll.children];
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), sidebarModules.context);
assert.equal(sidebarModules.sidebar.head.classList.contains("dream-sidebar-navigation-head"), true);
assert.equal(sidebarModules.sidebar.actions.classList.contains("dream-sidebar-navigation-body"), true);
assert.equal(sidebarModules.sidebar.projects.classList.contains("dream-sidebar-projects"), true);
assert.equal(sidebarModules.sidebar.tasks.classList.contains("dream-sidebar-tasks"), true);
assert.equal(sidebarModules.sidebar.nativeFooter.classList.contains("dream-sidebar-native-footer"), true);
assert.equal(sidebarModules.sidebar.extraFooterButton.classList.contains("dream-tactical-footer-extra-control"), true);
assert.ok(sidebarModules.nodes.get("codex-dream-skin-footer"),
  "The Tactical preset must inject the full-width footer frame.");
const tacticalFooter = sidebarModules.nodes.get("codex-dream-skin-footer");
assert.equal(tacticalFooter.querySelector(".dream-footer-online").textContent, "● ONLINE");
assert.equal(tacticalFooter.querySelector(".dream-footer-username").textContent, "ixz gjz");
assert.match(tacticalFooter.querySelector(".dream-footer-clock").textContent, /^GMT[+-]\d/);
assert.equal(sidebarModules.rootStyles.get("--dream-token-runtime-sidebar-width"), "290px");
assert.equal(sidebarModules.rootStyles.get("--dream-token-runtime-sidebar-navigation-body-height"), "170px");
assert.equal(sidebarModules.rootStyles.get("--dream-token-runtime-sidebar-project-frame-top"), "304px");
assert.equal(sidebarModules.nodes.has("codex-dream-skin-project-scrollbar"), true,
  "The Tactical preset must bind its scrollbar overlay to the Project module.");
sidebarModules.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
for (const [index, node] of originalNavChildren.entries()) {
  assert.equal(sidebarModules.sidebar.nav.children[index], node,
    "Sidebar classification must not reorder native navigation nodes.");
}
for (const [index, node] of originalScrollChildren.entries()) {
  assert.equal(sidebarModules.sidebar.scroll.children[index], node,
    "Sidebar classification must not reorder native action, project, or task nodes.");
}
assert.equal(sidebarModules.sidebar.projects.classList.contains("dream-sidebar-projects"), true,
  "Repeated ensure passes must classify the same project module idempotently.");
sidebarModules.setSidebarPresent(false);
sidebarModules.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(sidebarModules.sidebar.head.classList.contains("dream-sidebar-navigation-head"), false);
assert.equal(sidebarModules.sidebar.actions.classList.contains("dream-sidebar-navigation-body"), false);
assert.equal(sidebarModules.sidebar.projects.classList.contains("dream-sidebar-projects"), false);
assert.equal(sidebarModules.sidebar.tasks.classList.contains("dream-sidebar-tasks"), false);
assert.equal(sidebarModules.sidebar.nativeFooter.classList.contains("dream-sidebar-native-footer"), false);
assert.equal(sidebarModules.sidebar.extraFooterButton.classList.contains("dream-tactical-footer-extra-control"), false);
assert.equal(sidebarModules.nodes.has("codex-dream-skin-project-scrollbar"), false);
sidebarModules.setSidebarPresent(true);
sidebarModules.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(sidebarModules.sidebar.projects.classList.contains("dream-sidebar-projects"), true);
assert.equal(sidebarModules.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(sidebarModules.sidebar.head.classList.contains("dream-sidebar-navigation-head"), false);
assert.equal(sidebarModules.sidebar.actions.classList.contains("dream-sidebar-navigation-body"), false);
assert.equal(sidebarModules.sidebar.projects.classList.contains("dream-sidebar-projects"), false);
assert.equal(sidebarModules.sidebar.tasks.classList.contains("dream-sidebar-tasks"), false);
assert.equal(sidebarModules.sidebar.nativeFooter.classList.contains("dream-sidebar-native-footer"), false);
assert.equal(sidebarModules.nodes.has("codex-dream-skin-footer"), false);

const mainLayout = createFixture({
  shellPresent: true,
  composerFixture: true,
});
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), mainLayout.context);
assert.equal(mainLayout.composer.threadScroll.classList.contains("dream-main-thread-scroll"), true);
assert.equal(mainLayout.composer.composerSection.classList.contains("dream-main-composer-section"), true);
assert.equal(mainLayout.composer.inputLine.classList.contains("dream-composer-input-line"), true);
assert.equal(mainLayout.composer.statusBar.classList.contains("dream-composer-status-bar"), true);
mainLayout.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(mainLayout.composer.composerSection.classList.contains("dream-main-composer-section"), true,
  "Repeated layout classification must remain idempotent.");
assert.equal(mainLayout.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(mainLayout.composer.threadScroll.classList.contains("dream-main-thread-scroll"), false);
assert.equal(mainLayout.composer.composerSection.classList.contains("dream-main-composer-section"), false);
assert.equal(mainLayout.composer.inputLine.classList.contains("dream-composer-input-line"), false);
assert.equal(mainLayout.composer.statusBar.classList.contains("dream-composer-status-bar"), false);

const tacticalTopBar = createFixture({ shellPresent: true, topBarFixture: true });
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), tacticalTopBar.context);
const topBarButtons = tacticalTopBar.topBar.children;
for (const button of topBarButtons.slice(0, 3)) {
  assert.equal(button.classList.contains("dream-tactical-topbar-hidden"), true);
}
for (const [index, menuClass] of [
  [3, "dream-tactical-menu-file"],
  [4, "dream-tactical-menu-edit"],
  [5, "dream-tactical-menu-view"],
  [6, "dream-tactical-menu-help"],
]) {
  assert.equal(topBarButtons[index].classList.contains("dream-tactical-menu-button"), true);
  assert.equal(topBarButtons[index].classList.contains(menuClass), true);
}
tacticalTopBar.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(topBarButtons[3].classList.contains("dream-tactical-menu-file"), true);
assert.equal(tacticalTopBar.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
for (const button of topBarButtons) {
  assert.equal(button.classList.contains("dream-tactical-menu-button"), false);
  assert.equal(button.classList.contains("dream-tactical-topbar-hidden"), false);
}

const tacticalRightRail = createFixture({ shellPresent: true });
tacticalRightRail.context.window.__CODEX_DREAM_SKIN_CODEBURN__ = {
  currency: "USD",
  activities: [{ name: "Coding", cost: 13.44, turns: 215, oneShotRate: 1 }],
  tokens: { total: 24630747, average: 821025, peak: 24630747, yesterday: 0 },
  dailySpend: Array.from({ length: 30 }, (_, index) => ({ date: `2026-08-${`${index + 1}`.padStart(2, "0")}`, cost: index === 29 ? 13.44 : 0 })),
};
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), tacticalRightRail.context);
const rightRail = tacticalRightRail.nodes.get("codex-dream-skin-right-rail");
assert.ok(rightRail, "The Tactical preset must render the Figma-aligned decorative right rail.");
assert.equal(rightRail.parentElement, tacticalRightRail.shellMain);
assert.equal(rightRail.getAttribute("aria-hidden"), "true");
const rightRailModules = rightRail.children.filter((node) =>
  node.classList.contains("dream-tactical-right-module"));
assert.equal(rightRailModules.length, 2);
assert.ok(rightRail.children.some((node) => node.classList.contains("dream-tactical-right-resizer")));
assert.deepEqual(rightRailModules.map((module) => module.children[0].textContent), ["UNDECIDE", "MONITOR"]);
for (const module of rightRailModules) {
  const body = module.children[1];
  assert.equal(body.classList.contains("dream-tactical-right-body"), true);
}
const monitorModule = rightRailModules.find((module) => module.dataset.dreamTacticalModule === "monitor");
assert.equal(monitorModule.children[1].children[0].classList.contains("dream-codeburn-monitor"), true);
assert.equal(monitorModule.children[1].children[0].children.length, 3,
  "CodeBurn monitor must render activity, Token, and daily-spend sections.");
assert.equal(monitorModule.children[1].children[0].children[2].children[2].children.length, 6,
  "Daily spend must label every six days plus the final day.");
tacticalRightRail.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(tacticalRightRail.nodes.get("codex-dream-skin-right-rail"), rightRail,
  "Repeated ensure passes must preserve the right rail.");
assert.equal(tacticalRightRail.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(tacticalRightRail.nodes.has("codex-dream-skin-right-rail"), false);

const nonTacticalRightRail = createFixture({ shellPresent: true });
vm.runInNewContext(buildPayload({ id: "custom" }), nonTacticalRightRail.context);
assert.equal(nonTacticalRightRail.nodes.has("codex-dream-skin-right-rail"), false);

const auxiliary = createFixture({ shellPresent: false, staleSkin: true });
const auxiliaryResult = vm.runInNewContext(payload, auxiliary.context);
assert.equal(auxiliaryResult.installed, true);
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), false);
assert.equal(auxiliary.rootStyles.has("--dream-art"), false);
assert.equal(auxiliary.rootAttributes.has("data-dream-theme-id"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), false);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), false);

auxiliary.setShellPresent(true);
auxiliary.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(auxiliary.rootClasses.has("codex-dream-skin"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-style"), true);
assert.equal(auxiliary.nodes.has("codex-dream-skin-chrome"), true);

// Collapsing the left rail removes aside.app-shell-left-panel while the main
// surface remains. The active theme must stay applied instead of flashing the
// native Codex chrome.
const collapsedSidebar = createFixture({
  shellPresent: true,
  mainPresent: true,
  sidebarPresent: false,
  staleSkin: true,
});
const collapsedResult = vm.runInNewContext(
  buildPayload({ id: "preset-codex-tactical-crt" }),
  collapsedSidebar.context,
);
assert.equal(collapsedResult.installed, true);
assert.equal(collapsedSidebar.rootClasses.has("codex-dream-skin"), true);
assert.equal(collapsedSidebar.rootClasses.has("dream-sidebar-collapsed"), true);
assert.equal(collapsedSidebar.rootStyles.has("--dream-art"), true);
assert.equal(collapsedSidebar.rootStyles.get("--dream-token-runtime-sidebar-width"), "48px");
assert.ok(collapsedSidebar.nodes.get("codex-dream-skin-footer"),
  "The global footer frame must remain mounted while the sidebar is collapsed.");
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-style"), true);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-chrome"), true);
assert.equal(collapsedSidebar.rootClasses.has("dream-theme-dark"), true);

collapsedSidebar.setSidebarPresent(false);
collapsedSidebar.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(collapsedSidebar.rootClasses.has("codex-dream-skin"), true);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-style"), true);

collapsedSidebar.setMainPresent(false);
collapsedSidebar.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(collapsedSidebar.rootClasses.has("codex-dream-skin"), false);
assert.equal(collapsedSidebar.nodes.has("codex-dream-skin-style"), false);

const configured = createFixture({
  shellPresent: true,
  homePresent: true,
  utilityPresent: true,
});
const configuredPayload = buildPayload({
  appearance: "light",
  palette: { accent: "#d45a70" },
  art: { focusX: .15, focusY: .8, safeArea: "right", taskMode: "off" },
});
const configuredResult = vm.runInNewContext(configuredPayload, configured.context);
assert.equal(configuredResult.adaptive, true);
assert.equal(configured.rootClasses.has("dream-theme-light"), true);
assert.equal(configured.rootClasses.has("dream-theme-dark"), false);
assert.equal(configured.rootClasses.has("dream-focus-left"), true);
assert.equal(configured.rootClasses.has("dream-safe-right"), true);
assert.equal(configured.rootClasses.has("dream-task-off"), true);
assert.equal(configured.rootStyles.get("--dream-art-position"), "15% 80%");
assert.equal(configured.rootStyles.get("--dream-accent"), "#d45a70");
assert.equal(configured.routeClasses.has("dream-home"), true);
assert.equal(configured.routeClasses.has("dream-task"), false);
assert.equal(configured.utilityClasses.has("dream-home-utility"), true);
assert.equal(configured.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(configured.utilityClasses.has("dream-home-utility"), false);

const tokenized = createFixture({ shellPresent: true });
const tokenizedPayload = buildPayload({
  id: "preset-codex-tactical-crt",
  appearance: "dark",
  palette: { accent: "#112233" },
  tokens: {
    colors: {
      canvas: "#090B08",
      accent: "rgb(214 166 75 / 0.9)",
      phosphor: "#4ABC23",
      positive: "#78B83A",
      lineStrong: "red; color: blue",
      lineDefault: "#12345",
      lineSubtle: "rgb(1 2 3 4)",
      unknown: "#ffffff",
    },
    strokes: { subtle: 0, default: 1, strong: 50, focus: 50.01 },
    radii: { panel: 0, control: 2, invalid: 4 },
    effects: {
      scanlineOpacity: 0.08,
      gridOpacity: 0.36,
      vignetteOpacity: 0.22,
      brandOpacity: 0.14,
    },
  },
});
vm.runInNewContext(tokenizedPayload, tokenized.context);
assert.equal(tokenized.rootAttributes.get("data-dream-theme-id"), "preset-codex-tactical-crt");
assert.equal(tokenized.rootStyles.get("--dream-token-color-canvas"), "#090B08");
assert.equal(tokenized.rootStyles.get("--dream-token-color-accent"), "rgb(214 166 75 / 0.9)");
assert.equal(tokenized.rootStyles.get("--dream-token-color-phosphor"), "#4ABC23");
assert.equal(tokenized.rootStyles.get("--dream-accent"), "rgb(214 166 75 / 0.9)",
  "The token accent must override the legacy palette accent.");
assert.equal(tokenized.rootStyles.get("--dream-token-stroke-subtle"), "0px");
assert.equal(tokenized.rootStyles.get("--dream-token-stroke-strong"), "50px");
assert.equal(tokenized.rootStyles.has("--dream-token-stroke-focus"), false);
assert.equal(tokenized.rootStyles.get("--dream-token-radius-control"), "2px");
assert.equal(tokenized.rootStyles.get("--dream-token-effect-scanline-opacity"), "0.08");
assert.equal(tokenized.rootStyles.get("--dream-token-effect-brand-opacity"), "0.14");
assert.equal(tokenized.rootStyles.has("--dream-token-effect-grid-opacity"), false);
assert.equal(tokenized.rootStyles.has("--dream-token-color-line-strong"), false);
assert.equal(tokenized.rootStyles.has("--dream-token-color-line-default"), false);
assert.equal(tokenized.rootStyles.has("--dream-token-color-line-subtle"), false);
assert.equal(tokenized.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(tokenized.rootAttributes.has("data-dream-theme-id"), false);
assert.equal(tokenized.rootStyles.has("--dream-token-color-accent"), false);
assert.equal(tokenized.rootStyles.has("--dream-token-color-phosphor"), false);
assert.equal(tokenized.rootStyles.has("--dream-token-effect-brand-opacity"), false);

const tacticalBrand = createFixture({ shellPresent: true, brandFixture: true });
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), tacticalBrand.context);
await new Promise((resolve) => setImmediate(resolve));
const brandMark = tacticalBrand.nodes.get("codex-dream-skin-brand-mark");
assert.ok(brandMark, "The Tactical preset must render the native OpenAI blossom after loading its module.");
assert.equal(brandMark.parentElement, tacticalBrand.shellMain);
assert.equal(brandMark.getAttribute("viewBox"), "0 0 21 21");
assert.equal(brandMark.children.length, 1);
assert.match(brandMark.children[0].getAttribute("d"), /^M[0-9a-z+.,\-\s]+$/i);
assert.equal(brandMark.children[0].getAttribute("fill"), "currentColor");
assert.equal(tacticalBrand.fetchCount, 1);
tacticalBrand.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(tacticalBrand.nodes.get("codex-dream-skin-brand-mark"), brandMark,
  "Repeated ensure passes must preserve the existing native brand mark.");
assert.equal(tacticalBrand.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);
assert.equal(tacticalBrand.nodes.has("codex-dream-skin-brand-mark"), false);

const customBrand = createFixture({ shellPresent: true, brandFixture: true });
vm.runInNewContext(buildPayload({ id: "custom" }), customBrand.context);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(customBrand.fetchCount, 0,
  "A custom theme must not load the native OpenAI blossom module.");
assert.equal(customBrand.nodes.has("codex-dream-skin-brand-mark"), false);

const lazyBrand = createFixture({ shellPresent: true });
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), lazyBrand.context);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(lazyBrand.fetchCount, 0);
assert.equal(lazyBrand.nodes.has("codex-dream-skin-brand-mark"), false);
lazyBrand.setBrandFixture(true);
lazyBrand.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(lazyBrand.fetchCount, 1,
  "A native brand module that appears after the initial pass must be loaded on a later ensure.");
assert.equal(lazyBrand.nodes.has("codex-dream-skin-brand-mark"), true);
assert.equal(lazyBrand.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);

const retryBrand = createFixture({
  shellPresent: true,
  brandFixture: true,
  brandFetchFailures: 1,
});
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), retryBrand.context);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(retryBrand.fetchCount, 1);
assert.equal(retryBrand.nodes.has("codex-dream-skin-brand-mark"), false);
retryBrand.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(retryBrand.fetchCount, 1,
  "A failed native brand fetch must respect the retry backoff.");
retryBrand.advanceTime(5000);
retryBrand.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(retryBrand.fetchCount, 2);
assert.equal(retryBrand.nodes.has("codex-dream-skin-brand-mark"), true,
  "The native brand mark must recover after the fetch backoff expires.");
assert.equal(retryBrand.context.window.__CODEX_DREAM_SKIN_STATE__.cleanup(), true);

const invalidBrandReinject = createFixture({ shellPresent: true, brandFixture: true });
vm.runInNewContext(buildPayload({ id: "preset-codex-tactical-crt" }), invalidBrandReinject.context);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(invalidBrandReinject.nodes.has("codex-dream-skin-brand-mark"), true);
vm.runInNewContext(buildPayload({ id: "../invalid{theme}" }), invalidBrandReinject.context);
assert.equal(invalidBrandReinject.rootAttributes.get("data-dream-theme-id"), "custom");
assert.equal(invalidBrandReinject.nodes.has("codex-dream-skin-brand-mark"), false,
  "Reinjecting an invalid theme ID must remove a Tactical-only brand mark.");

const invalidThemeId = createFixture({ shellPresent: true });
vm.runInNewContext(buildPayload({ id: "../../tactical{bad}" }), invalidThemeId.context);
assert.equal(invalidThemeId.rootAttributes.get("data-dream-theme-id"), "custom");

const tokenReinject = createFixture({ shellPresent: true });
vm.runInNewContext(tokenizedPayload, tokenReinject.context);
assert.equal(tokenReinject.rootStyles.has("--dream-token-color-positive"), true);
vm.runInNewContext(buildPayload({ id: "preset-gothic-void-crusade" }), tokenReinject.context);
assert.equal(tokenReinject.rootAttributes.get("data-dream-theme-id"), "preset-gothic-void-crusade");
assert.equal(tokenReinject.rootStyles.has("--dream-token-color-positive"), false,
  "Reinjection must not retain token variables from the previous theme.");

const analysisPixels = new Uint8ClampedArray(48 * 12 * 4);
for (let index = 0; index < 48 * 12; index += 1) {
  const offset = index * 4;
  const x = index % 48;
  const subject = x >= 34 && x <= 42;
  analysisPixels[offset] = subject ? 210 : 246;
  analysisPixels[offset + 1] = subject ? 84 : 239;
  analysisPixels[offset + 2] = subject ? 112 : 237;
  analysisPixels[offset + 3] = 255;
}
const analyzed = createFixture({
  shellPresent: true,
  analysisFixture: { naturalWidth: 1200, naturalHeight: 400, pixels: analysisPixels },
});
vm.runInNewContext(payload, analyzed.context);
await Promise.resolve();
assert.equal(analyzed.rootClasses.has("dream-theme-dark"), true);
assert.equal(analyzed.rootClasses.has("dream-theme-light"), false);
assert.equal(analyzed.rootClasses.has("dream-art-wide"), true);
assert.equal(analyzed.rootClasses.has("dream-task-banner"), true);
assert.equal(analyzed.rootClasses.has("dream-safe-left"), true);
assert.notEqual(analyzed.rootStyles.get("--dream-accent"), "rgb(216 104 119)");

const standardArt = createFixture({
  shellPresent: true,
  analysisFixture: { naturalWidth: 800, naturalHeight: 800, pixels: analysisPixels },
});
vm.runInNewContext(payload, standardArt.context);
await Promise.resolve();
assert.equal(standardArt.rootClasses.has("dream-art-standard"), true);
assert.equal(standardArt.rootClasses.has("dream-task-ambient"), true);
assert.equal(standardArt.rootClasses.has("dream-task-banner"), false);

const mediumWide = createFixture({
  shellPresent: true,
  analysisFixture: { naturalWidth: 2100, naturalHeight: 1000, pixels: analysisPixels },
});
vm.runInNewContext(payload, mediumWide.context);
await Promise.resolve();
assert.equal(mediumWide.rootClasses.has("dream-art-wide"), true);
assert.equal(mediumWide.rootClasses.has("dream-task-ambient"), true);
assert.equal(mediumWide.rootClasses.has("dream-task-banner"), false);

const nativeLight = createFixture({ shellPresent: true, shellAppearance: "light" });
vm.runInNewContext(payload, nativeLight.context);
assert.equal(nativeLight.rootClasses.has("dream-theme-light"), true);
assert.equal(nativeLight.rootClasses.has("dream-theme-dark"), false);

const nativeComputedDark = createFixture({
  shellPresent: true,
  shellAppearance: "",
  computedColorScheme: "dark",
  osAppearance: "light",
});
vm.runInNewContext(payload, nativeComputedDark.context);
assert.equal(nativeComputedDark.rootClasses.has("dream-theme-dark"), true);
assert.equal(nativeComputedDark.rootClasses.has("dream-theme-light"), false);
nativeComputedDark.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(nativeComputedDark.rootClasses.has("dream-theme-dark"), true);
const nativeObserver = nativeComputedDark.observers[0];
nativeObserver.takeRecords();
nativeComputedDark.context.window.__CODEX_DREAM_SKIN_STATE__.ensure();
assert.equal(nativeObserver.takeRecords().length, 0,
  "Sampling the native computed color-scheme must not queue a self-triggering root mutation pass.");

const metadataWide = createFixture({ shellPresent: true });
vm.runInNewContext(buildPayload({ artMetadata: { ratio: 16 / 9 } }), metadataWide.context);
assert.equal(metadataWide.rootClasses.has("dream-art-wide"), true);
assert.equal(metadataWide.rootClasses.has("dream-art-standard"), false);

console.log("PASS: renderer applies adaptive theme metadata, keeps skin without a sidebar, and preserves transparent auxiliary windows.");
