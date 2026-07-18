import type { LoadedDocument, TreeNode } from '../types'

export const DEMO_TREE: TreeNode[] = [
  { kind: 'file', name: 'AGENT.md', path: 'AGENT.md' },
  { kind: 'file', name: 'WIKI-LINT.md', path: 'WIKI-LINT.md' },
  {
    kind: 'directory',
    name: 'wiki',
    path: 'wiki',
    children: [
      { kind: 'file', name: 'MEMORY.md', path: 'wiki/MEMORY.md' },
      { kind: 'directory', name: 'log', path: 'wiki/log', children: [{ kind: 'file', name: '202607.md', path: 'wiki/log/202607.md' }] },
      { kind: 'directory', name: 'user', path: 'wiki/user', children: [{ kind: 'file', name: 'profile.md', path: 'wiki/user/profile.md' }] },
      { kind: 'directory', name: 'projects', path: 'wiki/projects', children: [{ kind: 'file', name: 'brain-hub.md', path: 'wiki/projects/brain-hub.md' }] },
      { kind: 'directory', name: 'experiences', path: 'wiki/experiences', children: [{ kind: 'file', name: 'frontend-dev.md', path: 'wiki/experiences/frontend-dev.md' }] },
      { kind: 'directory', name: 'topics', path: 'wiki/topics', children: [{ kind: 'file', name: 'git-github.md', path: 'wiki/topics/git-github.md' }] },
    ],
  },
  { kind: 'directory', name: 'favorites', path: 'favorites', children: [{ kind: 'file', name: 'README.md', path: 'favorites/README.md' }] },
  { kind: 'directory', name: 'tools', path: 'tools', children: [{ kind: 'file', name: 'README.md', path: 'tools/README.md' }] },
]

const markdown = `---
title: Brain-Hub 知识操作系统
type: project
status: 活跃
tags: [Markdown, Agent, 本地工具]
updated: 2026-07-18
---

# Brain-Hub 知识操作系统

> Brain-Hub 是 User 和 Agent 的共享知识地基。你（Agent）是这个 wiki 的主要维护者。用户负责策展、提问、引导方向。你负责所有记账工作——总结、交叉引用、归档、维护。

## 启动流程

每次新对话开始时，必须按顺序读取：

1. **本文件 [AGENT.md](./AGENT.md)** — 了解操作规范（可缓存，不用每次精读）
2. **[wiki/MEMORY.md](./wiki/MEMORY.md)** — 获取记忆索引，了解当前知识全貌

按需读取具体 wiki 页面获取详细上下文。不要全量加载所有页面。

**触发式流程：** 当用户说“审查 wiki / 整理 wiki / 跑一下 lint”时，读取并按 [WIKI-LINT.md](./WIKI-LINT.md) 执行全量审查。

## 目录结构

\`\`\`text
brain-hub/
├── AGENT.md              ← 操作规范
├── WIKI-LINT.md          ← 全量审查流程
├── wiki/
│   ├── MEMORY.md         ← 记忆索引
│   ├── log/              ← 操作日志
│   ├── user/             ← 用户画像
│   ├── projects/         ← 项目知识
│   └── topics/           ← 主题知识
└── brain_hub.db          ← 收藏元数据
\`\`\`

## 完全本地

Chrome Markdown 只读取你明确授权的文件夹，不创建账号、不连接远程 API，也不会修改文件。
`

export function getDemoDocument(path = 'AGENT.md'): LoadedDocument {
  return {
    path,
    name: path.split('/').at(-1) ?? 'AGENT.md',
    markdown: path === 'AGENT.md' ? markdown : `# ${path.split('/').at(-1)}\n\n这是 Chrome Markdown 的本地演示文档。\n\n[返回 AGENT.md](/AGENT.md)`,
    lastModified: Date.now(),
  }
}
