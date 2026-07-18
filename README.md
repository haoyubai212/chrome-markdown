# Local MD Reader

一个 clean-room、完全本地、只读的 Chrome Markdown 文件夹阅读器。它不依赖账号、订阅或后端服务，也不包含从其他扩展复制的代码或资产。

## 功能

- 多项目目录授权记忆：最多保存 20 个目录句柄，并在打开单文件时自动匹配
- Markdown 目录树、文件名搜索、文档大纲
- GFM、代码高亮、KaTeX、Mermaid
- YAML Frontmatter 属性卡片（数组值自动显示为标签，且不污染文档大纲）
- 相对 Markdown 链接和本地图片
- Chrome 直接打开本地 `.md/.markdown/.mdx` 文件时自动进入单文件阅读模式
- 单文件模式默认显示文档大纲；切换“文件”不会自动弹窗，只有点击授权按钮才会请求目录访问
- 文件变化自动刷新、浅色/深色双选按钮、字号和侧栏宽度设置
- 中文 / English 界面切换
- DOMPurify 清洗 HTML；所有功能离线运行
- 只申请 Chrome `storage` 权限；文件网址访问仅用于用户在 Chrome 中主动打开的本地 Markdown

## 安装

1. 执行 `npm install && npm run build`。
2. 打开 `chrome://extensions`，开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择本项目的 `dist/` 文件夹。
4. 在扩展详情中开启“允许访问文件网址”，以便直接打开本地 Markdown。
5. 点击工具栏中的 Local MD Reader，然后点击“打开文件夹”。

Local MD Reader 会把最近授权的项目目录保存在浏览器本地 IndexedDB，并将旧版保存的单一目录自动迁移。权限仍有效时，打开该项目内任意 Markdown 会直接恢复完整文件树；需要恢复时点击提示，并在 Chrome 权限框中选择“每次访问都允许”，即可避免后续重复确认。

首次从 Chrome 直接打开一个新项目中的 Markdown 时，左侧默认显示大纲。切换到“文件”只展示侧栏，不会立即弹出系统窗口；点击“加载所在文件夹”并选择当前项目目录一次后，以后打开同一项目的文件会自动匹配。不同项目的授权互不覆盖。

## 开发与验收

```bash
npm run dev          # 打开 http://127.0.0.1:5173/reader.html?demo=1
npm run lint
npm test
npm run build
npm run package      # 生成 local-md-reader-0.1.6.zip
```

## 隐私与安全边界

- 只读取用户在系统文件夹选择器中明确授权的目录。
- 直接打开单个本地 Markdown 时，原文只在当前浏览器会话中临时转交给阅读页；关闭标签页后即清除。
- 不写入文件，不上传内容，不加载远程脚本，不发送遥测。
- 扩展 CSP 禁止网络连接和远程图片；外部链接只有在用户主动点击后才交给新标签页。
- `.git`、`node_modules`、`dist`、`build` 默认永远忽略；其他隐藏目录默认隐藏，可在设置中显示。
- Markdown 内嵌 HTML 会先经过 DOMPurify；Mermaid 使用 `securityLevel: strict`。

## Clean-room 说明

本项目根据文件夹 Markdown 阅读器的一般可观察行为独立实现。没有修改第三方扩展的订阅校验，没有调用其后端，也没有复制或反编译其压缩代码。
