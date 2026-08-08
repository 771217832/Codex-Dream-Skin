import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readImageMetadata } from "../scripts/image-metadata.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const windowsRoot = path.resolve(here, "..");
const presetId = "preset-codex-tactical-crt";
const presetRoot = path.join(windowsRoot, "presets", presetId);
const cssPath = path.join(windowsRoot, "assets", "presets", `${presetId}.css`);
const [css, themeText, background, assetNotes, injectorSource, rendererSource] = await Promise.all([
  fs.readFile(cssPath, "utf8"),
  fs.readFile(path.join(presetRoot, "theme.json"), "utf8"),
  fs.readFile(path.join(presetRoot, "background.jpg")),
  fs.readFile(path.join(presetRoot, "ASSET.md"), "utf8"),
  fs.readFile(path.join(windowsRoot, "scripts", "injector.mjs"), "utf8"),
  fs.readFile(path.join(windowsRoot, "assets", "renderer-inject.js"), "utf8"),
]);

const theme = JSON.parse(themeText);
assert.equal(theme.id, presetId);
assert.equal(theme.name, "Codex Tactical CRT");
assert.equal(theme.appearance, "dark");
assert.deepEqual(theme.art, {
  focusX: 0.5,
  focusY: 0.5,
  safeArea: "none",
  taskMode: "ambient",
});
assert.deepEqual(theme.tokens.colors, {
  canvas: "#030201",
  surface: "#080403",
  surfaceRaised: "#120804",
  textPrimary: "#E6D7B0",
  textSecondary: "#B8A477",
  accent: "#D7AD55",
  phosphor: "#49B81F",
  positive: "#48CB22",
  lineStrong: "rgb(195 116 18 / 0.94)",
  lineDefault: "rgb(195 116 18 / 0.78)",
  lineSubtle: "rgb(195 116 18 / 0.24)",
});
assert.deepEqual(theme.tokens.strokes, { subtle: 1, default: 1, strong: 2, focus: 2, projectTree: 2 });
assert.deepEqual(theme.tokens.radii, { panel: 0, control: 0 });
assert.deepEqual(theme.tokens.effects, {
  scanlineWidth: 2,
  scanlineDepth: 0.26,
  scanlineSpeed: 1.8,
  gridOpacity: 0.08,
  vignetteOpacity: 0.28,
  brandOpacity: 0.13,
});
assert.deepEqual(theme.tokens.layout, {
  titleHeight: 38,
  headerHeight: 55,
  navigationRowHeight: 36,
  navigationFontSize: 22,
});

assert.deepEqual(readImageMetadata(background, ".jpg"), {
  width: 2560,
  height: 1440,
  ratio: 2560 / 1440,
  wide: true,
  aspect: "wide",
  taskMode: "ambient",
});
assert.ok(background.byteLength < 16 * 1024 * 1024);
assert.match(assetNotes, /Generation prompt/i);
assert.match(assetNotes, /2560.*1440/i);

const defaultsStart = css.indexOf("DREAM_TOKEN_DEFAULTS_START");
const defaultsEnd = css.indexOf("DREAM_TOKEN_DEFAULTS_END");
assert.ok(defaultsStart >= 0 && defaultsEnd > defaultsStart, "Token default markers must be ordered.");
const cssOutsideDefaults = `${css.slice(0, defaultsStart)}${css.slice(defaultsEnd)}`;
assert.doesNotMatch(
  cssOutsideDefaults,
  /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|oklab)\s*\(|(?<![-\w])(?:transparent|currentcolor)\b/gi,
  "Color literals are only allowed in the centralized token defaults block.",
);
assert.doesNotMatch(
  cssOutsideDefaults,
  /\bborder(?:-(?:top|right|bottom|left))?\s*:\s*(?:\d*\.)?\d+(?:px)?\b/gi,
  "Fixed border widths are forbidden outside token defaults.",
);
assert.doesNotMatch(
  cssOutsideDefaults,
  /\bborder-radius\s*:\s*(?:\d*\.)?\d+(?:px)?\b/gi,
  "Fixed radii are forbidden outside token defaults.",
);
assert.doesNotMatch(
  cssOutsideDefaults,
  /(?:^|[;{])\s*opacity\s*:\s*(?:\d*\.)?\d+\b/gim,
  "Fixed effect opacity is forbidden outside token defaults.",
);
for (const match of cssOutsideDefaults.matchAll(/var\((--[^),]+)/g)) {
  assert.ok(match[1].startsWith("--dream-token-"),
    `Tactical selector bypasses the token namespace: ${match[1]}`);
}

const scope = `[data-dream-theme-id="${presetId}"]`;
const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, "");
const selectorHeaders = [...uncommented.matchAll(/([^{}]+)\{/g)]
  .map((match) => match[1].trim())
  .filter((header) => !header.startsWith("@") && !/^\d+%$/.test(header));
for (const header of selectorHeaders) {
  for (const selector of header.split(",")) {
    assert.ok(selector.includes(scope), `Unscoped Tactical CRT selector: ${selector.trim()}`);
  }
}

const nativeColorVariables = [
  "--color-token-main-surface-primary",
  "--color-token-side-bar-background",
  "--color-token-dropdown-background",
  "--color-token-text-primary",
  "--color-token-text-secondary",
  "--color-token-border-default",
  "--color-token-focus-border",
];
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const property of nativeColorVariables) {
  const declaration = new RegExp(
    `${escapeRegExp(property)}\\s*:\\s*var\\(\\s*--dream-token-[^)]+\\)\\s*;`,
    "i",
  );
  assert.match(css, declaration,
    `Native Codex color variable ${property} must map to a Tactical design token.`);
}

const highSpecificitySelectors = selectorHeaders
  .flatMap((header) => header.split(","))
  .map((selector) => selector.trim())
  .filter((selector) => selector.includes(scope)
    && selector.includes(":root")
    && selector.includes(".dream-art-wide"));
assert.ok(highSpecificitySelectors.length >= 3,
  "Tactical CRT must include multiple scoped dream-art-wide overrides that outrank the base wide-art skin.");
for (const target of ["body", "aside.app-shell-left-panel", "main.main-surface"]) {
  assert.ok(highSpecificitySelectors.some((selector) => selector.includes(target)),
    `Missing a high-specificity dream-art-wide override for ${target}.`);
}
assert.match(css, /#codex-dream-skin-chrome\s*\{[\s\S]*?pointer-events:\s*none/i);
assert.match(css, /\.dream-sidebar-navigation-head\s*\{[\s\S]*?border:/i);
assert.match(css, /\.dream-sidebar-navigation-body\s*\{[\s\S]*?border:/i);
assert.match(css, /\.dream-sidebar-navigation-body\s*\{[\s\S]*?position:\s*sticky[\s\S]*?z-index:\s*2[\s\S]*?top:\s*0/i);
assert.match(css, /--dream-token-layout-navigation-row-height:\s*48px/i);
assert.match(css, /--dream-token-layout-navigation-font-size:\s*22px/i);
assert.match(css, /\.global-command-menu-dialog\[role="dialog"\]\s*\{[\s\S]*?--dream-token-runtime-search-bottom[\s\S]*?translate:\s*none\s*!important[\s\S]*?transform:\s*none\s*!important/i);
assert.match(css, /\.dream-tactical-search::after\s*\{[\s\S]*?content:\s*"SEARCH"/i);
assert.match(css, /\.dream-tactical-pull-requests\s*\{[\s\S]*?position:\s*absolute\s*!important[\s\S]*?--dream-token-layout-navigation-row-height/i);
assert.match(css, /\.dream-tactical-mode-switch::before\s*\{[\s\S]*?content:\s*"MODE \/\/"/i);
assert.match(css, /\.dream-tactical-mode-option\[data-dream-tactical-mode-target="work"\]\s*\{[\s\S]*?9ch/i);
assert.match(css, /\.dream-tactical-mode-option\[data-dream-tactical-mode-target="codex"\]\s*\{[\s\S]*?15ch/i);
assert.match(css, /dream-tactical-mode-selecting[\s\S]*?\[role="menu"\][\s\S]*?opacity:\s*var\(--dream-token-effect-hidden-opacity\)\s*!important/i);
assert.match(css, /\.dream-tactical-navigation-item::before[\s\S]*?content:\s*attr\(data-dream-tactical-nav-index\)/i);
assert.match(css, /\.dream-tactical-navigation-item::after[\s\S]*?content:\s*attr\(data-dream-tactical-nav-label\)/i);
assert.ok(rendererSource.includes(
  'modeSwitch.dataset.dreamTacticalMode = /CURRENT MODE:\\s*CODEX/i.test(currentMode)',
));
assert.match(rendererSource, /\?\s*"codex"\s*:\s*"work"/i);
assert.match(rendererSource, /memoizedProps\?\.onSelect[\s\S]*?onSelect\?\.\(\)/i);
assert.match(rendererSource, /match:\s*"NEW TASK"[\s\S]*?index:\s*"01"[\s\S]*?label:\s*"NEW_TASK"/i);
assert.match(css, /\.dream-sidebar-projects\s*\{[\s\S]*?border:/i);
assert.match(css, /--dream-token-label-navigation:\s*"NAVIGATION"/i);
assert.match(css, /--dream-token-label-projects:\s*"PROJECT"/i);
assert.match(css, /--dream-token-label-main:\s*"MAINTASK"/i);
assert.match(css, /--dream-token-label-undecide:\s*"DETAIL"/i);
assert.match(css, /--dream-token-label-monitor:\s*"MONITOR"/i);
assert.match(css, /--dream-token-layout-app-bar-height:\s*50\.4px/i);
assert.match(css, /--dream-token-layout-footer-height:\s*48px/i);
assert.match(css, /--dream-token-layout-panel-gap:\s*6px/i);
assert.match(css, /--dream-token-layout-section-gap:\s*6px/i);
assert.match(css, /--dream-token-layout-project-title-height:\s*var\(--dream-token-layout-title-height\)/i);
assert.match(css, /--dream-token-layout-header-inset:\s*4px/i);
assert.match(css, /--dream-token-layout-menu-button-width:\s*126px/i);
assert.match(css, /--dream-token-layout-active-shell-gap:\s*var\(--dream-token-layout-shell-gap\)/i);
assert.match(css, /@media \(max-width:\s*980px\)[\s\S]*?--dream-token-layout-active-shell-gap:\s*var\(--dream-token-layout-shell-gap-compact\)/i);
assert.match(css, /--dream-token-color-accent-hot:\s*color-mix\([\s\S]*?--dream-token-color-accent/i);
assert.match(css, /--dream-token-effect-bloom-opacity:\s*0\.36/i);
assert.match(css, /--dream-token-effect-scanline-width:\s*2px/i);
assert.match(css, /--dream-token-effect-scanline-depth:\s*var\(--dream-token-effect-scanline-opacity\)/i);
assert.match(css, /--dream-token-effect-scanline-speed:\s*1\.8s/i);
assert.match(css, /#codex-dream-skin-chrome::before\s*\{[\s\S]*?opacity:\s*var\(--dream-token-effect-scanline-depth\)[\s\S]*?animation:\s*dream-tactical-scanlines-scroll\s+var\(--dream-token-effect-scanline-speed\)/i);
assert.match(css, /@keyframes\s+dream-tactical-scanlines-scroll[\s\S]*?background-position:\s*0\s+calc\(var\(--dream-token-effect-scanline-width\)\s*\*\s*3\)/i);
assert.match(css, /\.dream-tactical-bloom\s*\{[\s\S]*?opacity:\s*var\(--dream-token-effect-bloom-opacity\)[\s\S]*?backdrop-filter:\s*blur\(5px\) brightness\(1\.28\) saturate\(1\.2\)/i);
assert.match(css, /dream-scanline-off[\s\S]*?#codex-dream-skin-chrome::before\s*\{[\s\S]*?opacity:\s*var\(--dream-token-effect-hidden-opacity\)[\s\S]*?animation:\s*none/i);
assert.match(css, /dream-gloom-off[\s\S]*?\.dream-tactical-bloom\s*\{[\s\S]*?opacity:\s*var\(--dream-token-effect-hidden-opacity\)/i);
assert.match(css, /#codex-dream-skin-brand-mark\s*\{[\s\S]*?display:\s*none/i);
assert.match(css, /#codex-dream-skin-footer\s*\{[\s\S]*?position:\s*fixed/i);
assert.match(css, /\.dream-footer-online\s*\{[\s\S]*?--dream-token-color-positive/i);
assert.match(css, /\.dream-footer-clock\s*\{[\s\S]*?right:/i);
assert.match(css, /\.dream-footer-theme\s*\{[\s\S]*?pointer-events:\s*auto/i);
assert.match(css, /\.dream-footer-theme-button\s*\{[\s\S]*?width:\s*16px[\s\S]*?height:\s*16px/i);
assert.match(css, /\.dream-footer-theme-button\[aria-pressed="true"\]\s*\{[\s\S]*?--dream-token-color-accent/i);
assert.match(css, /\.dream-footer-effect-button\[aria-pressed="true"\]\s*\{[\s\S]*?--dream-token-color-accent/i);
assert.match(css, /\.dream-tactical-footer-extra-control\s*\{[\s\S]*?display:\s*none/i);
assert.match(css, /#codex-dream-skin-right-rail\s*\{[\s\S]*?display:\s*none/i);
assert.match(css, /@media \(min-width:\s*1180px\)[\s\S]*?#codex-dream-skin-right-rail\s*\{[\s\S]*?display:\s*grid/i);
assert.match(css, /\.dream-tactical-right-body\s*\{[\s\S]*?background:\s*var\(--dream-token-color-canvas\)/i);
assert.match(css, /dream-tactical-right-module:has\(> \.dream-tactical-right-body\[data-dream-tactical-detail-key="native-popover"\]\)[\s\S]*?background:\s*var\(--dream-token-color-transparent\)/i);
assert.match(css, /dream-tactical-summary-relocated[\s\S]*?--thread-wide-block-inline-shift[\s\S]*?transform:\s*none\s*!important/i);
assert.match(css, /\*::before,[\s\S]*?\*::after\s*\{[\s\S]*?border-radius:\s*var\(--dream-token-radius-control\)\s*!important/i,
  "Tactical CRT must remove radii from native and injected UI shapes.");
assert.match(css, /dream-tactical-native-detail-source[\s\S]*?data-app-shell-tab-strip-controller="right"[\s\S]*?display:\s*flex\s*!important/i);
assert.match(css, /dream-tactical-native-detail-source[\s\S]*?::before\s*\{[\s\S]*?content:\s*var\(--dream-token-label-main\)/i);
assert.match(css, /\.dream-tactical-conversation-tab\s*\{[\s\S]*?flex:\s*0\s+0\s+132px/i);
assert.match(css, /dream-tactical-native-conversation-active\s*\{[\s\S]*?background:\s*var\(--dream-token-color-transparent\)\s*!important/i);
assert.match(css, /dream-tactical-native-conversation-active[\s\S]*?data-app-shell-tab-panel-controller="right"[\s\S]*?visibility:\s*hidden\s*!important/i);
assert.match(rendererSource, /syncTacticalNativeConversationTab[\s\S]*?CONVERSATION/i);
assert.match(css, /dream-tactical-detail-popover-source\[data-pip-obstacle="thread-summary-panel"\]\s*\{[\s\S]*?height:\s*var\(--dream-token-runtime-detail-popover-height\)/i);
const tacticalPopoverSource = rendererSource.match(
  /const tacticalPopoverForDetail[\s\S]*?const syncTacticalDetailPopover/,
)?.[0] || "";
assert.match(tacticalPopoverSource, /querySelectorAll\('\[data-pip-obstacle="thread-summary-panel"\]'\)[\s\S]*?return summary \|\| null/i);
assert.doesNotMatch(tacticalPopoverSource, /data-radix-popper|role="(?:menu|listbox|dialog)"/i,
  "DETAIL must not capture user-triggered menus and dialogs.");
assert.match(rendererSource, /summaryChanged[\s\S]*?addedNodes[\s\S]*?removedNodes[\s\S]*?ensure\(\)/i);
assert.match(css, /\.dream-codeburn-monitor\s*\{[\s\S]*?display:\s*grid/i);
assert.match(css, /\.dream-codeburn-table\s+\.dream-codeburn-header\s*\{[\s\S]*?background:\s*var\(--dream-token-color-accent\)/i);
assert.match(css, /\.dream-codeburn-spend\s*\{[\s\S]*?linear-gradient\(to right[\s\S]*?linear-gradient\(to bottom[\s\S]*?background-size:\s*10px\s+10px/i);
assert.match(css, /\.dream-codeburn-bars\s*\{[\s\S]*?grid-template-columns:\s*repeat\(30/i);
assert.match(css, /\.dream-codeburn-bars\s*\{[\s\S]*?background:\s*none/i);
assert.match(css, /\.dream-codeburn-bars span\s*\{[\s\S]*?repeating-linear-gradient\(to bottom/i);
assert.match(css, /\.dream-codeburn-bars span\s*\{[\s\S]*?var\(--dream-token-color-accent\)/i);
assert.match(css, /\.dream-codeburn-bars span\s*\{[\s\S]*?var\(--dream-token-color-transparent\)[\s\S]*?4px/i);
assert.match(css, /\.dream-codeburn-axis\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?grid-template-columns:\s*repeat\(30/i);
assert.match(css, /\.dream-codeburn-scale\s*\{[\s\S]*?grid-column:\s*1[\s\S]*?grid-template-rows:\s*repeat\(3/i);
assert.match(css, /\.dream-sidebar-native-footer\s*\{[\s\S]*?position:\s*fixed/i);
assert.match(css, /vertical-scroll-fade-mask\s*\{[\s\S]*?scrollbar-width:\s*none\s*!important/i);
assert.match(css, /vertical-scroll-fade-mask\s*\{[\s\S]*?overflow:\s*hidden\s*!important/i);
assert.match(css, /vertical-scroll-fade-mask\s*\{[\s\S]*?mask-image:\s*none\s*!important/i);
assert.match(css, /aside\.app-shell-left-panel\s*>\s*\[class~="max-w-full"\]\s*\{[\s\S]*?width:\s*100%\s*!important[\s\S]*?min-width:\s*0\s*!important[\s\S]*?flex:\s*1\s+1\s+auto\s*!important/i);
assert.doesNotMatch(css, /aside\.app-shell-left-panel\s*\{[\s\S]*?width:\s*var\(--dream-token-layout-left-rail-width\)\s*!important/i,
  "The Tactical preset must not override Codex's native resizable sidebar width.");
assert.match(css, /\.dream-sidebar-projects\s*\{[\s\S]*?overflow-y:\s*auto\s*!important/i);
assert.match(css, /#codex-dream-skin-project-scrollbar\s*\{[\s\S]*?position:\s*absolute[\s\S]*?right:\s*calc\([\s\S]*?pointer-events:\s*auto[\s\S]*?touch-action:\s*none/i);
assert.match(css, /#codex-dream-skin-project-bottom-frame\s*\{[\s\S]*?border-left:\s*var\(--dream-token-stroke-strong\)[\s\S]*?border-bottom:\s*var\(--dream-token-stroke-strong\)/i);
assert.match(rendererSource, /layoutObserver\?\.observe\?\.\(tacticalAside\)[\s\S]*?layoutObserver\?\.observe\?\.\(tacticalProjects\)/i);
assert.match(css, /\.dream-sidebar-projects\s*>\s*div\s*>\s*\[class~="group\/nav-section-title"\]\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin-inline:\s*0/i);
assert.match(css, /\[data-app-action-sidebar-project-list-id\]::before\s*\{[\s\S]*?--dream-token-color-line-default/i);
assert.match(css, /--dream-token-stroke-project-tree:\s*2px/i);
assert.match(css, /\[data-app-action-sidebar-project-list-id\]::before\s*\{[\s\S]*?width:\s*var\(--dream-token-stroke-project-tree\)/i);
assert.match(css, /\[data-app-action-sidebar-thread-row\]::before\s*\{[\s\S]*?border-top:\s*var\(--dream-token-stroke-project-tree\)/i);
assert.match(css, /\[data-app-action-sidebar-thread-row\]::after\s*\{[\s\S]*?content:\s*"\[DONE\]"/i);
assert.match(css, /\[data-app-action-sidebar-thread-row\]:has\(\.animate-spin\)::after\s*\{[\s\S]*?\[WORKING\][\s\S]*?\[LIVE\] IN PROGRESS/i);
assert.doesNotMatch(css, /\[data-app-action-sidebar-thread-active="true"\][^\{]*::after\s*\{[\s\S]*?\[WORKING\]/i,
  "WORKING must follow each row's native running marker, not the selected task.");
assert.match(css, /\.dream-tactical-topbar-hidden\s*\{[\s\S]*?display:\s*none/i);
assert.match(css, /\.dream-tactical-menu-button::before\s*\{[\s\S]*?--dream-token-layout-menu-icon-size/i);
assert.match(css, /--dream-token-module-icon-navigation:\s*url\("\.\.\/icons\/gps-line\.svg"\)/i);
assert.match(css, /--dream-token-module-icon-project:\s*url\("\.\.\/icons\/file-list-line\.svg"\)/i);
assert.match(css, /--dream-token-module-icon-main:\s*url\("\.\.\/icons\/chat-2-line\.svg"\)/i);
assert.match(css, /--dream-token-module-icon-menu-file:\s*url\("\.\.\/icons\/file-list-line\.svg"\)/i);
assert.match(css, /--dream-token-module-icon-menu-edit:\s*url\("\.\.\/icons\/edit-2-fill\.svg"\)/i);
assert.match(css, /--dream-token-module-icon-menu-view:\s*url\("\.\.\/icons\/eye-line\.svg"\)/i);
assert.match(css, /--dream-token-module-icon-menu-help:\s*url\("\.\.\/icons\/question-mark\.svg"\)/i);
assert.match(css, /\.dream-sidebar-navigation-head::before\s*\{[\s\S]*?--dream-token-module-icon-navigation/i);
assert.match(css, /\.dream-tactical-menu-file::after\s*\{[\s\S]*?content:\s*"01"/i);
assert.match(css, /\.dream-tactical-menu-edit::after\s*\{[\s\S]*?content:\s*"04"/i);
assert.match(css, /\.dream-tactical-menu-file::before\s*\{[\s\S]*?--dream-token-module-icon-menu-file/i);
assert.match(css, /\.dream-tactical-menu-edit::before\s*\{[\s\S]*?--dream-token-module-icon-menu-edit/i);
assert.match(css, /\.dream-tactical-menu-view::before\s*\{[\s\S]*?--dream-token-module-icon-menu-view/i);
assert.match(css, /\.dream-tactical-menu-help::before\s*\{[\s\S]*?--dream-token-module-icon-menu-help/i);
assert.match(css, /\.dream-tactical-menu-button\s*\{[\s\S]*?background:\s*var\(--dream-token-color-accent\)/i);
assert.match(css, /\.dream-tactical-menu-button:hover\s*\{[\s\S]*?background:\s*var\(--dream-token-color-canvas\)/i);
assert.match(css, /\.dream-tactical-menu-button\[aria-expanded="true"\][\s\S]*?background:\s*var\(--dream-token-color-canvas\)/i);
assert.match(css, /\.dream-sidebar-navigation-body button:hover[\s\S]*?background:\s*var\(--dream-token-color-accent\)/i);
assert.match(css, /\.dream-sidebar-navigation-head::before\s*\{[\s\S]*?background:\s*var\(--dream-token-color-transparent\)/i);
assert.match(css, /\.dream-sidebar-projects\s*>\s*div\s*>\s*\[class~="group\/nav-section-title"\]\s*\{[\s\S]*?background:\s*var\(--dream-token-color-transparent\)/i);
assert.match(css, /main\.main-surface\s*>\s*header\.app-header-tint::before\s*\{[\s\S]*?background:\s*var\(--dream-token-color-transparent\)/i);
assert.match(css, /main\.main-surface\s*>\s*header\.app-header-tint[^\{]*\{[\s\S]*?border-bottom:\s*var\(--dream-token-stroke-strong\) solid var\(--dream-token-color-line-strong\)/i);
assert.match(css, /@media\s*\(min-width:\s*1180px\)[\s\S]*?main\.main-surface\s*>\s*header\.app-header-tint\s*\{[\s\S]*?right:\s*auto\s*!important[\s\S]*?width:\s*calc\(100% - var\(--dream-token-layout-right-rail-total\)\)/i);
assert.match(css, /@media\s*\(min-width:\s*1180px\)[\s\S]*?dream-task-ambient[^\{]*\{[\s\S]*?border:\s*none\s*!important/i);
assert.match(css, /main\.main-surface:not\(\.dream-home-shell\)::before[^\{]*\{[\s\S]*?z-index:\s*30\s*!important[\s\S]*?opacity:\s*var\(--dream-token-effect-visible-opacity\)\s*!important[\s\S]*?background:\s*var\(--dream-token-color-transparent\)\s*!important[\s\S]*?border:\s*var\(--dream-token-stroke-strong\) solid var\(--dream-token-color-line-strong\)\s*!important/i);
assert.match(css, /\.dream-tactical-right-title\s*\{[\s\S]*?background:\s*var\(--dream-token-color-transparent\)/i);
assert.match(css, /#codex-dream-skin-footer\s*\{[\s\S]*?border:\s*var\(--dream-token-stroke-strong\) solid var\(--dream-token-color-line-strong\)/i);
assert.match(css, /aside\.app-shell-left-panel::before\s*\{[\s\S]*?box-shadow:\s*var\(--dream-token-shadow-none\)/i);
assert.match(css, /\.dream-composer-input-line\s*\[contenteditable="true"\]\s*\{[\s\S]*?caret-shape:\s*block/i);
assert.match(css, /\.vertical-scroll-fade-mask::-webkit-scrollbar\s*\{[\s\S]*?width:\s*var\(--dream-token-layout-scrollbar\)/i);
assert.match(css, /#codex-dream-skin-project-scrollbar\s*\{[\s\S]*?display:\s*none/i);
assert.match(injectorSource, /inlineManagedPresetAssetUrls\(css, realPresetPath\)/i);
assert.match(injectorSource, /data:\$\{mime\};base64/i);
assert.match(css, /\.dream-main-composer-section\s*\{[\s\S]*?position:\s*sticky\s*!important[\s\S]*?min-height:\s*118px[\s\S]*?max-height:\s*30%/i);
assert.match(css, /\.dream-main-composer-section\s*\{[\s\S]*?overflow:\s*visible\s*!important/i);
assert.match(css, /\.dream-main-composer-section::before\s*\{[\s\S]*?content:\s*none/i);
assert.match(css, /\.dream-main-composer-section::after\s*\{[\s\S]*?content:\s*none/i);
assert.match(css, /\.dream-composer-input-line\s*\{[\s\S]*?overflow:\s*visible\s*!important/i);
assert.match(css, /\.composer-surface-chrome\s*\{[\s\S]*?overflow:\s*visible\s*!important/i);
assert.match(css, /\.dream-composer-input-line::before\s*\{[\s\S]*?content:\s*">:"/i);
assert.match(css, /\.dream-composer-status-bar\s*\{[\s\S]*?border-top:/i);
assert.match(css, /\.composer-surface-chrome\s*,[\s\S]*?border:\s*none[\s\S]*?box-shadow:\s*var\(--dream-token-shadow-none\)/i);
assert.match(css, /\[data-message-author-role="user"\] \*::before[\s\S]*?outline:\s*none\s*!important/i);
assert.match(css, /\[data-user-message-bubble="true"\]\s*\{[\s\S]*?box-shadow:\s*var\(--dream-token-shadow-none\)/i);
assert.match(css, /\[data-turn-key\]:has\(\[data-user-message-bubble="true"\]\) \[role="button"\]\.size-20[\s\S]*?border:\s*none\s*!important/i);
assert.match(css, /--dream-token-layout-cli-prompt-column:\s*76px/i);
assert.match(css, /\[data-thread-find-target="conversation"\]\s*\{[\s\S]*?gap:\s*0\s*!important/i);
assert.match(css, /\[data-turn-key\]\s*\{[\s\S]*?--conversation-item-gap:\s*4px[\s\S]*?font:[\s\S]*?--dream-token-font-chrome/i);
assert.match(css, /\[data-local-conversation-user-anchor="true"\]::before\s*\{[\s\S]*?content:\s*"YOU >"/i);
assert.match(css, /\[data-content-search-unit-key\$=":assistant"\]::before\s*\{[\s\S]*?content:\s*"CODEX >"/i);
assert.match(css, /\[data-local-conversation-item-target-ids\]::before\s*\{[\s\S]*?content:\s*"SYSTEM"/i);
assert.match(css, /\[data-local-conversation-item-target-ids\]:has\(button\[aria-expanded="false"\]\)\s*>\s*div\s*\{[\s\S]*?height:\s*auto\s*!important[\s\S]*?max-height:\s*none\s*!important[\s\S]*?overflow:\s*visible/i);
assert.match(css, /\[data-local-conversation-item-target-ids\] button\[aria-expanded="false"\]\s*\{[\s\S]*?min-height:\s*20px[\s\S]*?height:\s*auto\s*!important[\s\S]*?align-items:\s*center/i);
assert.doesNotMatch(css, /span\.text-token-conversation-body:not\(button span\)::before\s*\{[\s\S]*?content:\s*"\* /i);
assert.doesNotMatch(css, /\[data-local-conversation-item-target-ids\]:has\(button\[aria-expanded="false"\] img\)\s*>\s*div\s*\{[\s\S]*?display:\s*none/i);
assert.match(css, /pre\.dream-cli-collapsible\[data-dream-cli-expanded="false"\][\s\S]*?max-height:\s*28px/i);
assert.match(css, /\[data-dream-cli-kind="IMAGE"\]\[data-dream-cli-expanded="false"\][\s\S]*?height:\s*28px/i);
assert.match(css, /\[data-dream-cli-expanded="true"\]\s*\{[\s\S]*?max-height:\s*none/i);
assert.equal([...css.matchAll(/@keyframes\s+dream-tactical-scanlines-scroll/gi)].length, 1,
  "The Tactical preset must define exactly one scanline animation.");
assert.doesNotMatch(css, /@keyframes\s+(?!dream-tactical-scanlines-scroll\b)/i,
  "No unrelated ambient animation should be introduced.");

assert.match(injectorSource, /loadManagedPresetCss/);
assert.match(injectorSource, /assets["'],\s*["']presets/);
assert.match(injectorSource, /removeAttribute\(['"]data-dream-theme-id['"]\)/);
assert.match(injectorSource, /startsWith\(['"]--dream-token-['"]\)/);
for (const ownedMarker of [
  "dream-home-utility",
  "dream-summary-panel",
  "dream-sidebar-navigation-head",
  "dream-sidebar-navigation-body",
  "dream-sidebar-projects",
  "dream-sidebar-tasks",
  "dream-sidebar-native-footer",
  "dream-tactical-footer-extra-control",
  "dream-main-thread-scroll",
  "dream-main-composer-section",
  "dream-composer-input-line",
  "dream-composer-status-bar",
  "codex-dream-skin-footer",
  "codex-dream-skin-project-scrollbar",
  "codex-dream-skin-brand-mark",
  "codex-dream-skin-right-rail",
  "dream-tactical-menu-button",
  "dream-tactical-topbar-hidden",
]) {
  assert.match(injectorSource, new RegExp(ownedMarker),
    `Fallback cleanup must name the renderer-owned marker ${ownedMarker}.`);
}
assert.doesNotMatch(injectorSource, /readdirSync|readdir\s*\(/,
  "Managed preset CSS must be selected by theme ID, not discovered by scanning directories.");

const injector = path.join(windowsRoot, "scripts", "injector.mjs");
const checkPayload = (themeDirectory) => {
  const result = spawnSync(process.execPath, [injector, "--check-payload", "--theme-dir", themeDirectory], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
const tacticalPayload = checkPayload(presetRoot);
assert.ok(tacticalPayload.managedPresetCssBytes > 0);
assert.equal(tacticalPayload.tokens.colors.accent, "#D7AD55");
assert.equal(tacticalPayload.tokens.colors.phosphor, "#49B81F");
assert.equal(tacticalPayload.tokens.strokes.focus, 2);
assert.equal(tacticalPayload.tokens.strokes.projectTree, 2);
assert.equal(tacticalPayload.tokens.effects.brandOpacity, 0.13);
assert.equal(tacticalPayload.tokens.layout.titleHeight, 38);
assert.equal(tacticalPayload.tokens.layout.headerHeight, 55);
assert.equal(tacticalPayload.tokens.layout.navigationRowHeight, 36);
assert.equal(tacticalPayload.tokens.layout.navigationFontSize, 22);
const gothicPayload = checkPayload(path.join(windowsRoot, "presets", "preset-gothic-void-crusade"));
assert.equal(gothicPayload.managedPresetCssBytes, 0,
  "A preset without managed CSS must continue with the base theme only.");

const invalidFixture = await fs.mkdtemp(path.join(os.tmpdir(), "dream-tactical-token-test-"));
try {
  await fs.writeFile(path.join(invalidFixture, "background.jpg"), background);
  await fs.writeFile(path.join(invalidFixture, "theme.json"), JSON.stringify({
    id: "INVALID;{}",
    image: "background.jpg",
    appearance: "dark",
    tokens: {
      colors: {
        canvas: "#010203",
        phosphor: "#00ff66",
        accent: "red; background: blue",
        positive: "#12345",
        lineDefault: "rgb(not-a-color)",
        lineSubtle: "oklch(1 2 3 4)",
        unknown: "#ffffff",
      },
      strokes: { subtle: 0, default: 50, strong: 50.01, projectTree: 3 },
      radii: { panel: 0, control: 16, tooLarge: 17 },
      effects: {
        scanlineOpacity: 0,
        scanlineWidth: 12,
        scanlineDepth: 0.6,
        scanlineSpeed: 120,
        gridOpacity: 0.35,
        vignetteOpacity: 0.351,
        brandOpacity: 0.36,
      },
      layout: {
        titleHeight: 23,
        headerHeight: 39,
        navigationRowHeight: 35,
        navigationFontSize: 31,
      },
      unknown: { injected: "#ffffff" },
    },
  }));
  const sanitized = checkPayload(invalidFixture);
  assert.equal(sanitized.themeId, "custom");
  assert.equal(sanitized.managedPresetCssBytes, 0);
  assert.deepEqual(sanitized.tokens, {
    colors: { canvas: "#010203", phosphor: "#00ff66" },
    strokes: { subtle: 0, default: 50, projectTree: 3 },
    radii: { panel: 0, control: 16 },
    effects: {
      scanlineOpacity: 0,
      scanlineWidth: 12,
      scanlineDepth: 0.6,
      scanlineSpeed: 120,
      gridOpacity: 0.35,
    },
    layout: {},
  });
} finally {
  await fs.rm(invalidFixture, { recursive: true, force: true });
}

console.log("PASS: Tactical CRT preset is scoped, token-disciplined, documented, and 2560x1440.");
