# Chrome Markdown

[English](README.md) | [简体中文](README.zh-CN.md)

一款快速、完全本地、只读的 Chrome Markdown 阅读器。直接在浏览器中打开 Markdown 文件，即可通过清晰的文件树浏览同一目录中的其他文档。

![Chrome Markdown](design/browser-final.png)

## 功能

- 直接在 Chrome 中打开本地 `.md`、`.markdown` 和 `.mdx` 文件
- 自动显示当前文件父目录中的 Markdown 文件和文件夹
- 子目录按需加载，大型仓库也能快速启动
- 支持文件搜索和文档大纲
- 支持 GFM、代码高亮、KaTeX、Mermaid 和 YAML Frontmatter
- 正确解析相对 Markdown 链接和本地图片
- 页内无缝切换文件，不触发整页闪烁
- 点击大纲和同页标题链接时保持浏览器文件地址不变
- 从内部路径栏复制当前文档的完整 `file://` 地址
- 文件变化自动刷新
- 浅色/深色主题，可调整正文字号和侧栏宽度
- 中文和英文界面

## 安装

### 使用发行包

1. 从[最新 Release](https://github.com/haoyubai212/chrome-markdown/releases/latest)下载并解压 ZIP。
2. 打开 `chrome://extensions`，开启**开发者模式**。
3. 点击**加载已解压的扩展程序**，选择解压后的文件夹。
4. 打开扩展详情，开启**允许访问文件网址**。
5. 用 Chrome 打开任意本地 Markdown 文件。

### 从源码构建

```bash
npm install
npm run build
```

然后在 `chrome://extensions` 中加载生成的 `dist/` 文件夹。

## 文件夹浏览方式

当 Chrome 打开本地 Markdown 文件时，Chrome Markdown 会以该文件的父目录作为文件树根目录。第一层内容会立即显示，子文件夹只有在展开时才会读取。直接打开文件不会弹出系统文件夹选择器。

从侧栏选择其他文件时，正文会在当前页面内更新。浏览器地址栏保留最初打开的文件地址，内部路径栏显示当前文档，并提供复制完整地址的按钮。

点击扩展工具栏图标可以打开独立阅读页，在那里可以主动选择其他文件夹。

## 隐私与权限

- 文件只在本地读取，不会上传。
- 扩展为只读，不会修改文件。
- 不包含遥测、远程脚本或远程 API 调用。
- Chrome `storage` 权限用于保存阅读设置；可选的文件夹句柄保存在浏览器 IndexedDB 中。
- 本地文件访问仅用于用户打开的 Markdown 及其下级目录。
- 始终忽略 `.git`、`node_modules`、`dist` 和 `build`；其他隐藏目录默认不显示。
- Markdown HTML 使用 DOMPurify 清洗，Mermaid 使用 `securityLevel: strict`。

## 开发

```bash
npm run dev       # http://127.0.0.1:5173/reader.html?demo=1
npm run lint
npm test
npm run build
npm run package   # chrome-markdown-1.0.1.zip
```

## 许可证

[MIT](LICENSE)
