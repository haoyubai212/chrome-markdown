import type { Language } from '../types'

const messages = {
  zh: {
    files: '文件', outline: '大纲', sidebarMode: '侧栏模式', documentOutline: '文档大纲', markdownFiles: 'Markdown 文件', searchFiles: '搜索文件', clearSearch: '清空搜索',
    folderIntro: '选择一个文件夹，开始阅读其中的 Markdown 文档。', openFolder: '打开文件夹',
    noHeadings: '当前文档没有标题。', switchFolder: '切换文件夹', loadContainingFolder: '加载所在文件夹',
    switchTheme: '切换主题', refresh: '重新读取', readingSettings: '阅读设置', close: '关闭',
    theme: '主题', systemTheme: '跟随系统', lightTheme: '浅色', darkTheme: '深色',
    fontSize: '正文字号', autoRefresh: '自动刷新当前文件', showHidden: '显示隐藏目录',
    language: '语言', chinese: '中文', english: 'English',
    chooseFile: '选择左侧的 Markdown 文件开始阅读。', partialDiagram: '部分图表未能渲染：{error}', diagramFailed: '图表渲染失败',
    restoreFolder: '恢复“{name}”文件夹访问权限', fileNotFound: '找不到 {path}',
    authorizeFolder: '请先重新授权文件夹', readFileFailed: '文件读取失败', readFolderFailed: '目录读取失败',
    unsupportedBrowser: '当前浏览器不支持文件夹访问 API，请使用最新版 Chrome。', cannotOpenFolder: '无法打开文件夹',
    cannotRestoreFolder: '无法恢复上次的文件夹授权', cannotReadSingle: '无法读取这个 Markdown 文件',
    selectContainingFolder: '请选择包含“{name}”的文件夹或其上级目录。',
  },
  en: {
    files: 'Files', outline: 'Outline', sidebarMode: 'Sidebar mode', documentOutline: 'Document outline', markdownFiles: 'Markdown files', searchFiles: 'Search files', clearSearch: 'Clear search',
    folderIntro: 'Choose a folder to start reading its Markdown documents.', openFolder: 'Open folder',
    noHeadings: 'This document has no headings.', switchFolder: 'Change folder', loadContainingFolder: 'Load containing folder',
    switchTheme: 'Toggle theme', refresh: 'Refresh', readingSettings: 'Reading settings', close: 'Close',
    theme: 'Theme', systemTheme: 'System', lightTheme: 'Light', darkTheme: 'Dark',
    fontSize: 'Text size', autoRefresh: 'Auto-refresh current file', showHidden: 'Show hidden folders',
    language: 'Language', chinese: '中文', english: 'English',
    chooseFile: 'Select a Markdown file from the sidebar to start reading.', partialDiagram: 'Some diagrams could not be rendered: {error}', diagramFailed: 'Diagram rendering failed',
    restoreFolder: 'Restore access to “{name}”', fileNotFound: 'Could not find {path}',
    authorizeFolder: 'Please authorize the folder again', readFileFailed: 'Could not read the file', readFolderFailed: 'Could not read the folder',
    unsupportedBrowser: 'This browser does not support folder access. Please use the latest Chrome.', cannotOpenFolder: 'Could not open the folder',
    cannotRestoreFolder: 'Could not restore the previous folder permission', cannotReadSingle: 'Could not read this Markdown file',
    selectContainingFolder: 'Choose the folder containing “{name}” or one of its parent folders.',
  },
} as const

export type MessageKey = keyof typeof messages.zh

export function translate(language: Language, key: MessageKey, values: Record<string, string> = {}): string {
  let message: string = messages[language][key]
  for (const [name, value] of Object.entries(values)) message = message.replaceAll(`{${name}}`, value)
  return message
}
