# Local MD Reader

一个 clean-room、完全本地、只读的 Chrome Markdown 文件夹阅读器。它不依赖账号、订阅或后端服务，也不包含从其他扩展复制的代码或资产。

## 功能

- 直接打开任意本地 Markdown 时，自动读取该文件所在文件夹并显示目录树，无需再选择文件夹
- 打开当前文件时立即显示父目录的 Markdown 与文件夹，子目录在展开时按层加载
- Markdown 目录树、文件名搜索、文档大纲
- GFM、代码高亮、KaTeX、Mermaid
- YAML Frontmatter 属性卡片（数组值自动显示为标签，且不污染文档大纲）
- 相对 Markdown 链接和本地图片
- Chrome 直接打开本地 `.md/.markdown/.mdx` 文件时自动进入单文件阅读模式
- 地址栏始终保留真实的 `file:///.../README.md`，书签、刷新和相对链接行为与普通本地文件一致
- 从侧栏切换 Markdown 时在当前页面读取并替换正文，不触发整页跳转或闪烁
- 默认显示文件目录；需要时可随时切换到文档大纲
- 文件变化自动刷新、浅色/深色双选按钮、字号和侧栏宽度设置
- 中文 / English 界面切换
- DOMPurify 清洗 HTML；所有功能离线运行
- 只申请 Chrome `storage` 权限；文件网址访问仅用于用户在 Chrome 中主动打开的本地 Markdown

## 安装

1. 执行 `npm install && npm run build`。
2. 打开 `chrome://extensions`，开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择本项目的 `dist/` 文件夹。
4. 在扩展详情中开启“允许访问文件网址”，以便直接打开本地 Markdown。
5. 用 Chrome 打开任意本地 `.md` 文件；Local MD Reader 会自动接管渲染。

直接打开本地 Markdown 不使用系统目录选择器。扩展以当前文件的父目录为根，立即读取并显示这一层的 Markdown 与文件夹；展开某个文件夹时才读取下一层，因此大目录也能快速出现，不会先卡在临时单文件视图，也不会弹出逐项目授权窗口。

左侧默认显示当前文件所在文件夹；点击“大纲”可以查看文档标题结构。工具栏打开的独立阅读页仍保留“打开文件夹”，用于主动浏览其他目录；只有这个显式操作才会调用 Chrome 的文件夹选择器。

## 开发与验收

```bash
npm run dev          # 打开 http://127.0.0.1:5173/reader.html?demo=1
npm run lint
npm test
npm run build
npm run package      # 生成 local-md-reader-0.3.3.zip
```

## 隐私与安全边界

- 只读取用户在 Chrome 中主动打开的 Markdown 所在父目录及其子目录；或用户在独立阅读页中明确选择的目录。
- 直接打开单个本地 Markdown 时，Content Script 在当前 `file://` 页面挂载普通 React 根节点；不跳转内部扩展页，也不经过 `storage.session` 中转。
- 不写入文件，不上传内容，不加载远程脚本，不发送遥测。
- 扩展不包含远程 API；CSP 只允许扩展自身及本地 `file:` 读取。外部链接只有在用户主动点击后才交给新标签页。
- `.git`、`node_modules`、`dist`、`build` 默认永远忽略；其他隐藏目录默认隐藏，可在设置中显示。
- Markdown 内嵌 HTML 会先经过 DOMPurify，且明确移除 `<style>` 与 `<link>`，避免正文样式影响阅读器界面；Mermaid 使用 `securityLevel: strict`。

## Clean-room 说明

本项目是 clean-room 独立实现：参考本地 Markdown 阅读器可观察到的产品行为及浏览器扩展运行机制，但没有修改第三方扩展的订阅校验、调用其后端或复制其代码与资产。
