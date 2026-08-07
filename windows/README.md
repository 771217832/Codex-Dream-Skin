# Codex Dream Skin for Windows

<p align="center">
  <strong>中文</strong> · <a href="./README.en.md">English</a>
</p>

Codex Dream Skin 通过本机回环 CDP 给官方 Codex Windows 桌面应用加载外部主题。它保留原生侧栏、项目选择、任务内容和输入框，不修改 WindowsApps、`app.asar` 或应用签名。

## 运行要求

- 从 Microsoft Store 安装且已注册到当前用户的官方 `OpenAI.Codex` 应用。
- Node.js 22 或更高版本，`node.exe` 可从 `PATH` 找到。
- Windows PowerShell 5.1 或更高版本。

安装脚本需要在 Codex 完全退出后运行。普通使用不需要管理员权限，也不需要接管 WindowsApps 目录。

## 安装

在 PowerShell 中进入仓库的 `windows` 目录，然后运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1
```

安装器会校验官方 Codex Store 包和 Node.js，保存可恢复的外观配置，并初始化本地主题仓库。默认还会创建这些快捷方式：

- `Codex Dream Skin`：启动或重新应用皮肤。
- `Codex Dream Skin - Tray`：打开系统托盘主题控制。
- `Codex Dream Skin - Restore`：恢复官方外观并关闭已保存的 CDP 会话。

安装命令中的 `Bypass` 只作用于这一次由用户明确发起的安装进程。安装器会先校验运行时副本的 SHA-256，再仅对 `%LOCALAPPDATA%\CodexDreamSkin\engine` 中受管的 PowerShell 副本清除下载区标记。日常快捷方式使用 `RemoteSigned`，不会绕过系统或企业组策略。

如需使用自定义端口，可以在安装时传入 `-Port`。端口范围必须是 `1024` 到 `65535`。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-dream-skin.ps1 -Port 9444
```

## 更新

先退出 Dream Skin 托盘并关闭 Codex，再更新仓库（`git pull`，或重新下载最新源码），然后重新运行上面的安装命令。安装器会原子替换受管运行时并重建快捷方式；当前主题、已保存主题和导入图片不会被删除。

## 启动与验证

推荐从 `Codex Dream Skin` 快捷方式启动。它发现 Codex 已经运行时会先询问是否重启。

命令行启动：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-dream-skin.ps1 -PromptRestart
```

启动后运行验证脚本：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-dream-skin.ps1 `
  -ScreenshotPath "$env:TEMP\codex-dream-skin.png"
```

验证脚本会自动确认：

- CDP 端点只绑定本机回环地址，并且属于当前官方 Codex 包。
- 当前渲染页已经加载预期版本的皮肤。
- 原生侧栏和输入框仍然存在。
- 皮肤装饰层不会拦截鼠标事件。
- 当前为首页时，首页主题结构已经正确加载。

随后用生成的截图检查横向溢出和文字对比度，再分别在首页与普通任务页手动检查项目菜单和输入框交互。完整视觉检查项见 [`references/qa-inventory.md`](./references/qa-inventory.md)。

## 更换和保存主题

打开 `Codex Dream Skin - Tray` 后可以：

- 更换 PNG、JPEG 或 WebP 背景图。
- 保存当前主题并从「已保存主题」切换。
- 暂停或继续显示皮肤。
- 重新应用主题，或完整恢复 Codex。

导入图片必须是纯背景，不要使用包含窗口、侧栏、输入框、文字或按钮的效果截图。图片上限为 16 MB；宽或高不能超过 16384 像素，总像素不能超过 5000 万。

### Codex Tactical CRT 预设与设计令牌

安装后，`Codex Tactical CRT` 会和 Gothic 一样出现在托盘的「已保存主题」中；首次安装仍以 Arina 为当前主题。选择该预设后使用「重新应用主题」即可启用。它固定为暗色，保留 Codex 的原生布局和真实控件，只增加军用 CRT 风格的颜色、硬边框、字体与非交互装饰层。顶部琥珀色应用栏采用更高的仪表舱比例；中央任务区使用深绿色磷光场，并在可安全取得原生几何时显示低强度 OpenAI 磷光标记。

侧栏沿用 Codex 的真实数据和交互：`01.NAVIGATION` 包含「新建任务」「已安排」「插件」「站点」「拉取请求」和「聊天」，`02.PROJECTS` 包含项目及项目内的真实线程；中央当前任务面板为 `03.MAIN_TASK`。原生底部「任务」控件保留为未编号辅助区。模块标题和边框不会创建虚构入口，也不会替换原生控件。

整套 Tactical CRT 的可调视觉参数集中在 `theme.json` 的可选 `tokens` 对象。开发时编辑 [`presets/preset-codex-tactical-crt/theme.json`](./presets/preset-codex-tactical-crt/theme.json)；安装后可编辑 `%LOCALAPPDATA%\CodexDreamSkin\themes\preset-codex-tactical-crt\theme.json`，再从托盘重新选择该主题并应用。令牌分为：

- `colors`：画布、表面、文字、强调色、成功色、磷光色，以及强/标准/弱线条颜色。其中 `phosphor` 统一控制中央任务区的深绿场与 OpenAI 磷光标记。颜色只接受 `#RGB`、`#RRGGBB`、`#RRGGBBAA` 和受限的 `rgb()`、`hsl()`、`oklch()`、`oklab()`；分号、花括号和 CSS 片段会被拒绝。
- `strokes`：`subtle`、`default`、`strong`、`focus`，单位为像素，范围 `0–50`。
- `radii`：`panel`、`control`，单位为像素，范围 `0–16`。
- `effects`：`scanlineWidth` 控制扫描线粗细（`0.5–12px`），`scanlineDepth` 控制扫描线深度（`0–0.6`），`scanlineSpeed` 控制滚动周期（`0.25–120` 秒，越小越快）；另有 `gridOpacity`、`vignetteOpacity` 和 `brandOpacity`。旧版 `scanlineOpacity` 仍兼容。

字段逐项校验：非法值只回退对应的预设默认值，未知字段会被忽略。`tokens.colors.accent` 优先于兼容旧主题的 `palette.accent`。预设样式集中在 [`assets/presets/preset-codex-tactical-crt.css`](./assets/presets/preset-codex-tactical-crt.css)，所有颜色、线宽、圆角和 CRT 透明度都从令牌读取，因此修改一处即可同步对应层级。

背景为本项目通过 OpenAI 图像生成创建的原创纯背景；用户提供的截图只用于风格方向，没有作为像素素材导入。完整提示词、来源声明和最终尺寸见 [`presets/preset-codex-tactical-crt/ASSET.md`](./presets/preset-codex-tactical-crt/ASSET.md)。OpenAI 标记的几何不会随主题分发：渲染器只会在运行时从已安装 Codex 自带、同源的 `openai-blossom` 模块读取，并严格校验资源地址、模块大小和路径数据；任一检查失败就省略标记。该运行时复用仅用于匹配宿主应用的原生视觉，不表示 OpenAI 对此主题的背书。切回 Arina、Gothic 或自定义图片时，主题作用域、令牌变量、字体、CRT 装饰和标记都会在重新注入时清理。

## 恢复与卸载快捷方式

恢复官方外观；如果 Codex 正在运行，确认后关闭并重新打开：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-dream-skin.ps1 `
  -RestoreBaseTheme -PromptRestart
```

如需同时删除 Dream Skin 创建的快捷方式，再增加 `-Uninstall`：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore-dream-skin.ps1 `
  -RestoreBaseTheme -PromptRestart -Uninstall
```

`-RecoverConfigBackup` 用于明确恢复安装前的完整 `config.toml` 备份。它会先保存当前配置，只应在配置损坏且普通的 `-RestoreBaseTheme` 无法解决时使用。

## 文件与日志位置

| 用途 | 路径 |
|------|------|
| Dream Skin 状态根目录 | `%LOCALAPPDATA%\CodexDreamSkin` |
| 当前主题 | `%LOCALAPPDATA%\CodexDreamSkin\active-theme` |
| 已保存主题 | `%LOCALAPPDATA%\CodexDreamSkin\themes` |
| 导入图片归档 | `%LOCALAPPDATA%\CodexDreamSkin\images` |
| 会话状态 | `%LOCALAPPDATA%\CodexDreamSkin\state.json` |
| 注入器日志 | `%LOCALAPPDATA%\CodexDreamSkin\injector.log` |
| 注入器错误日志 | `%LOCALAPPDATA%\CodexDreamSkin\injector-error.log` |
| 验证日志 | `%LOCALAPPDATA%\CodexDreamSkin\verify.log` |
| Codex 配置 | `%USERPROFILE%\.codex\config.toml` |

更完整的平台路径说明见 [`../docs/platforms.md`](../docs/platforms.md)。

## 常见问题

### 找不到 Node.js

运行 `node --version`，确认版本为 22 或更高，并重新打开 PowerShell 让新的 `PATH` 生效。

### 找不到官方 Codex 包

运行：

```powershell
Get-AppxPackage -Name OpenAI.Codex
```

脚本只接受已注册的官方 Store 包，不会从任意可执行文件路径启动 Codex。

### 安装器要求关闭 Codex

关闭所有 Codex 窗口后再运行安装器。安装期间必须保持配置和应用状态稳定。

### 杀毒软件报告旧版托盘快捷方式

旧版托盘快捷方式同时使用隐藏 PowerShell 和 `ExecutionPolicy Bypass`，可能触发基于行为特征的 LNK 告警。不要直接加入白名单；更新源码并重新运行安装器，让快捷方式改用 `RemoteSigned`。如果新版仍然报警，请保留隔离状态，并在 Issue 中附上杀毒软件名称、版本、告警名称和快捷方式属性，不要上传密钥或私人数据。

### 端口被占用

没有显式指定 `-Port` 时，启动脚本会从默认端口 `9335` 开始寻找空闲端口。显式端口被其他进程占用时，改用另一个端口，不要关闭身份不明的监听进程。

### 验证找不到 CDP 端点

通过 `Codex Dream Skin` 快捷方式启动 Codex，再运行验证脚本。普通 Codex 启动方式不会打开 Dream Skin 所需的调试会话。

### Codex 更新后皮肤失效

重新运行安装器和启动快捷方式。脚本会重新发现当前注册的 Store 包，不依赖旧版本的可执行文件路径。

提交问题时请从仓库的 [Issue 提交页](https://github.com/Fei-Away/Codex-Dream-Skin/issues/new/choose) 选择 Bug 模板，附上系统版本、Codex 来源、复现步骤和相关日志片段。请删除密钥、`auth.json`、中转 token 和私人对话内容。

## 安全边界

- CDP 只绑定 `127.0.0.1`。皮肤运行期间不要运行来路不明的本机程序。
- 不修改官方 Codex 安装目录、WindowsApps、`app.asar` 或签名。
- 不写入 API Key、Base URL 或模型供应商配置。
- 恢复脚本只会控制经过包身份、进程路径和会话状态校验的 Codex 进程。

维护者和代理使用的实现约束见 [`SKILL.md`](./SKILL.md)，运行时排错细节见 [`references/runtime-notes.md`](./references/runtime-notes.md)。
