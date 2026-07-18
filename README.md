# Local MD Reader

一个 clean-room、完全本地、只读的 Chrome Markdown 文件夹阅读器。它不依赖账号、订阅或后端服务，也不包含从其他扩展复制的代码或资产。

## 功能

- 一次授权文件夹，目录句柄保存在浏览器本地 IndexedDB
- Markdown 目录树、文件名搜索、文档大纲
- GFM、代码高亮、KaTeX、Mermaid
- 相对 Markdown 链接和本地图片
- 文件变化自动刷新、浅色/深色主题、字号和侧栏宽度设置
- DOMPurify 清洗 HTML；所有功能离线运行
- 只申请 Chrome `storage` 权限，不请求主机访问权限

## 安装

1. 执行 `npm install && npm run build`。
2. 打开 `chrome://extensions`，开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择本项目的 `dist/` 文件夹。
4. 点击工具栏中的 Local MD Reader，然后点击“打开文件夹”。

Chrome 会在浏览器重启后重新确认目录权限，这是 File System Access API 的安全机制。Local MD Reader 会记住目录句柄，但只有你点击恢复授权后才能再次读取。

## 开发与验收

```bash
npm run dev          # 打开 http://127.0.0.1:5173/reader.html?demo=1
npm run lint
npm test
npm run build
npm run package      # 生成 local-md-reader-0.1.0.zip
```

## 隐私与安全边界

- 只读取用户在系统文件夹选择器中明确授权的目录。
- 不写入文件，不上传内容，不加载远程脚本，不发送遥测。
- 扩展 CSP 禁止网络连接和远程图片；外部链接只有在用户主动点击后才交给新标签页。
- `.git`、`node_modules`、`dist`、`build` 默认永远忽略；其他隐藏目录默认隐藏，可在设置中显示。
- Markdown 内嵌 HTML 会先经过 DOMPurify；Mermaid 使用 `securityLevel: strict`。

## Clean-room 说明

本项目根据文件夹 Markdown 阅读器的一般可观察行为独立实现。没有修改第三方扩展的订阅校验，没有调用其后端，也没有复制或反编译其压缩代码。
