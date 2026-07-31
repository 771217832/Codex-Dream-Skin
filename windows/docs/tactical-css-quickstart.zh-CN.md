# 用 Codex Tactical CRT 快速入门 CSS 与前端

这不是一份从零开始的完整前端教材。它假设你已经理解变量、函数、条件判断和基本调试思路，目标是让你能读懂并安全微调本项目的 Tactical CRT 主题。

学完后，你应该能够：

- 看懂项目里的 CSS 选择器和声明。
- 判断一个尺寸、间距、框线或滚动问题应该改哪一层。
- 使用 CSS 变量完成大部分视觉微调。
- 理解 `position`、Flex、盒模型和滚动容器如何共同决定布局。
- 看懂 `renderer-inject.js` 中最必要的 DOM 查询与语义类注入。
- 在不破坏 Codex 原生交互的前提下完成修改、预览、验证和回退。

## 1. 先建立项目地图

Tactical CRT 主题主要由三层组成：

```text
theme.json
  └─ 颜色、线宽、圆角、效果等经过校验的设计令牌

preset-codex-tactical-crt.css
  └─ Header、01、02、03、Composer、Footer 的布局与视觉

renderer-inject.js
  └─ 识别 Codex 原生 DOM、添加稳定类名、计算尺寸、处理自定义滚动条
```

对应文件：

- [`presets/preset-codex-tactical-crt/theme.json`](../presets/preset-codex-tactical-crt/theme.json)
- [`assets/presets/preset-codex-tactical-crt.css`](../assets/presets/preset-codex-tactical-crt.css)
- [`assets/renderer-inject.js`](../assets/renderer-inject.js)
- [`scripts/injector.mjs`](../scripts/injector.mjs)

### 三层应该分别修改什么

| 想修改的内容 | 首选位置 |
| --- | --- |
| 主色、背景色、文字色、线条颜色 | `theme.json` |
| 默认线宽、圆角、CRT 效果透明度 | `theme.json` |
| 模块高度、间距、布局比例、边框方向 | Tactical CSS |
| 伪元素标题、背景网格、字体、对齐方式 | Tactical CSS |
| DOM 分类、自定义滚动条拖动算法 | `renderer-inject.js` |
| 主题加载、验证、清理 | `injector.mjs` |

一个重要原则：能用 CSS 解决的视觉问题，不要先改 JavaScript。JavaScript 负责“找到谁”和“怎样交互”，CSS 负责“长什么样”和“放在哪里”。

### 小练习：判断修改层

判断下面三项应该修改哪个文件：

1. 把金色改成冷蓝色。
2. 把 01 与 02 的距离从 `8px` 改成 `12px`。
3. 把滚动条轨道点击后的翻页距离从当前视口的 `85%` 改成 `70%`。

答案分别是：`theme.json`、Tactical CSS、`renderer-inject.js`。

## 2. 一次安全的修改循环

开发时从 `windows` 目录操作：

```powershell
cd E:\CodexUi\windows
```

修改前先观察当前差异：

```powershell
git diff -- .\assets\presets\preset-codex-tactical-crt.css
```

Codex 已经通过 Dream Skin 启动且调试端口为 `9335` 时，可以直接从源码重新注入，无需每次重装：

```powershell
$versionInfo = Invoke-RestMethod http://127.0.0.1:9335/json/version
$browserId = ([uri]$versionInfo.webSocketDebuggerUrl).Segments[-1]

node .\scripts\injector.mjs `
  --once `
  --port 9335 `
  --browser-id $browserId `
  --theme-dir .\presets\preset-codex-tactical-crt
```

这次注入会持续到页面重载或 Codex 重启。修改满意后，再关闭 Codex 和托盘程序并运行安装脚本，写入持久版本：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\install-dream-skin.ps1
```

验证当前界面并截图：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\verify-dream-skin.ps1 `
  -Port 9335 `
  -ScreenshotPath "$env:TEMP\codex-tactical-check.png"
```

### 安全回退

- 刚改完就发现不对：优先使用编辑器撤销。
- 想看自己改了什么：使用 `git diff -- <文件>`。
- 不要在有其他未提交修改时随手执行会丢弃整个文件改动的命令。
- 修改 JavaScript 前，先确认问题确实不是 CSS 能解决的。

### 小练习：只改一个值

在 Tactical CSS 顶部找到：

```css
--dream-token-layout-panel-gap: 8px;
```

把它暂时改成 `12px`，执行一次源码注入，观察 01 与 02 的距离，然后用编辑器撤销。

## 3. CSS 规则到底在说什么

一条 CSS 规则由“选择器”和“声明块”组成：

```css
.dream-sidebar-navigation-body {
  width: 100%;
  border-top: none !important;
}
```

- `.dream-sidebar-navigation-body`：选择哪些元素。
- `{ ... }`：对这些元素应用什么样式。
- `width`、`border-top`：属性。
- `100%`、`none`：属性值。
- `!important`：提高这条声明在层叠冲突中的优先权。

项目中的真实选择器通常更长：

```css
:root.codex-dream-skin.dream-theme-dark
[data-dream-theme-id="preset-codex-tactical-crt"]
.dream-sidebar-navigation-body {
  /* ... */
}
```

可以从右向左读：

1. 找到 `.dream-sidebar-navigation-body`。
2. 它必须位于指定主题 ID 的页面内。
3. 页面根节点还必须同时具有皮肤和暗色主题类。

这么写的目的不是炫技，而是防止 Tactical 样式泄漏到其他预设。

## 4. 本项目最常见的选择器

### 类选择器

```css
.dream-sidebar-projects
```

选择拥有这个类名的元素。

### ID 选择器

```css
#codex-dream-skin-project-scrollbar
```

选择具有唯一 ID 的自定义滚动条。

### 属性选择器

```css
[data-dream-theme-id="preset-codex-tactical-crt"]
```

属性值必须完全相等。

```css
[class~="group/application-menu-top-bar"]
```

`~=` 表示空格分隔的类名列表中包含完整单词。它比模糊匹配安全。

```css
[class*="_footer_"]
```

`*=` 表示属性文本中包含某个片段。本项目只在没有更稳定标记时使用它。

### 后代和直接子元素

```css
aside.app-shell-left-panel nav
```

空格表示任意层级的后代。

```css
nav > .vertical-scroll-fade-mask
```

`>` 只选择直接子元素。DOM 层级发生变化时，这类选择器更容易失效，但也更精确。

### 多个选择器共享规则

```css
button,
[role="button"] {
  border-radius: var(--dream-token-radius-control);
}
```

逗号表示两组元素都应用同一声明块。

### 伪类和伪元素

```css
button:hover
```

`:hover` 是元素处于鼠标悬停状态时的伪类。

```css
:focus-visible
```

元素通过键盘等方式获得可见焦点时生效。

```css
.dream-composer-input-line::before
```

`::before` 创建一个不需要真实 DOM 节点的装饰元素。本项目用它绘制 `❯` 提示符和模块标题。

```css
main.main-surface:not(.dream-home-shell)
```

`:not(...)` 排除某种状态。

```css
.dream-home:has(.dream-home-utility)
```

`:has(...)` 根据后代是否存在来选择父元素。

### 小练习：只取消一条边框

如果只想取消 02 标题的右边框，可以在相关规则之后临时添加：

```css
:root.codex-dream-skin.dream-theme-dark
[data-dream-theme-id="preset-codex-tactical-crt"]
.dream-sidebar-projects > div > [class~="group/nav-section-title"] {
  border-right: none !important;
}
```

不要写成 `border: none`，否则上下左右四条边都会被清除。

## 5. 层叠、优先级与 `!important`

“Cascading” 的意思是：同一个元素可能同时命中很多规则，浏览器需要决定最后采用哪一个值。

主要判断顺序可以简化为：

1. 是否带 `!important`。
2. 选择器优先级。
3. 如果优先级相同，后出现的规则覆盖先出现的规则。

粗略理解选择器优先级：

```text
内联 style
  > #id
  > .class / [attribute] / :pseudo-class
  > tag / ::pseudo-element
```

项目大量使用长选择器和 `!important`，原因是它在覆盖 Codex 自带样式及 Tailwind 工具类，而不是普通的独立网页。

例如：

```css
border-top: none !important;
```

如果去掉 `!important` 后没有变化，通常不是浏览器“没刷新”，而是 Codex 原生规则的优先级更高。

### 调试优先级

在 DevTools 的 `Styles` 面板中：

- 被划掉的声明代表它输给了另一条规则。
- 点开属性可以看到赢家来自哪个文件。
- `Computed` 面板显示最终计算结果。

不要通过无限追加 `!important` 解决所有问题。先确认：

- 选择器是否真的命中目标元素。
- 是否有更具体的规则覆盖它。
- 是否只是属性写在错误的父元素上。

### 小练习：预测赢家

```css
.panel {
  border-right: 1px solid gold;
}

.theme .panel {
  border-right: none;
}
```

第二条更具体，因此右边框消失。如果第一条带有 `!important`，第二条也通常需要 `!important` 才能覆盖。

## 6. CSS 自定义变量：最值得先掌握的部分

Tactical CSS 顶部集中定义了变量：

```css
--dream-token-layout-panel-gap: 8px;
--dream-token-layout-section-gap: 8px;
--dream-token-layout-scrollbar: 8px;
--dream-token-layout-scrollbar-inset: 4px;
```

使用时通过 `var()` 读取：

```css
gap: var(--dream-token-layout-panel-gap);
```

还可以提供回退值：

```css
top: var(--dream-token-runtime-sidebar-scrollbar-top, 448px);
```

如果第一个变量不存在，就使用 `448px`。

### `calc()` 做变量运算

```css
padding-right:
  calc(
    var(--dream-token-layout-scrollbar)
    + (var(--dream-token-layout-scrollbar-inset) * 2)
  );
```

这表示内容右侧留白等于：

```text
滚动条宽度 + 左右两份内距
```

### 三类变量不要混淆

#### 1. `theme.json` 可以覆盖的设计令牌

当前包括：

- `colors`
- `strokes`
- `radii`
- `effects`

它们由注入器校验，适合安全修改。

#### 2. CSS 中定义的布局变量

例如：

```css
--dream-token-layout-panel-gap
--dream-token-layout-project-title-height
--dream-token-layout-composer-min-height
```

这些目前直接写在 Tactical CSS 中，不是 `theme.json` 的可配置字段。

#### 3. JavaScript 运行时变量

名称通常包含 `runtime`：

```css
--dream-token-runtime-sidebar-scrollbar-top
--dream-token-runtime-sidebar-scrollbar-height
```

它们由 `renderer-inject.js` 根据真实 DOM 尺寸写入。不要在 CSS 顶部把它们固定死，否则窗口缩放后几何关系会失效。

### 小练习：调整 Composer 的最低高度

把：

```css
--dream-token-layout-composer-min-height: 150px;
```

临时改成：

```css
--dream-token-layout-composer-min-height: 180px;
```

观察 03 下半区变高，同时留意上方对话区是否仍有足够空间。

## 7. 盒模型：为什么框线总会错一两个像素

一个元素从里到外通常是：

```text
content → padding → border → margin
```

- `content`：内容区域。
- `padding`：内容到边框的内距。
- `border`：框线。
- `margin`：元素与外部元素的距离。

默认情况下，`width: 100%` 只计算内容宽度，额外的 padding 和 border 可能把元素撑出父容器。

本项目经常使用：

```css
box-sizing: border-box;
```

这样声明的 `width` 和 `height` 已经包含 padding 与 border，更适合精确的仪表盘布局。

### 外框、内框与阴影

普通外框：

```css
border: var(--dream-token-stroke-strong)
  solid var(--dream-token-color-line-strong);
```

内框：

```css
box-shadow:
  inset 0 0 0 var(--dream-token-stroke-default)
  var(--dream-token-color-line-default);
```

只取消下边框：

```css
border-bottom: none !important;
```

只设置上下边框：

```css
border-block:
  var(--dream-token-stroke-default)
  solid var(--dream-token-color-line-default);
```

逻辑方向属性：

- `border-block`：通常对应上、下。
- `border-inline`：通常对应左、右。
- `padding-inline`：通常对应左、右内距。
- `padding-block`：通常对应上、下内距。

### 小练习：外框改内框

找到某个模块的：

```css
border: var(--dream-token-stroke-strong)
  solid var(--dream-token-color-line-strong);
```

临时替换为：

```css
border: none;
box-shadow:
  inset 0 0 0 var(--dream-token-stroke-strong)
  var(--dream-token-color-line-strong);
```

观察元素实际尺寸是否发生变化。内框阴影不占用盒模型空间，普通 border 会占用。

## 8. Flex：Header 为什么能自动填满

Header 的填充区域使用 Flex：

```css
height: var(--dream-token-layout-header-control-height);
flex: 1 1 auto;
display: flex;
align-items: center;
justify-content: center;
```

关键属性：

- `display: flex`：该元素成为 Flex 容器。
- `align-items: center`：交叉轴居中，默认横排时就是垂直居中。
- `justify-content: center`：主轴居中，默认横排时就是水平居中。
- `flex: 1 1 auto`：允许增长、允许收缩，并根据自身尺寸计算基础宽度。

Header 填充框四周留白来自：

```css
margin:
  var(--dream-token-layout-header-inset)
  var(--dream-token-layout-header-inset)
  var(--dream-token-layout-header-inset)
  var(--dream-token-layout-panel-gap);
```

四值顺序是：

```text
上 右 下 左
```

常用缩写规律：

```css
margin: 8px;             /* 四边 */
margin: 8px 12px;        /* 上下 左右 */
margin: 8px 12px 4px;    /* 上 左右 下 */
margin: 8px 12px 4px 6px;/* 上 右 下 左 */
```

### 小练习：扩大 Header 左侧间隙

只把最后一个 margin 值从 `panel-gap` 临时换成 `16px`。你应该只看到按钮组与填充框之间的距离增大，其他三边不变。

## 9. 定位：relative、absolute、sticky、fixed

这是理解当前主题最关键的一节。

### `position: relative`

元素仍在正常文档流中，同时成为绝对定位子元素的参考坐标系。

```css
.dream-sidebar-navigation-head {
  position: relative;
}
```

它的 `::before` 标题因此可以相对模块框定位。

### `position: absolute`

元素脱离普通文档流，相对最近的定位祖先放置。

```css
position: absolute;
inset: 0 0 auto 0;
```

`inset` 是 `top/right/bottom/left` 的缩写。这里表示：

```text
top: 0;
right: 0;
bottom: auto;
left: 0;
```

### `position: sticky`

元素先参与正常布局，滚动到指定阈值后吸附。

02 标题使用：

```css
position: sticky;
top: calc(
  var(--dream-token-runtime-sidebar-navigation-body-height, 176px)
  + var(--dream-token-layout-panel-gap)
);
```

它不是简单的 `top: 0`，因为上方还需要保留固定的 01。

03 下半区也使用 sticky，使 Composer 始终停留在任务区底部，同时保持在原生滚动结构中。

### `position: fixed`

元素相对浏览器视口固定，不随普通内容滚动。

自定义 02 滚动条和 Footer 框使用 fixed，因为它们的几何位置由运行时计算。

### `z-index`

`z-index` 控制重叠时谁在上面。它通常只对定位元素或特定布局项生效。

如果某个项目行穿过标题栏，除了检查 `overflow`，还要检查：

- 标题是否有背景。
- 标题的 `z-index` 是否更高。
- 中间间隙是否被透明内容穿透。

### 小练习：观察 sticky

临时把 02 标题的：

```css
position: sticky;
```

改成：

```css
position: static;
```

滚动项目列表，观察标题不再固定。完成后立即撤销。

## 10. 03 为什么看起来像一个模块被上下分割

03 的外框由 `main.main-surface` 提供。Composer 没有再创建一圈独立的强外框，而是在同一个主框内部形成下半区。

下半区核心规则：

```css
.dream-main-composer-section {
  position: sticky;
  bottom: 0;
  min-height: var(--dream-token-layout-composer-min-height);
  max-height: 40%;
  margin-top: var(--dream-token-layout-section-gap);
}
```

结构缝由伪元素绘制：

```css
.dream-main-composer-section::before {
  height: var(--dream-token-layout-section-gap);
  border-block: var(--dream-token-stroke-default)
    solid var(--dream-token-color-line-default);
}
```

标题栏由另一个伪元素绘制：

```css
.dream-main-composer-section::after {
  content: var(--dream-token-label-composer);
}
```

这解释了一个常见现象：你在 DOM 中可能找不到文字 `TASK_COMPOSER`，因为它来自 CSS `content`，不是真实文本节点。

### 小练习：改变分割带

把：

```css
--dream-token-layout-section-gap: 8px;
```

改成 `14px`。观察 03 的结构缝变宽，而 01/02 的距离不变。

## 11. 滚动：视觉与交互是两件事

### 原生滚动容器

左栏的真实滚动容器仍然是 Codex 自带的：

```css
nav > .vertical-scroll-fade-mask {
  overflow-y: auto;
}
```

`overflow-y: auto` 表示只有内容超出时才允许纵向滚动。

为了不让原生滚动条出现在 01 旁边，主题隐藏了原生滚动条视觉：

```css
scrollbar-width: none !important;
```

WebKit/Chromium 还需要：

```css
::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
}
```

注意：滚动能力没有消失，只是原生滚动条不可见。

### 自定义 02 滚动条

CSS 负责外观：

```css
#codex-dream-skin-project-scrollbar {
  position: fixed;
  width: var(--dream-token-layout-scrollbar);
  pointer-events: auto;
  touch-action: none;
}
```

JavaScript 负责：

- 计算轨道的 left、top、height。
- 根据 `scrollTop` 计算滑块偏移。
- 处理拖动。
- 处理轨道点击翻页。
- 处理滚轮。
- 阻止 01 上的滚轮带动 02。

核心逻辑位于 `syncTacticalScrollbar()`。

### `scrollTop`、`scrollHeight`、`clientHeight`

```text
scrollTop
  当前已经向下滚动了多少像素

scrollHeight
  全部可滚动内容的高度

clientHeight
  当前可见区域的高度

maximumScroll
  scrollHeight - clientHeight
```

滑块位置的核心比例是：

```js
thumbOffset =
  thumbTravel * (scrollTop / maximumScroll);
```

### 哪些滚动调整只需要 CSS

- 滚动条宽度。
- 滚动条距边框的内距。
- 轨道颜色。
- 滑块颜色、框线、圆角。

### 哪些调整需要 JavaScript

- 最小滑块高度。
- 点击轨道一次滚动多少。
- 拖动映射公式。
- 哪个区域拦截滚轮。
- 轨道从哪个 DOM 几何位置开始。

例如当前轨道点击翻页比例：

```js
direction * Number(scroll.clientHeight) * .85
```

`.85` 就是当前可见高度的 85%。

### 小练习：只改滚动条视觉

先不要动 JavaScript。把：

```css
--dream-token-layout-scrollbar: 8px;
--dream-token-layout-scrollbar-inset: 4px;
```

分别改成 `10px` 和 `6px`，重新注入并观察轨道是否仍在 02 框线内部。

## 12. DOM 与 JavaScript：只学本项目需要的部分

Codex 原生类名中有不少构建生成的片段，版本更新后可能变化。直接让 CSS 依赖这些类名会很脆弱。

本项目的策略是：

1. 用相对稳定的结构或属性找到原生节点。
2. 给它添加项目自己拥有的语义类。
3. CSS 只依赖这些语义类。
4. 主题清理时移除这些类。

### `querySelector`

```js
const threadScroll =
  document.querySelector(".thread-scroll-container");
```

返回第一个匹配元素，没有匹配时返回 `null`。

### 可选链 `?.`

```js
threadScroll?.querySelector?.(
  '[data-thread-scroll-footer="true"]'
);
```

如果 `threadScroll` 不存在，就返回 `undefined`，避免直接报错。

### 添加语义类

```js
node.classList.add("dream-main-composer-section");
```

CSS 随后可以稳定选择：

```css
.dream-main-composer-section
```

### `syncOwnedClass`

项目没有只顾着添加类，还会移除已经失效的旧类：

```js
const syncOwnedClass = (className, nodes) => {
  const wanted = new Set(nodes.filter(Boolean));

  for (const node of document.querySelectorAll(`.${className}`)) {
    if (!wanted.has(node)) node.classList.remove(className);
  }

  for (const node of wanted) node.classList.add(className);
};
```

这使重复注入、侧栏折叠和 Codex 重建 DOM 时仍能保持一致。

### 不要随便搬动 React 节点

`appendChild()` 可以移动 DOM，但 Codex 是 React 应用。把 React 管理的输入框或按钮移到新父节点，可能导致：

- 状态与视觉不同步。
- 快捷键失效。
- 组件更新时节点被重建。
- 焦点、滚动定位或事件代理出错。

因此本主题主要添加类和装饰节点，不重排关键原生控件。

### 小练习：追踪一个类

搜索：

```text
dream-composer-input-line
```

你会看到：

1. `renderer-inject.js` 把它添加到真实输入区域。
2. Tactical CSS 用它绘制终端提示符和输入框线。
3. 测试验证它能被添加并在清理时移除。

## 13. 常见修改配方

### 调整 01 与 02 的距离

```css
--dream-token-layout-panel-gap: 8px;
```

建议一次只增减 `2px`。

### 调整 Header 填充框的四周留白

```css
--dream-token-layout-header-inset: 6px;
```

Header 总高仍由下面变量控制：

```css
--dream-token-layout-app-bar-height: 64px;
```

### 调整 02 标题高度

```css
--dream-token-layout-project-title-height: 42px;
```

如果只改标题高度却不检查滚动条起点，可能造成轨道压到标题线。当前 JavaScript 会读取这个变量并重新计算轨道 top。

### 取消某个模块的一条边框

```css
border-right: none !important;
```

将这条声明放到目标模块已有规则中，或在文件后面追加一个同等/更高优先级的覆盖规则。

### 调整 03 上下区间距

```css
--dream-token-layout-section-gap: 8px;
```

### 调整 Composer 高度

```css
--dream-token-layout-composer-min-height: 150px;
--dream-token-layout-conversation-min-height: 220px;
```

下半区还有：

```css
max-height: 40%;
```

三者需要一起考虑：

- Composer 最低高度太大，会挤压对话。
- 对话最低高度太大，小窗口可能空间不足。
- Composer 最大比例太小，多行输入会更早出现内部滚动。

### 修改终端提示符

```css
.dream-composer-input-line::before {
  content: "❯";
}
```

可以换成 `">"`、`"$"` 或其他短字符，但不要使用过长的路径提示符，除非同步增加输入区左内距。

## 14. 如何使用 DevTools 定位样式

Codex 通过 `9335` 暴露调试端口时，可以在 Chromium 浏览器中打开：

```text
chrome://inspect
```

在 `Configure...` 中加入：

```text
localhost:9335
```

然后找到 Codex 页面并点击 `inspect`。

推荐调试顺序：

1. 使用元素选择工具点中目标。
2. 在 `Styles` 中确认命中了哪些 Tactical 规则。
3. 在 `Computed` 中检查最终宽高、margin、padding、border、position 和 overflow。
4. 在盒模型图中观察是否多出几像素。
5. 先在 DevTools 临时改值。
6. 确认有效后再写回源码。

### 遇到“改了没反应”

按这个顺序检查：

1. 是否修改了正确文件。
2. 是否重新注入。
3. 当前主题 ID 是否为 `preset-codex-tactical-crt`。
4. 选择器是否命中。
5. 声明是否在 DevTools 中被划掉。
6. 是否有更高优先级的 `!important`。
7. 目标尺寸是否其实由 JavaScript 运行时变量控制。

### 遇到“框线错位”

检查：

- 元素是否使用 `box-sizing: border-box`。
- `width: 100%` 是否又叠加了 padding。
- 自定义滚动条是否忘记计算边框宽度。
- fixed 元素使用的是视口坐标还是父元素坐标。
- 标题高度改变后，运行时轨道 top 是否同步读取该变量。

### 遇到“出现两个滚动条”

检查：

- 哪个元素真正设置了 `overflow-y: auto`。
- 全局 `::-webkit-scrollbar` 是否让隐藏滚动容器重新可见。
- 自定义滚动条是否只负责视觉，而原生容器仍负责滚动。
- 是否把 `overflow` 错加到了父子两个元素上。

## 15. CSS 语法速查

| 语法 | 含义 |
| --- | --- |
| `.panel` | 类选择器 |
| `#scrollbar` | ID 选择器 |
| `[data-x="y"]` | 属性完全匹配 |
| `[class~="word"]` | 类名单词匹配 |
| `[class*="text"]` | 属性包含文本 |
| `.a .b` | `.a` 内任意层级的 `.b` |
| `.a > .b` | `.a` 的直接子元素 `.b` |
| `.a, .b` | 同时选择两组元素 |
| `:hover` | 悬停伪类 |
| `:focus-visible` | 可见键盘焦点 |
| `:not(...)` | 排除匹配 |
| `:has(...)` | 根据后代选择父元素 |
| `::before` / `::after` | 装饰性伪元素 |
| `var(--x)` | 读取 CSS 变量 |
| `var(--x, 8px)` | 带回退值 |
| `calc(...)` | 运行 CSS 尺寸计算 |
| `box-sizing: border-box` | 宽高包含 padding 和 border |
| `display: flex` | Flex 布局 |
| `gap` | Flex/Grid 项目间距 |
| `position: relative` | 保留文档流并建立定位参考 |
| `position: absolute` | 脱离文档流，相对定位祖先 |
| `position: sticky` | 到阈值后吸附 |
| `position: fixed` | 相对视口固定 |
| `overflow-y: auto` | 内容超出时纵向滚动 |
| `pointer-events: none` | 不接收鼠标命中 |
| `!important` | 提高层叠优先权 |

## 16. Tactical 模块速查

| 可见区域 | 主要选择器/类 | 关键变量 |
| --- | --- | --- |
| 顶部应用栏 | `[class~="group/application-menu-top-bar"]` | `app-bar-height`、`header-control-height`、`header-inset` |
| 01 标题 | `.dream-sidebar-navigation-head::before` | `title-height` |
| 01 内容 | `.dream-sidebar-navigation-body` | `panel-gap` |
| 02 项目区 | `.dream-sidebar-projects` | `project-title-height` |
| 02 任务区 | `.dream-sidebar-tasks` | `scrollbar`、`scrollbar-inset` |
| 02 自定义滚动条 | `#codex-dream-skin-project-scrollbar` | `scrollbar`、运行时几何变量 |
| 03 外框 | `main.main-surface` | `active-shell-gap` |
| 03 对话滚动区 | `.dream-main-thread-scroll` | `conversation-min-height` |
| Composer 分区 | `.dream-main-composer-section` | `composer-min-height`、`section-gap` |
| Composer 输入行 | `.dream-composer-input-line` | 提示符、padding、内部框线 |
| Composer 状态栏 | `.dream-composer-status-bar` | 高度、边框、颜色 |
| Footer | `.dream-sidebar-native-footer` | `footer-height` |
| 全屏 CRT 装饰 | `#codex-dream-skin-chrome` | vignette、scanline、grid 效果 |

变量完整名称都以：

```text
--dream-token-
```

开头。表格中为了便于阅读省略了这个前缀。

## 17. 推荐的独立微调方法

每次只处理一个视觉问题：

1. 用一句话描述问题，例如“02 滚动条压住右边框”。
2. 在 DevTools 确认相关元素和最终几何。
3. 判断属于颜色、盒模型、布局、定位还是交互。
4. 优先修改现有变量。
5. 没有合适变量时，再修改最小范围的选择器。
6. 重新注入并测试正常窗口和窄窗口。
7. 检查滚动、点击、输入、折叠侧栏和页面溢出。
8. 用 `git diff` 确认没有带入无关改动。

最值得记住的三条：

- 视觉问题优先 CSS，交互问题才考虑 JavaScript。
- 先看最终计算样式，不要凭选择器长度猜优先级。
- 自定义滚动条的“外观”和“滚动行为”属于两个不同层次。

