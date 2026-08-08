((cssText, artDataUrl, rawConfig) => {
  const STATE_KEY = "__CODEX_DREAM_SKIN_STATE__";
  const STYLE_ID = "codex-dream-skin-style";
  const CHROME_ID = "codex-dream-skin-chrome";
  const THEME_ATTRIBUTE = "data-dream-theme-id";
  const THEME_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const CSS_NUMBER = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?`;
  const CSS_HUE = String.raw`[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:deg|grad|rad|turn)?`;
  const CSS_HEX_COLOR_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
  const CSS_FUNCTION_COLOR_PATTERNS = [
    new RegExp(String.raw`^rgb\(\s*${CSS_NUMBER}\s+${CSS_NUMBER}\s+${CSS_NUMBER}(?:\s*\/\s*${CSS_NUMBER})?\s*\)$`, "i"),
    new RegExp(String.raw`^rgb\(\s*${CSS_NUMBER}\s*,\s*${CSS_NUMBER}\s*,\s*${CSS_NUMBER}(?:\s*,\s*${CSS_NUMBER})?\s*\)$`, "i"),
    new RegExp(String.raw`^hsl\(\s*${CSS_HUE}\s+${CSS_NUMBER}\s+${CSS_NUMBER}(?:\s*\/\s*${CSS_NUMBER})?\s*\)$`, "i"),
    new RegExp(String.raw`^hsl\(\s*${CSS_HUE}\s*,\s*${CSS_NUMBER}\s*,\s*${CSS_NUMBER}(?:\s*,\s*${CSS_NUMBER})?\s*\)$`, "i"),
    new RegExp(String.raw`^oklch\(\s*${CSS_NUMBER}\s+${CSS_NUMBER}\s+${CSS_HUE}(?:\s*\/\s*${CSS_NUMBER})?\s*\)$`, "i"),
    new RegExp(String.raw`^oklab\(\s*${CSS_NUMBER}\s+${CSS_NUMBER}\s+${CSS_NUMBER}(?:\s*\/\s*${CSS_NUMBER})?\s*\)$`, "i"),
  ];
  const isSafeCssColor = (value) => {
    const syntaxValid = CSS_HEX_COLOR_PATTERN.test(value) ||
      CSS_FUNCTION_COLOR_PATTERNS.some((pattern) => pattern.test(value));
    if (!syntaxValid) return false;
    try {
      return typeof globalThis.CSS?.supports !== "function" || globalThis.CSS.supports("color", value);
    } catch {
      return false;
    }
  };
  const TOKEN_PROPERTY_MAP = {
    colors: {
      canvas: "--dream-token-color-canvas",
      surface: "--dream-token-color-surface",
      surfaceRaised: "--dream-token-color-surface-raised",
      textPrimary: "--dream-token-color-text-primary",
      textSecondary: "--dream-token-color-text-secondary",
      accent: "--dream-token-color-accent",
      phosphor: "--dream-token-color-phosphor",
      positive: "--dream-token-color-positive",
      lineStrong: "--dream-token-color-line-strong",
      lineDefault: "--dream-token-color-line-default",
      lineSubtle: "--dream-token-color-line-subtle",
    },
    strokes: {
      subtle: "--dream-token-stroke-subtle",
      default: "--dream-token-stroke-default",
      strong: "--dream-token-stroke-strong",
      focus: "--dream-token-stroke-focus",
      projectTree: "--dream-token-stroke-project-tree",
    },
    radii: {
      panel: "--dream-token-radius-panel",
      control: "--dream-token-radius-control",
    },
    effects: {
      scanlineOpacity: "--dream-token-effect-scanline-opacity",
      scanlineWidth: "--dream-token-effect-scanline-width",
      scanlineDepth: "--dream-token-effect-scanline-depth",
      scanlineSpeed: "--dream-token-effect-scanline-speed",
      gridOpacity: "--dream-token-effect-grid-opacity",
      vignetteOpacity: "--dream-token-effect-vignette-opacity",
      brandOpacity: "--dream-token-effect-brand-opacity",
    },
    layout: {
      titleHeight: "--dream-token-layout-title-height",
      headerHeight: "--dream-token-layout-app-bar-height",
      navigationRowHeight: "--dream-token-layout-navigation-row-height",
      navigationFontSize: "--dream-token-layout-navigation-font-size",
    },
  };
  const TOKEN_PROPERTIES = Object.values(TOKEN_PROPERTY_MAP)
    .flatMap((group) => Object.values(group));
  const ROOT_CLASSES = [
    "codex-dream-skin",
    "dream-theme-light",
    "dream-theme-dark",
    "dream-art-wide",
    "dream-art-standard",
    "dream-focus-left",
    "dream-focus-center",
    "dream-focus-right",
    "dream-safe-left",
    "dream-safe-center",
    "dream-safe-right",
    "dream-safe-none",
    "dream-task-ambient",
    "dream-task-banner",
    "dream-task-off",
    "dream-sidebar-collapsed",
    "dream-tactical-mode-selecting",
    "dream-scanline-off",
    "dream-gloom-off",
    "dream-tactical-summary-relocated",
  ];
  const ROOT_PROPERTIES = [
    "--dream-art",
    "--dream-art-position",
    "--dream-focus-x",
    "--dream-focus-y",
    "--dream-accent",
    "--dream-accent-ink",
    "--dream-image-luma",
    "--dream-token-runtime-sidebar-width",
    "--dream-token-runtime-sidebar-navigation-body-height",
    "--dream-token-runtime-search-left",
    "--dream-token-runtime-search-bottom",
    "--dream-token-runtime-search-width",
    "--dream-token-runtime-sidebar-project-frame-top",
    "--dream-token-runtime-sidebar-scrollbar-left",
    "--dream-token-runtime-sidebar-scrollbar-top",
    "--dream-token-runtime-sidebar-scrollbar-height",
    "--dream-token-runtime-sidebar-scrollbar-thumb-height",
    "--dream-token-runtime-sidebar-scrollbar-thumb-offset",
    "--dream-token-runtime-undecide-left",
    "--dream-token-runtime-undecide-top",
    "--dream-token-runtime-undecide-width",
    "--dream-token-runtime-undecide-height",
    "--dream-token-runtime-detail-popover-left",
    "--dream-token-runtime-detail-popover-top",
    "--dream-token-runtime-detail-popover-width",
    "--dream-token-runtime-detail-popover-height",
    ...TOKEN_PROPERTIES,
  ];
  const HOME_UTILITY_CLASS = "dream-home-utility";
  const SUMMARY_PANEL_CLASS = "dream-summary-panel";
  const TACTICAL_THEME_ID = "preset-codex-tactical-crt";
  const TACTICAL_MODE_OPTION_CLASS = "dream-tactical-mode-option";
  const BRAND_MARK_ID = "codex-dream-skin-brand-mark";
  const TACTICAL_FOOTER_ID = "codex-dream-skin-footer";
  const TACTICAL_SCROLLBAR_ID = "codex-dream-skin-project-scrollbar";
  const TACTICAL_PROJECT_BOTTOM_FRAME_ID = "codex-dream-skin-project-bottom-frame";
  const TACTICAL_RIGHT_RAIL_ID = "codex-dream-skin-right-rail";
  const TACTICAL_RIGHT_RAIL_RESIZE_CLASS = "dream-tactical-right-resizer";
  const TACTICAL_CONVERSATION_TAB_CLASS = "dream-tactical-conversation-tab";
  const TACTICAL_CONVERSATION_ACTIVE_CLASS = "dream-tactical-native-conversation-active";
  const TACTICAL_RIGHT_RAIL_STORAGE_KEY = "codex-dream-skin.tactical-right-rail-width";
  const TACTICAL_PALETTE_STORAGE_KEY = "codex-dream-skin.tactical-palette";
  const TACTICAL_SCANLINE_STORAGE_KEY = "codex-dream-skin.tactical-scanline";
  const TACTICAL_GLOOM_STORAGE_KEY = "codex-dream-skin.tactical-gloom";
  const TACTICAL_PALETTES = {
    amber: null,
    cobalt: {
      canvas: "#020814", surface: "#040d1c", surfaceRaised: "#081a32",
      textPrimary: "#c2dcff", textSecondary: "#86b6eb", accent: "#4a94ff",
      phosphor: "#62b7ff", positive: "#60e9ad",
      lineStrong: "rgb(55 145 255 / 0.94)", lineDefault: "rgb(55 145 255 / 0.78)", lineSubtle: "rgb(55 145 255 / 0.24)",
    },
    phosphor: {
      canvas: "#020601", surface: "#061006", surfaceRaised: "#0d1d0b",
      textPrimary: "#c2ec9d", textSecondary: "#8cc66f", accent: "#9bd06e",
      phosphor: "#8bd65d", positive: "#77ff72",
      lineStrong: "rgb(132 205 79 / 0.94)", lineDefault: "rgb(132 205 79 / 0.78)", lineSubtle: "rgb(132 205 79 / 0.24)",
    },
    titanium: {
      canvas: "#080b0d", surface: "#0d1217", surfaceRaised: "#172027",
      textPrimary: "#e6eef3", textSecondary: "#b7c7d1", accent: "#d5e1e8",
      phosphor: "#a5cadd", positive: "#98e0b5",
      lineStrong: "rgb(207 223 232 / 0.94)", lineDefault: "rgb(207 223 232 / 0.78)", lineSubtle: "rgb(207 223 232 / 0.24)",
    },
  };
  const TACTICAL_PALETTE_OPTIONS = [
    ["amber", "AMBER"], ["cobalt", "COBALT"],
    ["phosphor", "PHOSPHOR"], ["titanium", "TITANIUM"],
  ];
  const SIDEBAR_NATIVE_FOOTER_CLASS = "dream-sidebar-native-footer";
  const TACTICAL_TOP_BAR_CLASSES = [
    "dream-tactical-menu-button",
    "dream-tactical-menu-file",
    "dream-tactical-menu-edit",
    "dream-tactical-menu-view",
    "dream-tactical-menu-help",
    "dream-tactical-topbar-hidden",
  ];
  const SIDEBAR_MODULE_CLASSES = [
    "dream-sidebar-navigation-head",
    "dream-sidebar-navigation-body",
    "dream-tactical-mode-switch",
    "dream-tactical-search",
    "dream-tactical-pull-requests",
    "dream-tactical-navigation-item",
    "dream-tactical-navigation-new-task",
    "dream-sidebar-projects",
    "dream-sidebar-projects-scroll",
    "dream-project-tree-item",
    "dream-project-tree-folder",
    "dream-sidebar-tasks",
    "dream-tactical-footer-extra-control",
  ];
  const MAIN_LAYOUT_CLASSES = [
    "dream-main-thread-scroll",
    "dream-main-composer-section",
    "dream-composer-input-line",
    "dream-composer-status-bar",
  ];
  const CLI_COLLAPSIBLE_CLASS = "dream-cli-collapsible";
  const installToken = {};
  let samplingNativeShell = false;
  let observer = null;
  let layoutObserver = null;
  let layoutObservedAside = null;
  let layoutObservedProjects = null;
  let sidebarScrollNode = null;
  let sidebarScrollHandler = null;
  let tacticalScrollbarNode = null;
  let tacticalScrollbarPointerDownHandler = null;
  let tacticalScrollbarPointerMoveHandler = null;
  let tacticalScrollbarPointerUpHandler = null;
  let tacticalScrollbarWheelHandler = null;
  let tacticalScrollbarDragState = null;
  let navigationWheelNode = null;
  let navigationWheelHandler = null;
  let tacticalModeSwitchNode = null;
  let tacticalModeSwitchHandler = null;
  let tacticalNativeTabsPanel = null;
  let tacticalNativeTabsClickHandler = null;
  const cliCollapsibleBindings = new Map();
  let nativeBrandPath = null;
  let brandLoadPromise = null;
  let brandRetryAfter = 0;
  window.__CODEX_DREAM_SKIN_DISABLED__ = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value)));
  const luminance = (red, green, blue) => {
    const linear = [red, green, blue].map((value) => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  };
  const defaultProfile = {
    appearance: "dark",
    accent: [108, 131, 142],
    focusX: .5,
    focusY: .5,
    aspect: 1.6,
    luma: .32,
    safeArea: "center",
  };

  const normalizeConfig = (value) => {
    const config = value && typeof value === "object" ? value : {};
    const art = config.art && typeof config.art === "object" ? config.art : {};
    const rawTokens = config.tokens && typeof config.tokens === "object" ? config.tokens : {};
    const hasNumber = (candidate) =>
      (typeof candidate === "number" || (typeof candidate === "string" && candidate.trim() !== "")) &&
      Number.isFinite(Number(candidate));
    const tokenProperties = {};
    const colorTokens = rawTokens.colors && typeof rawTokens.colors === "object" ? rawTokens.colors : {};
    for (const [key, property] of Object.entries(TOKEN_PROPERTY_MAP.colors)) {
      if (typeof colorTokens[key] !== "string") continue;
      const candidate = colorTokens[key].trim();
      if (isSafeCssColor(candidate)) tokenProperties[property] = candidate;
    }
    for (const [group, maximum, unit] of [
      ["strokes", 50, "px"],
      ["radii", 16, "px"],
    ]) {
      const source = rawTokens[group] && typeof rawTokens[group] === "object" ? rawTokens[group] : {};
      for (const [key, property] of Object.entries(TOKEN_PROPERTY_MAP[group])) {
        const candidate = source[key];
        if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate < 0 || candidate > maximum) {
          continue;
        }
        tokenProperties[property] = `${candidate}${unit}`;
      }
    }
    const effectTokens = rawTokens.effects && typeof rawTokens.effects === "object"
      ? rawTokens.effects : {};
    for (const [key, minimum, maximum, unit] of [
      ["scanlineOpacity", 0, .35, ""],
      ["scanlineWidth", .5, 12, "px"],
      ["scanlineDepth", 0, .6, ""],
      ["scanlineSpeed", .25, 120, "s"],
      ["gridOpacity", 0, .35, ""],
      ["vignetteOpacity", 0, .35, ""],
      ["brandOpacity", 0, .35, ""],
    ]) {
      const candidate = effectTokens[key];
      if (typeof candidate !== "number" || !Number.isFinite(candidate) ||
          candidate < minimum || candidate > maximum) continue;
      tokenProperties[TOKEN_PROPERTY_MAP.effects[key]] = `${candidate}${unit}`;
    }
    const titleHeight = rawTokens.layout?.titleHeight;
    if (typeof titleHeight === "number" && Number.isFinite(titleHeight) &&
        titleHeight >= 24 && titleHeight <= 72) {
      tokenProperties[TOKEN_PROPERTY_MAP.layout.titleHeight] = `${titleHeight}px`;
    }
    const headerHeight = rawTokens.layout?.headerHeight;
    if (typeof headerHeight === "number" && Number.isFinite(headerHeight) &&
        headerHeight >= 40 && headerHeight <= 120) {
      tokenProperties[TOKEN_PROPERTY_MAP.layout.headerHeight] = `${headerHeight}px`;
    }
    for (const [key, minimum, maximum] of [
      ["navigationRowHeight", 36, 64],
      ["navigationFontSize", 14, 30],
    ]) {
      const candidate = rawTokens.layout?.[key];
      if (typeof candidate !== "number" || !Number.isFinite(candidate) ||
          candidate < minimum || candidate > maximum) continue;
      tokenProperties[TOKEN_PROPERTY_MAP.layout[key]] = `${candidate}px`;
    }
    const requestedLegacyAccent = typeof config?.palette?.accent === "string"
      ? config.palette.accent.trim() : "";
    const safeLegacyAccent = isSafeCssColor(requestedLegacyAccent)
      ? requestedLegacyAccent : null;
    const themeId = typeof config.id === "string" && THEME_ID_PATTERN.test(config.id)
      ? config.id : "custom";
    const appearance = ["auto", "light", "dark"].includes(config.appearance)
      ? config.appearance
      : "auto";
    const safeArea = ["auto", "left", "right", "center", "none"].includes(art.safeArea)
      ? art.safeArea
      : "auto";
    const taskMode = ["auto", "ambient", "banner", "off"].includes(art.taskMode)
      ? art.taskMode
      : "auto";
    const metadataRatio = Number(config?.artMetadata?.ratio);
    return {
      appearance,
      safeArea,
      taskMode,
      focusX: hasNumber(art.focusX) ? clamp(art.focusX) : null,
      focusY: hasNumber(art.focusY) ? clamp(art.focusY) : null,
      themeId,
      tokenProperties,
      accent: tokenProperties[TOKEN_PROPERTY_MAP.colors.accent] || safeLegacyAccent,
      initialAspect: Number.isFinite(metadataRatio) && metadataRatio > 0 ? metadataRatio : null,
    };
  };

  const previous = window[STATE_KEY];
  let previousCleaned = false;
  try {
    previousCleaned = previous?.cleanup?.() === true;
  } catch {}
  if (!previousCleaned) {
    if (previous?.observer) previous.observer.disconnect();
    if (previous?.timer) clearInterval(previous.timer);
    if (previous?.scheduler?.timeout) clearTimeout(previous.scheduler.timeout);
    if (previous?.artUrl) URL.revokeObjectURL(previous.artUrl);
  }
  window.__CODEX_DREAM_SKIN_DISABLED__ = false;
  const artUrl = (() => {
    const comma = artDataUrl.indexOf(",");
    const binary = atob(artDataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    const mime = /^data:([^;,]+)/.exec(artDataUrl)?.[1] || "image/png";
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  })();
  const config = normalizeConfig(rawConfig);
  const isTacticalPalette = (value) => typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(TACTICAL_PALETTES, value);
  let tacticalPalette = (() => {
    try {
      const saved = globalThis.localStorage?.getItem(TACTICAL_PALETTE_STORAGE_KEY);
      return isTacticalPalette(saved) ? saved : "amber";
    } catch {
      return "amber";
    }
  })();
  const savedEffectEnabled = (storageKey) => {
    try {
      return globalThis.localStorage?.getItem(storageKey) !== "off";
    } catch {
      return true;
    }
  };
  let tacticalScanlineEnabled = savedEffectEnabled(TACTICAL_SCANLINE_STORAGE_KEY);
  let tacticalGloomEnabled = savedEffectEnabled(TACTICAL_GLOOM_STORAGE_KEY);
  const applyTacticalPalette = (root) => {
    const palette = config.themeId === TACTICAL_THEME_ID ? TACTICAL_PALETTES[tacticalPalette] : null;
    if (!palette) return;
    for (const [name, value] of Object.entries(palette)) {
      root.style.setProperty(TOKEN_PROPERTY_MAP.colors[name], value);
    }
    root.style.setProperty("--dream-accent", palette.accent);
    root.style.setProperty("--dream-accent-ink", palette.canvas);
  };
  let profile = {
    ...defaultProfile,
    aspect: config.initialAspect ?? defaultProfile.aspect,
  };
  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    existingStyle.textContent = cssText;
    existingStyle.dataset.dreamVersion = "5";
  }

  const analyzeArt = () => new Promise((resolve) => {
    if (typeof Image !== "function") {
      resolve(defaultProfile);
      return;
    }
    const image = new Image();
    image.onload = () => {
      try {
        const width = 48;
        const height = Math.max(12, Math.round(width * image.naturalHeight / image.naturalWidth));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext?.("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas is unavailable");
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        let count = 0;
        let totalRed = 0;
        let totalGreen = 0;
        let totalBlue = 0;
        let totalBrightness = 0;
        const samples = [];
        const sampleMap = new Array(width * height);
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (pixels[offset + 3] < 96) continue;
          const red = pixels[offset];
          const green = pixels[offset + 1];
          const blue = pixels[offset + 2];
          const light = (.2126 * red + .7152 * green + .0722 * blue) / 255;
          const sample = { red, green, blue, light, index: offset / 4 };
          samples.push(sample);
          sampleMap[sample.index] = sample;
          totalRed += red;
          totalGreen += green;
          totalBlue += blue;
          totalBrightness += light;
          count += 1;
        }
        if (!count) throw new Error("Image contains no opaque pixels");
        const average = [totalRed / count, totalGreen / count, totalBlue / count];
        const averageBrightness = totalBrightness / count;
        const information = (start, end) => {
          let total = 0;
          let totalSquared = 0;
          let edges = 0;
          let edgeCount = 0;
          let sampleCount = 0;
          for (let y = 0; y < height; y += 1) {
            for (let x = start; x < end; x += 1) {
              const sample = sampleMap[y * width + x];
              if (!sample) continue;
              total += sample.light;
              totalSquared += sample.light * sample.light;
              sampleCount += 1;
              const previousSample = x > start ? sampleMap[y * width + x - 1] : null;
              const above = y > 0 ? sampleMap[(y - 1) * width + x] : null;
              if (previousSample) { edges += Math.abs(sample.light - previousSample.light); edgeCount += 1; }
              if (above) { edges += Math.abs(sample.light - above.light); edgeCount += 1; }
            }
          }
          const mean = sampleCount ? total / sampleCount : 0;
          const variance = sampleCount ? Math.max(0, totalSquared / sampleCount - mean * mean) : 1;
          return Math.sqrt(variance) * .58 + (edgeCount ? edges / edgeCount : 1) * .42;
        };
        const zoneWidth = Math.max(1, Math.floor(width * .38));
        const leftInformation = information(0, zoneWidth);
        const rightInformation = information(width - zoneWidth, width);
        let safeArea = "center";
        if (leftInformation < rightInformation * .86) safeArea = "left";
        else if (rightInformation < leftInformation * .86) safeArea = "right";
        let focusWeight = 0;
        let focusX = 0;
        let focusY = 0;
        let accentWeight = 0;
        let accent = [0, 0, 0];
        for (const sample of samples) {
          const x = sample.index % width;
          const y = Math.floor(sample.index / width);
          const difference = Math.sqrt(
            (sample.red - average[0]) ** 2 +
            (sample.green - average[1]) ** 2 +
            (sample.blue - average[2]) ** 2,
          ) / 441.7;
          const saliency = .03 + difference ** 1.35;
          focusX += (x / Math.max(1, width - 1)) * saliency;
          focusY += (y / Math.max(1, height - 1)) * saliency;
          focusWeight += saliency;
          const max = Math.max(sample.red, sample.green, sample.blue);
          const min = Math.min(sample.red, sample.green, sample.blue);
          const saturation = max ? (max - min) / max : 0;
          const usableLight = 1 - Math.min(1, Math.abs(sample.light - .46) / .54);
          const weight = saturation ** 2 * (.15 + usableLight);
          accent[0] += sample.red * weight;
          accent[1] += sample.green * weight;
          accent[2] += sample.blue * weight;
          accentWeight += weight;
        }
        const resolvedAccent = accentWeight > 1
          ? accent.map((channel) => Math.round(channel / accentWeight))
          : average.map((channel) => Math.round(channel));
        let resolvedFocusX = clamp(focusX / focusWeight);
        if (safeArea === "left") resolvedFocusX = Math.max(.64, resolvedFocusX);
        if (safeArea === "right") resolvedFocusX = Math.min(.36, resolvedFocusX);
        resolve({
          appearance: averageBrightness >= .58 ? "light" : "dark",
          accent: resolvedAccent,
          focusX: resolvedFocusX,
          focusY: clamp(focusY / focusWeight),
          aspect: image.naturalWidth / Math.max(1, image.naturalHeight),
          luma: clamp(averageBrightness),
          safeArea,
        });
      } catch {
        resolve(defaultProfile);
      }
    };
    image.onerror = () => resolve(defaultProfile);
    image.src = artUrl;
  });

  const detectShellAppearance = () => {
    const root = document.documentElement;
    const body = document.body;
    const classes = `${root?.className || ""} ${body?.className || ""}`
      .toLowerCase()
      .replace(/\bdream-theme-(?:dark|light)\b/g, "");
    if (/\b(dark|electron-dark|theme-dark|appearance-dark)\b/.test(classes)) return "dark";
    if (/\b(light|electron-light|theme-light|appearance-light)\b/.test(classes)) return "light";

    const dataTheme = (
      root?.getAttribute?.("data-theme") ||
      root?.getAttribute?.("data-appearance") ||
      root?.getAttribute?.("data-color-mode") ||
      body?.getAttribute?.("data-theme") ||
      body?.getAttribute?.("data-appearance") ||
      ""
    ).toLowerCase();
    if (dataTheme.includes("dark")) return "dark";
    if (dataTheme.includes("light")) return "light";

    try {
      const hadSkin = root?.classList?.contains?.("codex-dream-skin");
      const savedSkinClasses = hadSkin
        ? ROOT_CLASSES.filter((className) => root.classList.contains(className))
        : [];
      samplingNativeShell = true;
      if (hadSkin) root.classList.remove(...ROOT_CLASSES);
      try {
        const colorScheme = getComputedStyle(root).colorScheme || "";
        if (colorScheme.includes("dark") && !colorScheme.includes("light")) return "dark";
        if (colorScheme.includes("light") && !colorScheme.includes("dark")) return "light";
      } finally {
        if (hadSkin) root.classList.add(...savedSkinClasses);
        observer?.takeRecords?.();
        samplingNativeShell = false;
      }
    } catch {
      samplingNativeShell = false;
    }
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {}
    return "light";
  };

  const clearSkinDom = () => {
    const root = document.documentElement;
    clearCliCollapsibleBindings();
    clearTacticalModeSwitchBinding();
    clearTacticalNativeTabsBinding();
    root?.classList.remove(...ROOT_CLASSES);
    root?.removeAttribute?.(THEME_ATTRIBUTE);
    for (const property of ROOT_PROPERTIES) root?.style.removeProperty(property);
    document.querySelectorAll(".dream-home").forEach((node) => node.classList.remove("dream-home"));
    document.querySelectorAll(".dream-task").forEach((node) => node.classList.remove("dream-task"));
    document.querySelectorAll(".dream-home-shell").forEach((node) => node.classList.remove("dream-home-shell"));
    document.querySelectorAll(`.${HOME_UTILITY_CLASS}`).forEach((node) => node.classList.remove(HOME_UTILITY_CLASS));
    document.querySelectorAll(`.${SUMMARY_PANEL_CLASS}`).forEach((node) => node.classList.remove(SUMMARY_PANEL_CLASS));
    document.querySelectorAll(".dream-tactical-native-detail-source, .dream-tactical-detail-popover-source")
      .forEach((node) => node.classList.remove("dream-tactical-native-detail-source", "dream-tactical-detail-popover-source"));
    document.querySelectorAll(".dream-tactical-navigation-item").forEach((node) => {
      delete node.dataset.dreamTacticalNavIndex;
      delete node.dataset.dreamTacticalNavLabel;
    });
    document.querySelectorAll(".dream-tactical-mode-switch").forEach((node) => {
      delete node.dataset.dreamTacticalMode;
    });
    document.querySelectorAll(`.${TACTICAL_MODE_OPTION_CLASS}`).forEach((node) => node.remove?.());
    for (const className of SIDEBAR_MODULE_CLASSES) {
      document.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
    }
    for (const className of MAIN_LAYOUT_CLASSES) {
      document.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
    }
    document.querySelectorAll(`.${SIDEBAR_NATIVE_FOOTER_CLASS}`)
      .forEach((node) => node.classList.remove(SIDEBAR_NATIVE_FOOTER_CLASS));
    for (const className of TACTICAL_TOP_BAR_CLASSES) {
      document.querySelectorAll(`.${className}`).forEach((node) => node.classList.remove(className));
    }
    clearTacticalScrollbarBindings();
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CHROME_ID)?.remove();
    document.getElementById(BRAND_MARK_ID)?.remove();
    document.getElementById(TACTICAL_FOOTER_ID)?.remove();
    document.getElementById(TACTICAL_SCROLLBAR_ID)?.remove();
    document.getElementById(TACTICAL_PROJECT_BOTTOM_FRAME_ID)?.remove();
    document.getElementById(TACTICAL_RIGHT_RAIL_ID)?.remove();
  };

  const syncSummaryPanels = () => {
    const summaryPanels = new Set();
    for (const item of document.querySelectorAll('[class~="group/summary-panel-item"]')) {
      const panel = item.closest?.('[class*="bg-token-dropdown-background"]');
      if (panel) summaryPanels.add(panel);
    }
    for (const panel of document.querySelectorAll(`.${SUMMARY_PANEL_CLASS}`)) {
      if (!summaryPanels.has(panel)) panel.classList.remove(SUMMARY_PANEL_CLASS);
    }
    for (const panel of summaryPanels) panel.classList.add(SUMMARY_PANEL_CLASS);
  };

  const directChildOf = (node, parent) => {
    let candidate = node;
    while (candidate?.parentElement && candidate.parentElement !== parent) {
      candidate = candidate.parentElement;
    }
    return candidate?.parentElement === parent ? candidate : null;
  };

  const syncOwnedClass = (className, nodes) => {
    const wanted = new Set(nodes.filter(Boolean));
    for (const node of document.querySelectorAll(`.${className}`)) {
      if (!wanted.has(node)) node.classList.remove(className);
    }
    for (const node of wanted) node.classList.add(className);
  };

  const clearTacticalModeSwitchBinding = () => {
    window.removeEventListener?.("pointerdown", tacticalModeSwitchHandler, true);
    window.removeEventListener?.("click", tacticalModeSwitchHandler, true);
    tacticalModeSwitchNode = null;
    tacticalModeSwitchHandler = null;
  };

  const clearTacticalNativeTabsBinding = () => {
    window.removeEventListener?.("click", tacticalNativeTabsClickHandler, true);
    tacticalNativeTabsPanel?.classList?.remove?.(TACTICAL_CONVERSATION_ACTIVE_CLASS);
    tacticalNativeTabsPanel?.querySelectorAll?.(`.${TACTICAL_CONVERSATION_TAB_CLASS}`)
      .forEach((node) => node.remove?.());
    tacticalNativeTabsPanel?.querySelectorAll?.('[data-dream-tactical-native-selected]')
      .forEach((node) => {
        node.setAttribute("aria-selected", node.dataset.dreamTacticalNativeSelected);
        delete node.dataset.dreamTacticalNativeSelected;
      });
    if (tacticalNativeTabsPanel?.dataset) delete tacticalNativeTabsPanel.dataset.dreamTacticalNativeTabSignature;
    tacticalNativeTabsPanel = null;
    tacticalNativeTabsClickHandler = null;
  };

  const clearModeSelectingWhenClosed = (attempts = 60) => {
    if (!document.querySelector('[role="menu"]') || attempts <= 1) {
      document.documentElement.classList.remove("dream-tactical-mode-selecting");
      return;
    }
    requestAnimationFrame(() => clearModeSelectingWhenClosed(attempts - 1));
  };

  const chooseNativeMode = (targetMode, attempts = 12) => {
    const item = [...document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')].find((candidate) => {
      const label = `${candidate.innerText || candidate.textContent || ""}`.replace(/\s+/g, " ").trim();
      return targetMode === "codex"
        ? /^CODEX/i.test(label)
        : /^(?:CHATGPT\s*)?WORK/i.test(label);
    });
    if (item) {
      const menu = item.closest?.('[role="menu"]');
      // ponytail: reuse Codex's menu callback; replace this when the host exposes a public mode API.
      const fiberKey = Object.keys(item).find((key) => key.startsWith("__reactFiber$"));
      let fiber = fiberKey ? item[fiberKey] : null;
      let onSelect = null;
      for (let depth = 0; fiber && depth < 24; depth += 1, fiber = fiber.return) {
        if (typeof fiber.memoizedProps?.onSelect !== "function") continue;
        onSelect = fiber.memoizedProps.onSelect;
        break;
      }
      item.click?.();
      onSelect?.();
      menu?.dispatchEvent?.(new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        bubbles: true,
        cancelable: true,
      }));
      requestAnimationFrame(() => clearModeSelectingWhenClosed());
      return;
    }
    if (attempts > 1) {
      requestAnimationFrame(() => chooseNativeMode(targetMode, attempts - 1));
    } else {
      document.documentElement.classList.remove("dream-tactical-mode-selecting");
    }
  };

  const syncTacticalModeOptions = (node) => {
    for (const option of document.querySelectorAll(`.${TACTICAL_MODE_OPTION_CLASS}`)) {
      if (option.parentElement !== node) option.remove?.();
    }
    if (!node) return;
    for (const [mode, label] of [["work", "WORK"], ["codex", "CODEX"]]) {
      let option = [...node.children].find((child) =>
        child.classList?.contains?.(TACTICAL_MODE_OPTION_CLASS) &&
        child.dataset?.dreamTacticalModeTarget === mode);
      if (!option) {
        option = document.createElement("span");
        option.classList.add(TACTICAL_MODE_OPTION_CLASS);
        option.dataset.dreamTacticalModeTarget = mode;
        option.setAttribute("aria-hidden", "true");
        node.appendChild(option);
      }
      option.textContent = label;
      option.title = `Switch to ${label}`;
    }
  };

  const syncTacticalModeSwitchBinding = (node) => {
    if (node === tacticalModeSwitchNode) return;
    clearTacticalModeSwitchBinding();
    if (!node) return;
    tacticalModeSwitchNode = node;
    tacticalModeSwitchHandler = (event) => {
      if (event.target?.closest?.(".dream-tactical-mode-switch") !== node) return;
      const option = event.target?.closest?.(`.${TACTICAL_MODE_OPTION_CLASS}`);
      const targetMode = option?.parentElement === node
        ? option.dataset.dreamTacticalModeTarget
        : null;
      if (!targetMode) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        return;
      }
      if (node.dataset.dreamTacticalMode === targetMode) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
        return;
      }
      if (event.type !== "pointerdown") return;
      document.documentElement.classList.add("dream-tactical-mode-selecting");
      requestAnimationFrame(() => chooseNativeMode(targetMode));
    };
    window.addEventListener?.("pointerdown", tacticalModeSwitchHandler, true);
    window.addEventListener?.("click", tacticalModeSwitchHandler, true);
  };

  const syncTacticalSearchAnchor = (search) => {
    const root = document.documentElement;
    const rect = search?.getBoundingClientRect?.();
    if (!rect || !Number.isFinite(rect.left) || !Number.isFinite(rect.bottom) || rect.width <= 0) {
      for (const property of [
        "--dream-token-runtime-search-left",
        "--dream-token-runtime-search-bottom",
        "--dream-token-runtime-search-width",
      ]) root?.style.removeProperty(property);
      return;
    }
    root.style.setProperty("--dream-token-runtime-search-left", `${rect.left}px`);
    root.style.setProperty("--dream-token-runtime-search-bottom", `${rect.bottom}px`);
    root.style.setProperty("--dream-token-runtime-search-width", `${rect.width}px`);
  };

  const restoreAttribute = (node, name, value) => {
    if (value === null) node.removeAttribute?.(name);
    else node.setAttribute?.(name, value);
  };

  const unbindCliCollapsible = (node, binding) => {
    node.removeEventListener?.("click", binding.onClick);
    node.removeEventListener?.("keydown", binding.onKeyDown);
    node.classList?.remove(CLI_COLLAPSIBLE_CLASS);
    for (const name of ["data-dream-cli-kind", "data-dream-cli-summary", "data-dream-cli-expanded"]) {
      node.removeAttribute?.(name);
    }
    restoreAttribute(node, "role", binding.role);
    restoreAttribute(node, "tabindex", binding.tabIndex);
    restoreAttribute(node, "aria-expanded", binding.ariaExpanded);
    restoreAttribute(node, "title", binding.title);
    cliCollapsibleBindings.delete(node);
  };

  const clearCliCollapsibleBindings = () => {
    for (const [node, binding] of [...cliCollapsibleBindings]) {
      unbindCliCollapsible(node, binding);
    }
  };

  const bindCliCollapsible = (node, kind, summary) => {
    let binding = cliCollapsibleBindings.get(node);
    if (!binding) {
      const interactive = node.tagName === "BUTTON" || node.tagName === "A" ||
        node.getAttribute?.("role") === "button";
      const toggle = () => {
        const expanded = node.getAttribute?.("data-dream-cli-expanded") === "true";
        node.setAttribute?.("data-dream-cli-expanded", expanded ? "false" : "true");
        if (!interactive) node.setAttribute?.("aria-expanded", expanded ? "false" : "true");
      };
      const onClick = (event) => {
        const nestedControl = event.target?.closest?.("button, a, [role=\"button\"]");
        if (nestedControl && nestedControl !== node) return;
        toggle();
      };
      const onKeyDown = (event) => {
        if (interactive || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault?.();
        toggle();
      };
      binding = {
        interactive,
        onClick,
        onKeyDown,
        role: node.getAttribute?.("role"),
        tabIndex: node.getAttribute?.("tabindex"),
        ariaExpanded: node.getAttribute?.("aria-expanded"),
        title: node.getAttribute?.("title"),
      };
      cliCollapsibleBindings.set(node, binding);
      node.addEventListener?.("click", onClick);
      node.addEventListener?.("keydown", onKeyDown);
      node.setAttribute?.("data-dream-cli-expanded", "false");
      if (!interactive) {
        node.setAttribute?.("role", "button");
        node.setAttribute?.("tabindex", "0");
        node.setAttribute?.("aria-expanded", "false");
      }
    }
    node.classList?.add(CLI_COLLAPSIBLE_CLASS);
    node.setAttribute?.("data-dream-cli-kind", kind);
    node.setAttribute?.("data-dream-cli-summary", summary);
    node.setAttribute?.("title", "Click to expand or collapse");
  };

  const syncCliTranscript = (threadScroll, tactical) => {
    const wanted = new Set();
    if (tactical && threadScroll) {
      for (const turn of threadScroll.querySelectorAll?.("[data-turn-key]") || []) {
        for (const block of turn.querySelectorAll?.("pre") || []) {
          const text = `${block.textContent || ""}`.trim();
          if (text.length < 180 && text.split(/\r?\n/).length < 4) continue;
          wanted.add(block);
          bindCliCollapsible(block, "CODE", text.replace(/\s+/g, " ").slice(0, 72) || "code block");
        }
        for (const image of turn.querySelectorAll?.("img") || []) {
          if (image.closest?.("[data-local-conversation-item-target-ids], button, a, [role=\"button\"]")) {
            continue;
          }
          const container = image.parentElement || image;
          wanted.add(container);
          bindCliCollapsible(
            container,
            "IMAGE",
            `${image.getAttribute?.("alt") || "image attachment"}`.trim().slice(0, 72),
          );
        }
      }
    }
    for (const [node, binding] of [...cliCollapsibleBindings]) {
      if (!wanted.has(node)) unbindCliCollapsible(node, binding);
    }
  };

  const measuredHeight = (node) => {
    const height = Number(node?.getBoundingClientRect?.().height ?? node?.offsetHeight);
    return Number.isFinite(height) && height > 0 ? height : 0;
  };

  const syncTacticalTopBar = () => {
    const tactical = config.themeId === TACTICAL_THEME_ID;
    const topBar = document.querySelector('[class~="group/application-menu-top-bar"]');
    const buttons = topBar ? [...topBar.querySelectorAll("button")] : [];
    const menuClasses = new Map([
      ["FILE", "dream-tactical-menu-file"],
      ["EDIT", "dream-tactical-menu-edit"],
      ["VIEW", "dream-tactical-menu-view"],
      ["HELP", "dream-tactical-menu-help"],
    ]);
    for (const button of buttons) {
      for (const className of TACTICAL_TOP_BAR_CLASSES) button.classList.remove(className);
      if (!tactical) {
        delete button.dataset.dreamTacticalMenuLabel;
        button.querySelector?.(":scope > .dream-tactical-menu-name")?.remove();
        continue;
      }
      const label = `${button.getAttribute?.("aria-label") || button.textContent || ""}`
        .trim()
        .toUpperCase();
      const menuEntry = [...menuClasses.entries()].find(([name]) =>
        label === name || label.startsWith(`${name} `));
      const menuClass = menuEntry?.[1];
      if (menuClass) {
        button.classList.add("dream-tactical-menu-button", menuClass);
        button.dataset.dreamTacticalMenuLabel = menuEntry?.[0] || "";
        let name = button.querySelector?.(":scope > .dream-tactical-menu-name");
        if (!name) {
          name = document.createElement("span");
          name.classList.add("dream-tactical-menu-name");
          name.setAttribute("aria-hidden", "true");
          button.appendChild(name);
        }
        name.textContent = menuEntry?.[0] || "";
      } else {
        button.classList.add("dream-tactical-topbar-hidden");
        delete button.dataset.dreamTacticalMenuLabel;
        button.querySelector?.(":scope > .dream-tactical-menu-name")?.remove();
      }
    }
  };

  const clearTacticalScrollbarBindings = () => {
    if (sidebarScrollNode && sidebarScrollHandler) {
      sidebarScrollNode.removeEventListener?.("scroll", sidebarScrollHandler);
    }
    if (tacticalScrollbarNode) {
      tacticalScrollbarNode.removeEventListener?.("pointerdown", tacticalScrollbarPointerDownHandler);
      tacticalScrollbarNode.removeEventListener?.("pointermove", tacticalScrollbarPointerMoveHandler);
      tacticalScrollbarNode.removeEventListener?.("pointerup", tacticalScrollbarPointerUpHandler);
      tacticalScrollbarNode.removeEventListener?.("pointercancel", tacticalScrollbarPointerUpHandler);
      tacticalScrollbarNode.removeEventListener?.("wheel", tacticalScrollbarWheelHandler);
    }
    if (navigationWheelNode && navigationWheelHandler) {
      navigationWheelNode.removeEventListener?.("wheel", navigationWheelHandler);
    }
    sidebarScrollNode = null;
    sidebarScrollHandler = null;
    tacticalScrollbarNode = null;
    tacticalScrollbarPointerDownHandler = null;
    tacticalScrollbarPointerMoveHandler = null;
    tacticalScrollbarPointerUpHandler = null;
    tacticalScrollbarWheelHandler = null;
    tacticalScrollbarDragState = null;
    navigationWheelNode = null;
    navigationWheelHandler = null;
  };

  const syncTacticalScrollbar = (
    aside,
    projectScroll,
    navigationBody,
  ) => {
    const root = document.documentElement;
    const tactical = config.themeId === TACTICAL_THEME_ID;
    let scrollbar = document.getElementById(TACTICAL_SCROLLBAR_ID);
    if (!tactical || !aside || !projectScroll) {
      scrollbar?.remove();
      clearTacticalScrollbarBindings();
      return;
    }
    if (!scrollbar) {
      scrollbar = document.createElement("div");
      scrollbar.id = TACTICAL_SCROLLBAR_ID;
      const thumb = document.createElement("div");
      thumb.classList.add("dream-project-scrollbar-thumb");
      scrollbar.appendChild(thumb);
    }
    // Anchor the rail to the resizable sidebar so native drag-resizing moves
    // it immediately, without waiting for a viewport-coordinate recalculation.
    if (scrollbar.parentElement !== aside) aside.appendChild(scrollbar);
    scrollbar.removeAttribute?.("aria-hidden");
    scrollbar.setAttribute("role", "scrollbar");
    scrollbar.setAttribute("aria-label", "EXECUTION PROJECTS");
    scrollbar.setAttribute("aria-orientation", "vertical");

    const tokenNumber = (property, fallback) => {
      const raw = getComputedStyle(root).getPropertyValue?.(property);
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : fallback;
    };
    const updateMetrics = () => {
      const asideRect = aside.getBoundingClientRect?.();
      if (!asideRect) return;
      const projectPanel = aside.querySelector?.(".dream-sidebar-projects");
      const projectRect = projectPanel?.getBoundingClientRect?.() || asideRect;
      const executionTitleHeight = tokenNumber("--dream-token-layout-execution-title-height", 42);
      const projectTitleHeight = tokenNumber("--dream-token-layout-project-title-height", 30);
      const scrollbarInset = tokenNumber("--dream-token-layout-scrollbar-inset", 4);
      const frameStroke = tokenNumber("--dream-token-stroke-strong", 2);
      // Measure the actual Project module rather than reconstructing its position
      // from sibling heights. Codex virtualizes project rows, so reconstructed
      // coordinates drift while rows mount or unmount during a scroll.
      const trackTop = Math.max(
        frameStroke + scrollbarInset,
        projectRect.top - asideRect.top + executionTitleHeight + projectTitleHeight + scrollbarInset,
      );
      const trackBottom = Math.min(
        asideRect.height - frameStroke - scrollbarInset,
        projectRect.bottom - asideRect.top - frameStroke - scrollbarInset,
      );
      const trackHeight = Math.max(0, trackBottom - trackTop);
      const maximumScroll = Math.max(0,
        Number(projectScroll.scrollHeight) - Number(projectScroll.clientHeight));
      const viewportHeight = Math.max(1, Number(projectScroll.clientHeight));
      const contentHeight = Math.max(viewportHeight, Number(projectScroll.scrollHeight));
      const thumbHeight = Math.min(trackHeight, Math.max(32,
        trackHeight * (viewportHeight / contentHeight)));
      const thumbTravel = Math.max(0, trackHeight - thumbHeight);
      const thumbOffset = maximumScroll > 0
        ? thumbTravel * (Number(projectScroll.scrollTop) / maximumScroll)
        : 0;
      root.style.setProperty(
        "--dream-token-runtime-sidebar-scrollbar-top",
        `${trackTop}px`,
      );
      root.style.setProperty(
        "--dream-token-runtime-sidebar-scrollbar-height",
        `${trackHeight}px`,
      );
      root.style.setProperty(
        "--dream-token-runtime-sidebar-scrollbar-thumb-height",
        `${thumbHeight}px`,
      );
      root.style.setProperty(
        "--dream-token-runtime-sidebar-scrollbar-thumb-offset",
        `${thumbOffset}px`,
      );
      scrollbar.setAttribute("aria-valuemin", "0");
      scrollbar.setAttribute("aria-valuemax", `${maximumScroll}`);
      scrollbar.setAttribute("aria-valuenow", `${Math.max(0, Number(projectScroll.scrollTop))}`);
    };

    clearTacticalScrollbarBindings();
    sidebarScrollNode = projectScroll;
    sidebarScrollHandler = updateMetrics;
    sidebarScrollNode.addEventListener?.("scroll", sidebarScrollHandler, { passive: true });
    tacticalScrollbarNode = scrollbar;

    const thumb = scrollbar.querySelector?.(".dream-project-scrollbar-thumb");
    tacticalScrollbarPointerDownHandler = (event) => {
      const maximumScroll = Math.max(0,
        Number(projectScroll.scrollHeight) - Number(projectScroll.clientHeight));
      if (maximumScroll <= 0) return;
      event.preventDefault?.();
      const trackRect = scrollbar.getBoundingClientRect?.();
      const thumbRect = thumb?.getBoundingClientRect?.();
      if (!trackRect || !thumbRect) return;
      if (event.target === thumb) {
        tacticalScrollbarDragState = {
          pointerId: event.pointerId,
          startY: Number(event.clientY),
          startScrollTop: Number(projectScroll.scrollTop),
          maximumScroll,
          thumbTravel: Math.max(1, trackRect.height - thumbRect.height),
        };
        scrollbar.setPointerCapture?.(event.pointerId);
        return;
      }
      const direction = Number(event.clientY) < thumbRect.top ? -1 : 1;
      projectScroll.scrollTop = Math.max(0, Math.min(
        maximumScroll,
        Number(projectScroll.scrollTop) + Number(projectScroll.clientHeight) * direction * .85,
      ));
      updateMetrics();
    };
    tacticalScrollbarPointerMoveHandler = (event) => {
      const drag = tacticalScrollbarDragState;
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.preventDefault?.();
      const delta = Number(event.clientY) - drag.startY;
      projectScroll.scrollTop = Math.max(0, Math.min(
        drag.maximumScroll,
        drag.startScrollTop + (delta / drag.thumbTravel) * drag.maximumScroll,
      ));
      updateMetrics();
    };
    tacticalScrollbarPointerUpHandler = (event) => {
      const drag = tacticalScrollbarDragState;
      if (!drag || event.pointerId !== drag.pointerId) return;
      tacticalScrollbarDragState = null;
      scrollbar.releasePointerCapture?.(event.pointerId);
    };
    tacticalScrollbarWheelHandler = (event) => {
      event.preventDefault?.();
      const maximumScroll = Math.max(0,
        Number(projectScroll.scrollHeight) - Number(projectScroll.clientHeight));
      projectScroll.scrollTop = Math.max(0, Math.min(
        maximumScroll,
        Number(projectScroll.scrollTop) + Number(event.deltaY),
      ));
      updateMetrics();
    };
    scrollbar.addEventListener?.("pointerdown", tacticalScrollbarPointerDownHandler);
    scrollbar.addEventListener?.("pointermove", tacticalScrollbarPointerMoveHandler);
    scrollbar.addEventListener?.("pointerup", tacticalScrollbarPointerUpHandler);
    scrollbar.addEventListener?.("pointercancel", tacticalScrollbarPointerUpHandler);
    scrollbar.addEventListener?.("wheel", tacticalScrollbarWheelHandler, { passive: false });

    navigationWheelNode = navigationBody;
    navigationWheelHandler = (event) => {
      event.preventDefault?.();
      event.stopPropagation?.();
    };
    navigationWheelNode?.addEventListener?.("wheel", navigationWheelHandler, { passive: false });
    updateMetrics();
  };

  const syncTacticalProjectBottomFrame = (projects) => {
    let frame = document.getElementById(TACTICAL_PROJECT_BOTTOM_FRAME_ID);
    if (config.themeId !== TACTICAL_THEME_ID || !projects) {
      frame?.remove();
      return;
    }
    const rect = projects.getBoundingClientRect?.();
    const mainRect = document.querySelector("main.main-surface")?.getBoundingClientRect?.();
    const borderWidth = Number.parseFloat(getComputedStyle(projects).borderBottomWidth) || 2;
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      frame?.remove();
      return;
    }
    if (!frame) {
      frame = document.createElement("div");
      frame.id = TACTICAL_PROJECT_BOTTOM_FRAME_ID;
      frame.setAttribute("aria-hidden", "true");
      document.body.appendChild(frame);
    }
    const bottom = Number.isFinite(mainRect?.bottom) ? mainRect.bottom : rect.bottom;
    const extensionTop = Math.min(bottom - borderWidth, rect.bottom - borderWidth);
    frame.style.left = `${Math.round(rect.left)}px`;
    frame.style.top = `${Math.round(extensionTop)}px`;
    frame.style.width = `${Math.round(rect.width)}px`;
    frame.style.height = `${Math.max(Math.ceil(borderWidth), Math.ceil(bottom - extensionTop))}px`;
  };

  const syncTacticalPaletteControls = (control) => {
    for (const button of control?.querySelectorAll?.(".dream-footer-theme-button") || []) {
      const selected = button.getAttribute("data-dream-tactical-palette") === tacticalPalette;
      button.setAttribute("aria-pressed", `${selected}`);
      button.textContent = "";
    }
    for (const button of control?.querySelectorAll?.(".dream-footer-effect-button") || []) {
      const effect = button.getAttribute("data-dream-tactical-effect");
      const enabled = effect === "scanline" ? tacticalScanlineEnabled : tacticalGloomEnabled;
      const selected = button.getAttribute("data-dream-tactical-enabled") === `${enabled}`;
      const label = button.getAttribute("data-dream-tactical-label") || "";
      button.setAttribute("aria-pressed", `${selected}`);
      button.textContent = selected ? `[${label}]` : label;
    }
  };

  const createTacticalEffectControl = (effect, label) => {
    const control = document.createElement("div");
    const title = document.createElement("span");
    control.classList.add("dream-footer-effect");
    title.classList.add("dream-footer-effect-label");
    title.textContent = `${label}//`;
    control.appendChild(title);
    for (const [enabled, text] of [[true, "ON"], [false, "OFF"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("dream-footer-effect-button");
      button.textContent = text;
      button.setAttribute("data-dream-tactical-effect", effect);
      button.setAttribute("data-dream-tactical-enabled", `${enabled}`);
      button.setAttribute("data-dream-tactical-label", text);
      button.setAttribute("aria-label", `Turn ${label.toLowerCase()} ${text.toLowerCase()}`);
      button.addEventListener("click", () => {
        if (effect === "scanline") tacticalScanlineEnabled = enabled;
        else tacticalGloomEnabled = enabled;
        const storageKey = effect === "scanline"
          ? TACTICAL_SCANLINE_STORAGE_KEY
          : TACTICAL_GLOOM_STORAGE_KEY;
        try { globalThis.localStorage?.setItem(storageKey, enabled ? "on" : "off"); } catch {}
        ensure();
      });
      control.appendChild(button);
    }
    return control;
  };

  const createTacticalPaletteControl = () => {
    const control = document.createElement("div");
    const label = document.createElement("span");
    control.classList.add("dream-footer-center", "dream-footer-theme");
    label.classList.add("dream-footer-theme-label");
    label.textContent = "THEME";
    control.appendChild(label);
    for (const [name, text] of TACTICAL_PALETTE_OPTIONS) {
      const button = document.createElement("button");
      button.type = "button";
      button.classList.add("dream-footer-theme-button");
      button.setAttribute("data-dream-tactical-palette", name);
      button.setAttribute("data-dream-tactical-palette-label", text);
      button.setAttribute("aria-label", `Switch to ${text} theme`);
      button.addEventListener("click", () => {
        tacticalPalette = name;
        try { globalThis.localStorage?.setItem(TACTICAL_PALETTE_STORAGE_KEY, name); } catch {}
        ensure();
      });
      control.appendChild(button);
    }
    control.appendChild(createTacticalEffectControl("scanline", "SCANLINE"));
    control.appendChild(createTacticalEffectControl("gloom", "GLOOM"));
    syncTacticalPaletteControls(control);
    return control;
  };

  const syncTacticalFooter = (aside, nav, navigationHead, navigationBody, projects, tasks) => {
    const root = document.documentElement;
    const tactical = config.themeId === TACTICAL_THEME_ID;
    root.classList.toggle("dream-sidebar-collapsed", tactical && !aside);
    root.classList.toggle("dream-scanline-off", tactical && !tacticalScanlineEnabled);
    root.classList.toggle("dream-gloom-off", tactical && !tacticalGloomEnabled);
    const nativeFooter = nav?.parentElement
      ? [...nav.parentElement.children].find((node) =>
        node !== nav && node.querySelector?.("button img")) || null
      : null;
    syncOwnedClass(SIDEBAR_NATIVE_FOOTER_CLASS, tactical ? [nativeFooter] : []);
    const nativeFooterButtons = nativeFooter ? [...nativeFooter.querySelectorAll("button")] : [];
    syncOwnedClass(
      "dream-tactical-footer-extra-control",
      tactical ? nativeFooterButtons.filter((button) => !button.querySelector?.("img")) : [],
    );

    let footer = document.getElementById(TACTICAL_FOOTER_ID);
    if (!tactical) {
      footer?.remove();
      return;
    }
    if (!footer) {
      footer = document.createElement("div");
      footer.id = TACTICAL_FOOTER_ID;
      const collapsedAvatar = document.createElement("img");
      collapsedAvatar.classList.add("dream-footer-collapsed-avatar");
      collapsedAvatar.alt = "";
      const username = document.createElement("span");
      username.classList.add("dream-footer-username");
      const online = document.createElement("span");
      online.classList.add("dream-footer-online");
      online.textContent = "● ONLINE";
      const clock = document.createElement("span");
      clock.classList.add("dream-footer-clock");
      footer.appendChild(collapsedAvatar);
      footer.appendChild(username);
      footer.appendChild(online);
      footer.appendChild(clock);
      document.body.appendChild(footer);
    }
    footer.removeAttribute?.("aria-hidden");
    footer.setAttribute("role", "group");
    footer.setAttribute("aria-label", "Tactical theme and visual effects");
    let themeControl = footer.querySelector?.(".dream-footer-theme");
    if (!themeControl) {
      footer.querySelector?.(".dream-footer-center")?.remove?.();
      themeControl = createTacticalPaletteControl();
      footer.appendChild(themeControl);
    }
    syncTacticalPaletteControls(themeControl);

    const avatar = nativeFooter?.querySelector?.("button img");
    const profileButton = nativeFooterButtons.find((button) => button.querySelector?.("img")) || null;
    const collapsedAvatar = footer.querySelector?.(".dream-footer-collapsed-avatar");
    const avatarSource = avatar?.currentSrc || avatar?.src || "";
    if (collapsedAvatar && avatarSource && collapsedAvatar.src !== avatarSource) {
      collapsedAvatar.src = avatarSource;
    }
    const username = footer.querySelector?.(".dream-footer-username");
    if (username) {
      const rawName = `${profileButton?.innerText || profileButton?.textContent || ""}`
        .replace(/\s+/g, " ")
        .trim();
      username.textContent = rawName;
    }
    const now = new Date();
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetRemainder = Math.abs(offsetMinutes) % 60;
    const offset = offsetRemainder
      ? `${offsetSign}${offsetHours}:${String(offsetRemainder).padStart(2, "0")}`
      : `${offsetSign}${offsetHours}`;
    const clock = footer.querySelector?.(".dream-footer-clock");
    if (clock) {
      clock.textContent = `GMT${offset}:${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ` +
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    const asideWidth = Number(aside?.getBoundingClientRect?.().width);
    if (Number.isFinite(asideWidth) && asideWidth > 0) {
      root.style.setProperty("--dream-token-runtime-sidebar-width", `${asideWidth}px`);
    } else if (tactical && !aside) {
      root.style.setProperty("--dream-token-runtime-sidebar-width", "48px");
    }
    const navigationBodyHeight = measuredHeight(navigationBody);
    const navigationHeadHeight = measuredHeight(navigationHead);
    const panelGap = Number.parseFloat(
      getComputedStyle(root).getPropertyValue?.("--dream-token-layout-panel-gap"),
    ) || 8;
    if (navigationBodyHeight > 0) {
      root.style.setProperty(
        "--dream-token-runtime-sidebar-navigation-body-height",
        `${navigationBodyHeight}px`,
      );
    }
    if (navigationHeadHeight > 0 && navigationBodyHeight > 0) {
      root.style.setProperty(
        "--dream-token-runtime-sidebar-project-frame-top",
        `${navigationHeadHeight + navigationBodyHeight + panelGap}px`,
      );
    }
    const nativeScroll = nav
      ? [...nav.children].find((node) => node.classList?.contains?.("vertical-scroll-fade-mask"))
      : null;
    // The parent list originally scrolls navigation and projects together. Keep
    // it at its origin and bind scrolling exclusively to the Project module.
    if (tactical && nativeScroll && nativeScroll.scrollTop !== 0) nativeScroll.scrollTop = 0;
    syncTacticalScrollbar(aside, projects, navigationBody);
    syncTacticalProjectBottomFrame(tactical && !tasks ? projects : null);
  };

  const syncTacticalNavigationItems = (navigationBody, navigationHead) => {
    const tactical = config.themeId === TACTICAL_THEME_ID;
    const definitions = [
      { match: "NEW TASK", index: "01", label: "NEW_TASK" },
      { match: "SCHEDULED", index: "02", label: "SCHEDULED" },
      { match: "PLUGINS", index: "03", label: "PLUGINS" },
      { match: "SITES", index: "04", label: "SITES" },
      { match: "CHAT", index: "05", label: "CHAT" },
    ];
    const items = [];
    const navigationRoots = [navigationHead, navigationBody].filter(Boolean);
    const controls = navigationRoots.flatMap((root) =>
      [...(root.querySelectorAll?.("button, [role=\"button\"], a") || [])]);
    const headControls = navigationHead
      ? [...(navigationHead.querySelectorAll?.("button, [role=\"button\"], a") || [])]
      : [];
    const modeSwitch = headControls.find((button) =>
      button.getAttribute?.("aria-haspopup") === "menu" &&
      /SWITCH MODE/i.test(button.getAttribute?.("aria-label") || "")) || null;
    const search = headControls.find((button) =>
      /^SEARCH$/i.test(button.getAttribute?.("aria-label") || "")) || null;
    const pullRequests = controls.find((button) =>
      /PULL REQUESTS/i.test(`${button.textContent || ""}`)) || null;

    if (tactical && modeSwitch) {
      const currentMode = `${modeSwitch.getAttribute?.("aria-label") || ""} ${modeSwitch.textContent || ""}`;
      modeSwitch.dataset.dreamTacticalMode = /CURRENT MODE:\s*CODEX/i.test(currentMode)
        ? "codex"
        : "work";
      delete modeSwitch.dataset.dreamTacticalNavIndex;
      delete modeSwitch.dataset.dreamTacticalNavLabel;
    }

    for (const button of controls) {
      if (button === modeSwitch || button === search || button === pullRequests) continue;
      const label = `${button.textContent || ""}`.replace(/\s+/g, " ").trim().toUpperCase();
      const definition = definitions.find((candidate) => label.includes(candidate.match));
      if (!tactical || !definition) continue;
      button.dataset.dreamTacticalNavIndex = definition.index;
      button.dataset.dreamTacticalNavLabel = definition.label;
      items.push(button);
    }
    for (const button of document.querySelectorAll(".dream-tactical-navigation-item")) {
      if (items.includes(button)) continue;
      delete button.dataset.dreamTacticalNavIndex;
      delete button.dataset.dreamTacticalNavLabel;
    }
    for (const button of document.querySelectorAll(".dream-tactical-mode-switch")) {
      if (button !== modeSwitch || !tactical) delete button.dataset.dreamTacticalMode;
    }
    syncOwnedClass("dream-tactical-mode-switch", tactical ? [modeSwitch] : []);
    syncOwnedClass("dream-tactical-search", tactical ? [search] : []);
    syncOwnedClass("dream-tactical-pull-requests", tactical ? [pullRequests] : []);
    syncOwnedClass("dream-tactical-navigation-item", tactical ? items : []);
    syncOwnedClass("dream-tactical-navigation-new-task", []);
    syncTacticalModeOptions(tactical ? modeSwitch : null);
    syncTacticalModeSwitchBinding(tactical ? modeSwitch : null);
    syncTacticalSearchAnchor(tactical ? search : null);
  };

  const syncTacticalProjectTree = (projects) => {
    // Preserve Codex's virtualized project list geometry. Tree decoration is CSS-only;
    // assigning layout classes to every native row caused clipping and scroll reflow.
    syncOwnedClass("dream-project-tree-item", []);
    syncOwnedClass("dream-project-tree-folder", []);
  };

  const syncSidebarModules = () => {
    const nav = document.querySelector("aside.app-shell-left-panel nav");
    const navChildren = nav ? [...nav.children] : [];
    const scroll = navChildren.find((node) =>
      node.classList?.contains?.("vertical-scroll-fade-mask"));
    let navigationHead = null;
    let navigationBody = null;
    let projects = null;
    let tasks = null;

    if (scroll) {
      const scrollIndex = navChildren.indexOf(scroll);
      navigationHead = navChildren
        .slice(0, scrollIndex)
        .reverse()
        .find((node) => node.querySelector?.("button")) || null;

      const titledRoots = [...new Set(
        [...scroll.querySelectorAll('[class~="group/nav-section-title"]')]
          .map((title) => directChildOf(title, scroll))
          .filter(Boolean),
      )];
      projects = titledRoots.find((node) =>
        node.querySelector?.('[class~="group/cwd"]')) || null;
      tasks = titledRoots.find((node) =>
        node !== projects &&
        (node.matches?.("section") || node.querySelector?.(":scope > section"))) || null;
      if (!projects) projects = titledRoots.find((node) => node !== tasks) || null;
      if (!tasks) tasks = titledRoots.find((node) => node !== projects) || null;

      const moduleIndexes = [projects, tasks]
        .map((node) => [...scroll.children].indexOf(node))
        .filter((index) => index >= 0);
      const boundary = moduleIndexes.length ? Math.min(...moduleIndexes) : scroll.children.length;
      navigationBody = [...scroll.children]
        .slice(0, boundary)
        .find((node) => node.querySelector?.("button")) || null;
    }

    syncOwnedClass("dream-sidebar-navigation-head", [navigationHead]);
    syncOwnedClass("dream-sidebar-navigation-body", [navigationBody]);
    syncTacticalNavigationItems(navigationBody, navigationHead);
    syncOwnedClass("dream-sidebar-projects", [projects]);
    syncTacticalProjectTree(projects);
    syncOwnedClass("dream-sidebar-tasks", [tasks]);
    syncTacticalFooter(
      document.querySelector("aside.app-shell-left-panel"),
      nav,
      navigationHead,
      navigationBody,
      projects,
      tasks,
    );
  };

  const syncMainLayout = () => {
    const tactical = config.themeId === TACTICAL_THEME_ID;
    const threadScroll = document.querySelector(".thread-scroll-container");
    const composerSection = threadScroll?.querySelector?.('[data-thread-scroll-footer="true"]') || null;
    const composerSurface = composerSection?.querySelector?.(".composer-surface-chrome") || null;
    const editable = composerSurface?.querySelector?.('[data-codex-composer="true"]') || null;
    const inputLine = editable?.parentElement?.parentElement || null;
    const statusBar = composerSurface?.querySelector?.('[class*="_footer_"]') || null;

    syncOwnedClass("dream-main-thread-scroll", tactical ? [threadScroll] : []);
    syncOwnedClass("dream-main-composer-section", tactical ? [composerSection] : []);
    syncOwnedClass("dream-composer-input-line", tactical ? [inputLine] : []);
    syncOwnedClass("dream-composer-status-bar", tactical ? [statusBar] : []);
    syncCliTranscript(threadScroll, tactical);
  };

  const nativeTacticalDetailPanel = () => document.querySelector?.(
    'aside[data-app-shell-focus-area="right-panel"]',
  ) || null;

  const setTacticalNativeConversationActive = (panel, active) => {
    const conversationTab = panel.querySelector?.(`.${TACTICAL_CONVERSATION_TAB_CLASS}`);
    panel.classList.toggle(TACTICAL_CONVERSATION_ACTIVE_CLASS, active);
    conversationTab?.setAttribute("aria-selected", `${active}`);
    for (const tab of panel.querySelectorAll('[role="tab"]')) {
      if (tab === conversationTab) continue;
      if (active) {
        tab.dataset.dreamTacticalNativeSelected = tab.getAttribute("aria-selected") || "false";
        tab.setAttribute("aria-selected", "false");
      } else if (tab.dataset.dreamTacticalNativeSelected) {
        tab.setAttribute("aria-selected", tab.dataset.dreamTacticalNativeSelected);
        delete tab.dataset.dreamTacticalNativeSelected;
      }
    }
  };

  const syncTacticalNativeConversationTab = (panel) => {
    if (!panel) {
      if (tacticalNativeTabsPanel) clearTacticalNativeTabsBinding();
      return;
    }
    if (tacticalNativeTabsPanel !== panel) {
      clearTacticalNativeTabsBinding();
      tacticalNativeTabsPanel = panel;
      tacticalNativeTabsClickHandler = (event) => {
        let eventNode = event.target;
        while (eventNode && eventNode !== panel) eventNode = eventNode.parentElement;
        if (eventNode !== panel) return;
        const conversationTab = event.target?.closest?.(`.${TACTICAL_CONVERSATION_TAB_CLASS}`);
        const nativeTab = event.target?.closest?.('[role="tab"]');
        const active = Boolean(conversationTab);
        if (!active && !nativeTab) return;
        if (active || panel.classList.contains(TACTICAL_CONVERSATION_ACTIVE_CLASS)) {
          event.preventDefault?.();
          event.stopImmediatePropagation?.();
        }
        setTacticalNativeConversationActive(panel, active);
      };
      window.addEventListener("click", tacticalNativeTabsClickHandler, true);
    }
    const tabList = panel.querySelector?.('[role="tablist"]');
    if (!tabList) return;
    let conversationTab = tabList.querySelector?.(`.${TACTICAL_CONVERSATION_TAB_CLASS}`);
    if (!conversationTab) {
      conversationTab = document.createElement("button");
      conversationTab.type = "button";
      conversationTab.classList.add(TACTICAL_CONVERSATION_TAB_CLASS);
      conversationTab.setAttribute("role", "tab");
      conversationTab.setAttribute("aria-selected", "false");
      conversationTab.textContent = "CONVERSATION";
      if (typeof tabList.prepend === "function") tabList.prepend(conversationTab);
      else tabList.appendChild(conversationTab);
    }
    let selectedNative = [...panel.querySelectorAll('[role="tab"][aria-selected="true"]')]
      .find((tab) => tab !== conversationTab);
    if (!panel.classList.contains(TACTICAL_CONVERSATION_ACTIVE_CLASS) && !selectedNative) {
      const tabPanelId = panel.querySelector?.('[data-app-shell-tab-panel-controller="right"]')
        ?.getAttribute?.("data-tab-id");
      selectedNative = [...panel.querySelectorAll('[role="tab"]')].find((tab) =>
        tab !== conversationTab && tab.closest?.('[data-app-shell-tab-controller="right"]')
          ?.getAttribute?.("data-tab-id") === tabPanelId);
      selectedNative?.setAttribute("aria-selected", "true");
    }
    const selectedController = selectedNative?.closest?.('[data-app-shell-tab-controller="right"]');
    const signature = selectedController?.getAttribute?.("data-tab-id") || selectedNative?.textContent || "";
    const previousSignature = panel.dataset.dreamTacticalNativeTabSignature || "";
    if (panel.classList.contains(TACTICAL_CONVERSATION_ACTIVE_CLASS) && signature &&
        previousSignature && signature !== previousSignature) {
      setTacticalNativeConversationActive(panel, false);
    }
    if (signature) panel.dataset.dreamTacticalNativeTabSignature = signature;
  };

  const syncTacticalNativeDetailPosition = (panel, target, heightTarget = target) => {
    const root = document.documentElement;
    const host = panel?.parentElement;
    const targetRect = target?.getBoundingClientRect?.();
    const heightRect = heightTarget?.getBoundingClientRect?.();
    const hostRect = host?.getBoundingClientRect?.();
    const properties = [
      "--dream-token-runtime-undecide-left",
      "--dream-token-runtime-undecide-top",
      "--dream-token-runtime-undecide-width",
      "--dream-token-runtime-undecide-height",
    ];
    if (!hostRect || !targetRect || !heightRect || targetRect.width <= 0 || heightRect.height <= 0) {
      properties.forEach((property) => root.style.removeProperty(property));
      return false;
    }
    const pixel = (value) => `${Math.round(value * 100) / 100}px`;
    root.style.setProperty(properties[0], pixel(targetRect.left - hostRect.left));
    root.style.setProperty(properties[1], pixel(targetRect.top - hostRect.top));
    root.style.setProperty(properties[2], pixel(targetRect.width));
    root.style.setProperty(properties[3], pixel(Math.max(0, heightRect.bottom - targetRect.top)));
    return true;
  };

  const syncTacticalRightRailResizer = (rail) => {
    const root = document.documentElement;
    let resizer = rail.querySelector?.(`.${TACTICAL_RIGHT_RAIL_RESIZE_CLASS}`);
    if (!resizer) {
      resizer = document.createElement("div");
      resizer.classList.add(TACTICAL_RIGHT_RAIL_RESIZE_CLASS);
      resizer.setAttribute("role", "separator");
      resizer.setAttribute("aria-orientation", "vertical");
      resizer.setAttribute("aria-label", "Resize detail panel");
      rail.appendChild(resizer);
      let drag = null;
      const apply = (clientX) => {
        const width = Math.round(clamp(window.innerWidth - Number(clientX), 280, Math.max(280, window.innerWidth * .55)));
        root.style.setProperty("--dream-token-runtime-right-rail-width", `${width}px`);
        resizer.setAttribute("aria-valuenow", `${width}`);
        try { localStorage.setItem(TACTICAL_RIGHT_RAIL_STORAGE_KEY, `${width}`); } catch {}
        scheduleEnsure();
      };
      resizer.addEventListener("pointerdown", (event) => {
        event.preventDefault?.();
        drag = event.pointerId;
        resizer.setPointerCapture?.(drag);
        apply(event.clientX);
      });
      resizer.addEventListener("pointermove", (event) => {
        if (drag === event.pointerId) apply(event.clientX);
      });
      const finish = (event) => {
        if (drag !== event.pointerId) return;
        resizer.releasePointerCapture?.(drag);
        drag = null;
      };
      resizer.addEventListener("pointerup", finish);
      resizer.addEventListener("pointercancel", finish);
    }
    if (!rail.dataset.dreamTacticalRightRailWidth) {
      rail.dataset.dreamTacticalRightRailWidth = "ready";
      try {
        const saved = Number(localStorage.getItem(TACTICAL_RIGHT_RAIL_STORAGE_KEY));
        if (Number.isFinite(saved) && saved >= 280) {
          root.style.setProperty("--dream-token-runtime-right-rail-width", `${Math.round(saved)}px`);
          resizer.setAttribute("aria-valuenow", `${Math.round(saved)}`);
        }
      } catch {}
    }
  };

  const tacticalPopoverForDetail = () => {
    const visible = (node) => {
      if (node.closest?.(`#${TACTICAL_RIGHT_RAIL_ID}, aside[data-app-shell-focus-area="right-panel"]`)) return false;
      const rect = node.getBoundingClientRect?.();
      const style = getComputedStyle(node);
      return Boolean(rect && rect.width > 0 && rect.height > 0 &&
        rect.width <= Math.min(720, window.innerWidth * .65) && rect.height <= window.innerHeight * .8 &&
        style.visibility !== "hidden" && style.display !== "none");
    };
    const summary = [...document.querySelectorAll('[data-pip-obstacle="thread-summary-panel"]')]
      .filter(visible).at(-1);
    return summary || null;
  };

  const syncTacticalDetailPopover = (body) => {
    const root = document.documentElement;
    const source = tacticalPopoverForDetail();
    root.classList.toggle("dream-tactical-summary-relocated", Boolean(source));
    const rect = body?.getBoundingClientRect?.();
    document.querySelectorAll(".dream-tactical-detail-popover-source").forEach((node) => {
      if (node !== source) node.classList.remove("dream-tactical-detail-popover-source");
    });
    const properties = [
      "--dream-token-runtime-detail-popover-left",
      "--dream-token-runtime-detail-popover-top",
      "--dream-token-runtime-detail-popover-width",
      "--dream-token-runtime-detail-popover-height",
    ];
    if (!source || !rect || rect.width <= 16 || rect.height <= 16) {
      properties.forEach((property) => root.style.removeProperty(property));
      if (body && body.dataset.dreamTacticalDetailKey !== "NO ACTIVE PANEL") {
        const empty = document.createElement("div");
        empty.classList.add("dream-tactical-no-signal");
        empty.textContent = "NO ACTIVE PANEL";
        body.dataset.dreamTacticalDetailKey = "NO ACTIVE PANEL";
        body.replaceChildren(empty);
      }
      return;
    }
    const pixel = (value) => `${Math.round(value * 100) / 100}px`;
    root.style.setProperty(properties[0], pixel(rect.left + 8));
    root.style.setProperty(properties[1], pixel(rect.top + 8));
    root.style.setProperty(properties[2], pixel(rect.width - 16));
    root.style.setProperty(properties[3], pixel(rect.height - 16));
    source.classList.add("dream-tactical-detail-popover-source");
    if (body.dataset.dreamTacticalDetailKey !== "native-popover") {
      body.dataset.dreamTacticalDetailKey = "native-popover";
      body.replaceChildren();
    }
  };

  const syncTacticalRightRail = (shellMain) => {
    const existing = document.getElementById(TACTICAL_RIGHT_RAIL_ID);
    if (config.themeId !== TACTICAL_THEME_ID) {
      existing?.remove();
      return;
    }
    let rail = existing;
    if (rail?.parentElement !== shellMain) {
      rail?.remove();
      rail = document.createElement("aside");
      rail.id = TACTICAL_RIGHT_RAIL_ID;
      rail.setAttribute("aria-hidden", "true");
      for (const { key, label } of [
        { key: "undecide", label: "DETAIL" },
        { key: "monitor", label: "MONITOR" },
      ]) {
        const module = document.createElement("section");
        const title = document.createElement("div");
        const body = document.createElement("div");
        module.classList.add("dream-tactical-right-module");
        module.dataset.dreamTacticalModule = key;
        title.classList.add("dream-tactical-right-title");
        body.classList.add("dream-tactical-right-body");
        title.textContent = label;
        module.appendChild(title);
        module.appendChild(body);
        rail.appendChild(module);
      }
      shellMain.appendChild(rail);
    }
    for (const { key, label } of [
      { key: "undecide", label: "DETAIL" },
      { key: "monitor", label: "MONITOR" },
    ]) {
      const module = [...rail.children].find((node) => node.dataset?.dreamTacticalModule === key);
      const title = module?.children?.[0];
      if (title) title.textContent = label;
    }
    syncTacticalRightRailResizer(rail);

    const monitorModule = [...rail.children].find((node) =>
      node.dataset?.dreamTacticalModule === "monitor");
    const monitorBody = [...(monitorModule?.children || [])].find((node) =>
      node.classList?.contains?.("dream-tactical-right-body"));
    const codeBurnCandidate = window.__CODEX_DREAM_SKIN_CODEBURN__;
    const codeBurn = Array.isArray(codeBurnCandidate?.activities) &&
      Array.isArray(codeBurnCandidate?.dailySpend) && codeBurnCandidate?.tokens
      ? codeBurnCandidate : null;
    const codeBurnKey = JSON.stringify(codeBurn || null);
    if (monitorBody && monitorBody.dataset.dreamCodeBurnKey !== codeBurnKey) {
      monitorBody.dataset.dreamCodeBurnKey = codeBurnKey;
      monitorBody.replaceChildren();
      if (!codeBurn) {
        const empty = document.createElement("div");
        empty.classList.add("dream-tactical-no-signal");
        empty.textContent = "CODEBURN OFFLINE";
        monitorBody.appendChild(empty);
      } else {
        const money = (value) => `${codeBurn.currency === "USD" ? "$" : `${codeBurn.currency} `}${value.toFixed(2)}`;
        const formatTokens = (value) => value >= 1e9 ? `${(value / 1e9).toFixed(1)}B` :
          value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(1)}K` : `${Math.round(value)}`;
        const monitor = document.createElement("div");
        const table = document.createElement("div");
        const tokenStats = document.createElement("div");
        const spend = document.createElement("div");
        const spendHeading = document.createElement("div");
        const bars = document.createElement("div");
        const axis = document.createElement("div");
        const scale = document.createElement("div");
        monitor.classList.add("dream-codeburn-monitor");
        table.classList.add("dream-codeburn-table");
        tokenStats.classList.add("dream-codeburn-tokens");
        spend.classList.add("dream-codeburn-spend");
        spendHeading.classList.add("dream-codeburn-spend-heading");
        bars.classList.add("dream-codeburn-bars");
        axis.classList.add("dream-codeburn-axis");
        scale.classList.add("dream-codeburn-scale");
        for (const value of ["ACTIVITY", "COST", "TURNS", "1-SHOTS"]) {
          const cell = document.createElement("span");
          cell.classList.add("dream-codeburn-header");
          cell.textContent = value;
          table.appendChild(cell);
        }
        for (const activity of codeBurn.activities) {
          for (const value of [activity.name, money(activity.cost), `${activity.turns}`, activity.oneShotRate === null ? "—" : `${Math.round(activity.oneShotRate * 100)}%`]) {
            const cell = document.createElement("span");
            if (value !== activity.name) cell.classList.add("dream-codeburn-number");
            cell.textContent = value;
            table.appendChild(cell);
          }
        }
        for (const [label, value] of [["30 DAYS", formatTokens(codeBurn.tokens.total)], ["AVG/DAY", formatTokens(codeBurn.tokens.average)], ["PEAK", formatTokens(codeBurn.tokens.peak)], ["YESTERDAY", formatTokens(codeBurn.tokens.yesterday)]]) {
          const stat = document.createElement("div");
          const heading = document.createElement("span");
          const content = document.createElement("strong");
          heading.textContent = label;
          content.textContent = value;
          stat.appendChild(heading);
          stat.appendChild(content);
          tokenStats.appendChild(stat);
        }
        spendHeading.textContent = "DAILY SPEND / 30 DAYS";
        const maximumSpend = Math.max(0, ...codeBurn.dailySpend.map((day) => day.cost));
        for (const day of codeBurn.dailySpend) {
          const bar = document.createElement("span");
          const height = maximumSpend
            ? Math.max(day.cost ? 2 : 0, Math.round((day.cost / maximumSpend) * 100))
            : 0;
          bar.style.height = `${height}%`;
          bar.title = `${day.date}  ${money(day.cost)}`;
          bars.appendChild(bar);
        }
        for (const index of [0, 6, 12, 18, 24, 29]) {
          const label = document.createElement("span");
          label.style.gridColumnStart = `${index + 1}`;
          label.textContent = codeBurn.dailySpend[index]?.date.slice(5).replace("-", "/") || "";
          axis.appendChild(label);
        }
        for (const value of [maximumSpend, maximumSpend / 2, 0]) {
          const label = document.createElement("span");
          label.textContent = money(value);
          scale.appendChild(label);
        }
        monitor.appendChild(table);
        monitor.appendChild(tokenStats);
        spend.appendChild(spendHeading);
        spend.appendChild(bars);
        spend.appendChild(axis);
        spend.appendChild(scale);
        monitor.appendChild(spend);
        monitorBody.appendChild(monitor);
      }
    }

    const undecideBody = rail.querySelector?.(
      '.dream-tactical-right-module[data-dream-tactical-module="undecide"] .dream-tactical-right-body',
    );
    const nativePanel = nativeTacticalDetailPanel();
    document.querySelectorAll(".dream-tactical-native-detail-source")
      .forEach((node) => {
        if (node !== nativePanel) node.classList.remove("dream-tactical-native-detail-source");
      });
    if (nativePanel) {
      if (!nativePanel.classList.contains("dream-tactical-native-detail-source")) {
        nativePanel.classList.add("dream-tactical-native-detail-source");
      }
      const mainHeader = shellMain.querySelector?.("header.app-header-tint") ||
        document.querySelector?.("main.main-surface > header.app-header-tint");
      syncTacticalNativeDetailPosition(nativePanel, mainHeader, shellMain);
      syncTacticalNativeConversationTab(nativePanel);
    } else {
      syncTacticalNativeDetailPosition(null, null);
      syncTacticalNativeConversationTab(null);
    }
    syncTacticalDetailPopover(undecideBody);
  };

  const nativeBrandModuleHref = () => {
    const link = document.querySelector(
      'link[rel="modulepreload"][href*="/openai-blossom-"][href$=".js"]',
    );
    const href = typeof link?.href === "string" ? link.href : "";
    return /^app:\/\/-\/assets\/openai-blossom-[a-z0-9_-]+\.js$/i.test(href) ? href : null;
  };

  const loadNativeBrandPath = async (href) => {
    if (typeof fetch !== "function") return null;
    try {
      const source = await (await fetch(href)).text();
      if (source.length < 256 || source.length > 20000) return null;
      const match = /viewBox:`0 0 21 21`[\s\S]{0,512}?children:[\s\S]{0,256}?d:`([^`]+)`,fill:`currentColor`/.exec(source);
      const path = match?.[1] || "";
      if (path.length < 500 || path.length > 16000) return null;
      if (!/^M[MmLlHhVvCcSsQqTtAaZzEe0-9+.,\-\s]+$/.test(path)) return null;
      return path;
    } catch {
      return null;
    }
  };

  const syncTacticalBrandMark = (shellMain) => {
    const existing = document.getElementById(BRAND_MARK_ID);
    if (config.themeId !== TACTICAL_THEME_ID || shellMain.classList?.contains?.("dream-home-shell")) {
      existing?.remove();
      return;
    }
    if (!nativeBrandPath) {
      const href = nativeBrandModuleHref();
      if (href && !brandLoadPromise && Date.now() >= brandRetryAfter) {
        brandLoadPromise = loadNativeBrandPath(href).then((path) => {
          brandLoadPromise = null;
          const state = window[STATE_KEY];
          if (state?.installToken !== installToken || window.__CODEX_DREAM_SKIN_DISABLED__) return;
          if (!path) {
            brandRetryAfter = Date.now() + 5000;
            return;
          }
          nativeBrandPath = path;
          brandRetryAfter = 0;
          ensure();
        });
      }
      return;
    }
    if (existing?.parentElement === shellMain) return;
    existing?.remove();
    try {
      const mark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      mark.id = BRAND_MARK_ID;
      mark.setAttribute("viewBox", "0 0 21 21");
      mark.setAttribute("aria-hidden", "true");
      mark.setAttribute("focusable", "false");
      path.setAttribute("d", nativeBrandPath);
      path.setAttribute("fill", "currentColor");
      mark.appendChild(path);
      shellMain.appendChild(mark);
    } catch {}
  };

  const applyProfile = (root) => {
    const focusX = config.focusX ?? profile.focusX;
    const focusY = config.focusY ?? profile.focusY;
    const appearance = config.appearance === "auto" ? detectShellAppearance() : config.appearance;
    const focus = focusX < .4 ? "left" : focusX > .6 ? "right" : "center";
    const safeArea = config.safeArea === "auto" ? (profile.safeArea ||
      (focus === "left" ? "right" : focus === "right" ? "left" : "center")) : config.safeArea;
    const taskMode = config.taskMode === "auto"
      ? profile.aspect >= 2.25 ? "banner" : "ambient"
      : config.taskMode;
    const accent = config.accent || `rgb(${profile.accent.join(" ")})`;
    const accentInk = config.tokenProperties[TOKEN_PROPERTY_MAP.colors.canvas] ||
      (luminance(...profile.accent) > .42 ? "rgb(26 24 28)" : "rgb(250 248 251)");
    root.setAttribute?.(THEME_ATTRIBUTE, config.themeId);
    root.classList.toggle("dream-theme-light", appearance === "light");
    root.classList.toggle("dream-theme-dark", appearance === "dark");
    root.classList.toggle("dream-art-wide", profile.aspect >= 1.75);
    root.classList.toggle("dream-art-standard", profile.aspect < 1.75);
    for (const value of ["left", "center", "right"]) {
      root.classList.toggle(`dream-focus-${value}`, focus === value);
    }
    for (const value of ["left", "center", "right", "none"]) {
      root.classList.toggle(`dream-safe-${value}`, safeArea === value);
    }
    for (const value of ["ambient", "banner", "off"]) {
      root.classList.toggle(`dream-task-${value}`, taskMode === value);
    }
    root.style.setProperty("--dream-art", `url("${artUrl}")`);
    root.style.setProperty("--dream-art-position", `${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}%`);
    root.style.setProperty("--dream-focus-x", String(focusX));
    root.style.setProperty("--dream-focus-y", String(focusY));
    for (const property of TOKEN_PROPERTIES) root.style.removeProperty(property);
    for (const [property, tokenValue] of Object.entries(config.tokenProperties)) {
      root.style.setProperty(property, tokenValue);
    }
    root.style.setProperty("--dream-accent", accent);
    root.style.setProperty("--dream-accent-ink", accentInk);
    applyTacticalPalette(root);
    root.style.setProperty("--dream-image-luma", profile.luma.toFixed(3));
  };

  const ensure = () => {
    if (window.__CODEX_DREAM_SKIN_DISABLED__) return;
    const root = document.documentElement;
    if (!root || !document.body) return;

    // Main Codex shell is the content surface. The left rail is optional: Codex
    // removes or rebuilds aside.app-shell-left-panel while collapsing/expanding
    // it, and clearing the skin there flashes native colors over the active theme.
    // True auxiliary windows (pets, blank targets) still have no main surface, so
    // they continue to clear residual skin state.
    const shellMain = document.querySelector("main.main-surface") ||
      document.querySelector("main") ||
      document.querySelector('[role="main"]');
    if (!shellMain) {
      clearSkinDom();
      return;
    }

    root.classList.add("codex-dream-skin");
    applyProfile(root);

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || root).appendChild(style);
    }
    if (style.dataset.dreamVersion !== "5") {
      style.textContent = cssText;
      style.dataset.dreamVersion = "5";
    }

    const home = document.querySelector('[role="main"]:has([data-testid="home-icon"])');
    const mainCandidates = [...document.querySelectorAll('[role="main"]')];
    if (!mainCandidates.length) mainCandidates.push(shellMain);
    for (const candidate of mainCandidates) {
      candidate.classList.toggle("dream-home", candidate === home);
      candidate.classList.toggle("dream-task", candidate !== home);
    }
    const utilityBars = new Set(home ? home.querySelectorAll('[class*="_homeUtilityBar_"]') : []);
    for (const candidate of document.querySelectorAll(`.${HOME_UTILITY_CLASS}`)) {
      if (!utilityBars.has(candidate)) candidate.classList.remove(HOME_UTILITY_CLASS);
    }
    for (const candidate of utilityBars) candidate.classList.add(HOME_UTILITY_CLASS);
    shellMain.classList.toggle("dream-home-shell", Boolean(home));
    syncSummaryPanels();
    syncTacticalTopBar();
    syncSidebarModules();
    syncMainLayout();
    syncTacticalRightRail(shellMain);
    syncTacticalBrandMark(shellMain);

    const tacticalAside = config.themeId === TACTICAL_THEME_ID
      ? document.querySelector("aside.app-shell-left-panel")
      : null;
    const tacticalProjects = tacticalAside?.querySelector?.(".dream-sidebar-projects") || null;
    if (typeof ResizeObserver === "function" &&
      (tacticalAside !== layoutObservedAside || tacticalProjects !== layoutObservedProjects)) {
      layoutObserver?.disconnect?.();
      layoutObserver = tacticalAside ? new ResizeObserver(() => scheduleEnsure()) : null;
      layoutObserver?.observe?.(tacticalAside);
      layoutObserver?.observe?.(tacticalProjects);
      layoutObservedAside = tacticalAside;
      layoutObservedProjects = tacticalProjects;
    }

    let chrome = document.getElementById(CHROME_ID);
    if (!chrome || chrome.parentElement !== document.body) {
      chrome?.remove();
      chrome = document.createElement("div");
      chrome.id = CHROME_ID;
      chrome.setAttribute("aria-hidden", "true");
      document.body.appendChild(chrome);
    }
    chrome.classList.toggle("dream-home-shell", Boolean(home));
    let bloom = chrome.querySelector?.(".dream-tactical-bloom");
    if (config.themeId === TACTICAL_THEME_ID && !bloom) {
      bloom = document.createElement("div");
      bloom.classList.add("dream-tactical-bloom");
      chrome.appendChild(bloom);
    } else if (config.themeId !== TACTICAL_THEME_ID) {
      bloom?.remove?.();
    }
  };

  const cleanup = () => {
    const state = window[STATE_KEY];
    if (state?.installToken !== installToken) return false;
    window.__CODEX_DREAM_SKIN_DISABLED__ = true;
    clearSkinDom();
    state?.observer?.disconnect();
    layoutObserver?.disconnect?.();
    layoutObserver = null;
    layoutObservedAside = null;
    layoutObservedProjects = null;
    clearTacticalScrollbarBindings();
    if (state?.timer) clearInterval(state.timer);
    if (state?.scheduler?.timeout) clearTimeout(state.scheduler.timeout);
    if (state?.artUrl) URL.revokeObjectURL(state.artUrl);
    delete window[STATE_KEY];
    return true;
  };

  const scheduler = { timeout: null };
  const scheduleEnsure = () => {
    if (scheduler.timeout) clearTimeout(scheduler.timeout);
    scheduler.timeout = setTimeout(() => {
      scheduler.timeout = null;
      ensure();
    }, 180);
  };
  observer = new MutationObserver((records) => {
    if (samplingNativeShell) return;
    const summaryChanged = records.some((record) =>
      [...(record.addedNodes || []), ...(record.removedNodes || [])].some((node) =>
        node.matches?.('[data-pip-obstacle="thread-summary-panel"]') ||
        node.querySelector?.('[data-pip-obstacle="thread-summary-panel"]'),
      ));
    if (summaryChanged) {
      if (scheduler.timeout) clearTimeout(scheduler.timeout);
      scheduler.timeout = null;
      ensure();
      return;
    }
    scheduleEnsure();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-appearance", "data-color-mode", "aria-selected"],
  });
  const timer = setInterval(ensure, 5000);
  window[STATE_KEY] = {
    ensure, cleanup, observer, timer, scheduler, artUrl, profile, config, installToken, version: "1.5.0",
  };
  ensure();
  analyzeArt().then((result) => {
    const state = window[STATE_KEY];
    if (state?.installToken !== installToken || window.__CODEX_DREAM_SKIN_DISABLED__) return;
    profile = result;
    state.profile = result;
    ensure();
  });
  return { installed: true, version: "1.5.0", adaptive: true };
})(__DREAM_CSS_JSON__, __DREAM_ART_JSON__, __DREAM_THEME_JSON__)
