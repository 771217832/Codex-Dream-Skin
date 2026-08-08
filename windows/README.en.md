# Codex Dream Skin for Windows

<p align="center">
  <a href="./README.md">中文</a> · <strong>English</strong>
</p>

Codex Dream Skin loads an external theme into the official Codex Windows desktop app through loopback CDP. The native sidebar, project picker, task content, and composer remain interactive. The tool does not modify WindowsApps, `app.asar`, or the app signature.

## Requirements

- The official `OpenAI.Codex` app installed from Microsoft Store and registered for the current user.
- Node.js 22 or newer, with `node.exe` available on `PATH`.
- Windows PowerShell 5.1 or newer.

Run the installer after Codex has fully exited. Normal use does not require administrator access or ownership changes under WindowsApps.

## Install

Open PowerShell in the repository's `windows` directory and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

The installer validates the official Codex Store package and Node.js, saves a recoverable appearance baseline, and initializes the local theme store. By default it also creates these shortcuts:

- `Codex Dream Skin`: launch or reapply the skin.
- `Codex Dream Skin - Tray`: open the system tray theme controls.
- `Codex Dream Skin - Restore`: restore the stock appearance and close the saved CDP session.

`Bypass` in the install command applies only to that user-initiated installer process. The installer verifies the runtime copy with SHA-256, then clears download-zone markers only from managed PowerShell copies under `%LOCALAPPDATA%\CodexDreamSkin\engine`. Daily shortcuts use `RemoteSigned` and do not override system or enterprise Group Policy.

Pass `-Port` during installation to use a fixed custom port. Valid ports range from `1024` through `65535`.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1 -Port 9444
```

## Update

Exit the Dream Skin tray and close Codex, update the checkout (`git pull`, or download the latest source again), then rerun the install command above. The installer atomically replaces the managed runtime and rebuilds its shortcuts without deleting the active theme, saved themes, or imported images.

## Launch and verify

The `Codex Dream Skin` shortcut is the recommended launcher. It asks for confirmation before restarting an open Codex window.

Command-line launch:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dream-skin.ps1 -PromptRestart
```

Run verification after launch:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-dream-skin.ps1 `
  -ScreenshotPath "$env:TEMP\codex-dream-skin.png"
```

The verification script confirms:

- The CDP endpoint is bound to loopback and belongs to the current official Codex package.
- The current renderer has loaded the expected skin version.
- The native sidebar and composer remain present.
- The decorative skin layer does not intercept pointer events.
- When the current route is home, the themed home structure has loaded.

Next, use the generated screenshot to check horizontal overflow and text contrast. On both the home and normal task routes, manually check the project menu and composer interaction. See [`references/qa-inventory.md`](./references/qa-inventory.md) for the complete visual checklist.

## Change and save themes

Open `Codex Dream Skin - Tray` to:

- Import a PNG, JPEG, or WebP background.
- Save the active theme and switch through saved themes.
- Pause or resume the skin.
- Reapply the theme or fully restore Codex.

Import a UI-free wallpaper rather than a preview containing a window, sidebar, composer, text, or buttons. Images may be at most 16 MB, 16384 pixels on either side, and 50 million total pixels.

### Codex Tactical CRT preset and design tokens

After installation, `Codex Tactical CRT` appears under the tray's saved themes alongside Gothic; Arina remains the first-install active theme. Select the preset and choose reapply to enable it. The preset is dark-only and preserves Codex's native layout and controls while adding military CRT colors, hard instrument borders, typography, and pointer-transparent decoration. Its amber application header uses a taller instrument-console proportion, while the central task area carries a deep-green phosphor field and, when native geometry can be obtained safely, a low-intensity OpenAI phosphor mark.

The sidebar keeps Codex's real data and interactions. `NAVIGATION` retains the search action and anchors its panel below the search field. The native mode switch appears as `MODE // WORK CODEX`; click `WORK` or `CODEX` directly to switch. Five aligned primary rows run from `01 NEW_TASK` through `05 CHAT`. In Codex mode, Pull requests remains available as a compact native control on the right side of the `SITES` row, so it does not interrupt the 01-05 rhythm. `PROJECT` contains projects and their real threads, while the central current-task panel is `MAINTASK`. The native bottom Tasks control remains an unnumbered utility area. The module headings and borders do not create fictional destinations or replace native controls.

All adjustable Tactical CRT values live in the optional `tokens` object in `theme.json`. During development, edit [`presets/preset-codex-tactical-crt/theme.json`](./presets/preset-codex-tactical-crt/theme.json). After installation, edit `%LOCALAPPDATA%\CodexDreamSkin\themes\preset-codex-tactical-crt\theme.json`, then select and reapply that saved theme from the tray.

- `colors` covers canvas, surfaces, text, accent, success, phosphor, and strong/default/subtle lines. `phosphor` controls both the central task area's deep-green field and the OpenAI phosphor mark. It accepts hex and restricted `rgb()`, `hsl()`, `oklch()`, or `oklab()` values; semicolons, braces, and CSS fragments are rejected.
- `strokes` contains `subtle`, `default`, `strong`, and `focus` pixel values in the `0–50` range.
- `radii` contains `panel` and `control` pixel values in the `0–16` range.
- `effects` contains `scanlineOpacity`, `gridOpacity`, `vignetteOpacity`, and `brandOpacity` in the `0–0.35` range. `brandOpacity` independently controls the central phosphor mark's opacity.
- `layout` includes `titleHeight` (`24–72px`), `headerHeight` (`40–120px`), `navigationRowHeight` for the 01–05 row rhythm (`36–64px`), and `navigationFontSize` for their index and label text (`14–30px`).

Validation is per field: an invalid value falls back only for that preset default, and unknown fields are ignored. `tokens.colors.accent` takes precedence over the legacy-compatible `palette.accent`. The managed stylesheet at [`assets/presets/preset-codex-tactical-crt.css`](./assets/presets/preset-codex-tactical-crt.css) reads every color, stroke, radius, and CRT opacity from these variables, so one token change updates the matching visual hierarchy.

The wallpaper is an original UI-free background generated for this project with OpenAI image generation. The supplied screenshot informed style direction only and was not imported as pixel content. See [`presets/preset-codex-tactical-crt/ASSET.md`](./presets/preset-codex-tactical-crt/ASSET.md) for the prompt, provenance, and final dimensions. The OpenAI mark geometry is not distributed with the theme: at runtime, the renderer reads it only from the installed Codex application's same-origin `openai-blossom` module after strict validation of the resource URL, module size, and path data. If any check fails, the mark is omitted. This runtime reuse only matches the host application's native visual and does not imply OpenAI endorsement of the theme. Reinjecting Arina, Gothic, or a custom image removes the Tactical theme scope, token variables, type treatment, CRT overlay, and mark.

## Restore and remove shortcuts

Restore the stock appearance. If Codex is running, confirm its closure and relaunch:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-dream-skin.ps1 `
  -RestoreBaseTheme -PromptRestart
```

Add `-Uninstall` to also remove the shortcuts created by Dream Skin:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-dream-skin.ps1 `
  -RestoreBaseTheme -PromptRestart -Uninstall
```

`-RecoverConfigBackup` restores the complete pre-install `config.toml` backup and saves the current configuration first. Reserve it for a damaged configuration that normal `-RestoreBaseTheme` recovery cannot resolve.

## Files and logs

| Purpose | Path |
|---------|------|
| Dream Skin state root | `%LOCALAPPDATA%\CodexDreamSkin` |
| Active theme | `%LOCALAPPDATA%\CodexDreamSkin\active-theme` |
| Saved themes | `%LOCALAPPDATA%\CodexDreamSkin\themes` |
| Imported image archive | `%LOCALAPPDATA%\CodexDreamSkin\images` |
| Session state | `%LOCALAPPDATA%\CodexDreamSkin\state.json` |
| Injector log | `%LOCALAPPDATA%\CodexDreamSkin\injector.log` |
| Injector error log | `%LOCALAPPDATA%\CodexDreamSkin\injector-error.log` |
| Verification log | `%LOCALAPPDATA%\CodexDreamSkin\verify.log` |
| Codex configuration | `%USERPROFILE%\.codex\config.toml` |

See [`../docs/platforms.md`](../docs/platforms.md) for the complete platform path reference.

## Troubleshooting

### Node.js is missing

Run `node --version`, confirm that it reports version 22 or newer, and reopen PowerShell so an updated `PATH` takes effect.

### The official Codex package is missing

Run:

```powershell
Get-AppxPackage -Name OpenAI.Codex
```

The scripts accept only a registered official Store package. They do not launch Codex from an arbitrary executable path.

### The installer asks you to close Codex

Close every Codex window and run the installer again. Installation requires stable app and configuration state.

### Antivirus reports the old tray shortcut

Older tray shortcuts combined hidden PowerShell with `ExecutionPolicy Bypass`, which can trigger behavior-based LNK detections. Do not whitelist the detection blindly. Update the source and rerun the installer so the shortcuts use `RemoteSigned`. If the updated shortcut is still detected, leave it quarantined and report the antivirus product, version, detection name, and shortcut properties without sharing secrets or private data.

### The port is occupied

When `-Port` is omitted, the launcher searches for a free port beginning at `9335`. If another process owns an explicitly requested port, choose a different port rather than stopping an unknown listener.

### Verification cannot find a CDP endpoint

Launch Codex through the `Codex Dream Skin` shortcut, then run verification. A normal Codex launch does not open the debug session used by Dream Skin.

### The skin stops working after a Codex update

Run the installer and launch shortcut again. The scripts rediscover the currently registered Store package instead of trusting an executable path from an older app version.

Open the repository's [new issue page](https://github.com/Fei-Away/Codex-Dream-Skin/issues/new/choose) and choose the bug form when reporting a problem. Include the Windows version, Codex source, reproduction steps, and relevant log lines. Remove secrets, `auth.json`, relay tokens, and private conversation content.

## Security boundaries

- CDP binds only to `127.0.0.1`. Avoid untrusted local software while the skin is active.
- The tool does not modify the official Codex installation, WindowsApps, `app.asar`, or signatures.
- It does not write API keys, Base URLs, or model provider settings.
- Restore controls only Codex processes that pass package identity, executable path, and recorded session checks.

Maintainer and agent constraints live in [`SKILL.md`](./SKILL.md). See [`references/runtime-notes.md`](./references/runtime-notes.md) for deeper runtime troubleshooting.
