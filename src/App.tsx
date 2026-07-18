import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, FolderOpen } from 'lucide-react'
import { Reader } from './components/Reader'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DEMO_TREE, getDemoDocument } from './lib/demo'
import { buildTree, ensureReadPermission, readDocument, resolveFileHandle } from './lib/filesystem'
import { renderMarkdown } from './lib/markdown'
import { findNode, flattenFiles, isMarkdownFile, normalizePath } from './lib/paths'
import { loadCapturedMarkdown, toLoadedDocument } from './lib/singleFile'
import { getRootHandle, loadLastPath, loadSettings, saveLastPath, saveRootHandle, saveSettings } from './lib/storage'
import type { Heading, LoadedDocument, Settings, TreeNode } from './types'

const searchParams = new URLSearchParams(location.search)
const isDemo = searchParams.has('demo')
const singleFileId = searchParams.get('single')

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle>()
  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle>()
  const [rootName, setRootName] = useState(isDemo ? 'brain-hub' : '')
  const [tree, setTree] = useState<TreeNode[]>(isDemo ? DEMO_TREE : [])
  const [currentDocument, setCurrentDocument] = useState<LoadedDocument | null>(isDemo ? getDemoDocument() : null)
  const [singleDocument, setSingleDocument] = useState<LoadedDocument>()
  const [html, setHtml] = useState('')
  const [headings, setHeadings] = useState<Heading[]>([])
  const [tab, setTab] = useState<'files' | 'outline'>('files')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const resizing = useRef(false)
  const previousShowHidden = useRef(settings.showHidden)

  const fileMap = useMemo(() => new Map(flattenFiles(tree).map((file) => [file.path, file])), [tree])

  const openPath = useCallback(async (requestedPath: string) => {
    const path = normalizePath(requestedPath)
    if (!path || !isMarkdownFile(path)) return
    setLoading(true)
    setError('')
    try {
      let next: LoadedDocument
      if (isDemo) {
        if (!findNode(DEMO_TREE, path) && path !== 'AGENT.md') throw new Error(`找不到 ${path}`)
        next = getDemoDocument(path)
      } else if (singleDocument && path === singleDocument.path) {
        next = singleDocument
      } else {
        if (!rootHandle) throw new Error('请先重新授权文件夹')
        const indexed = fileMap.get(path)?.handle
        const handle = indexed ?? await resolveFileHandle(rootHandle, path)
        if (!handle) throw new Error(`找不到 ${path}`)
        next = await readDocument(handle, path)
      }
      const rendered = await renderMarkdown(next.markdown)
      startTransition(() => {
        setCurrentDocument(next)
        setHtml(rendered.html)
        setHeadings(rendered.headings)
      })
      saveLastPath(path)
      requestAnimationFrame(() => globalThis.document.querySelector('.reader-scroll')?.scrollTo({ top: 0 }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '文件读取失败')
    } finally {
      setLoading(false)
    }
  }, [fileMap, rootHandle, singleDocument])

  const loadDirectory = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setLoading(true)
    setError('')
    try {
      const root = await buildTree(handle, settings.showHidden)
      setSingleDocument(undefined)
      setRootHandle(handle)
      setSavedHandle(undefined)
      setRootName(handle.name)
      setTree(root.children)
      const allFiles = flattenFiles(root.children)
      const lastPath = loadLastPath()
      const initial = allFiles.find((file) => file.path === lastPath)
        ?? allFiles.find((file) => /^agent\.md$/i.test(file.name))
        ?? allFiles.find((file) => /^readme\.md$/i.test(file.name))
        ?? allFiles[0]
      if (initial) {
        const next = await readDocument(initial.handle!, initial.path)
        const rendered = await renderMarkdown(next.markdown)
        setCurrentDocument(next)
        setHtml(rendered.html)
        setHeadings(rendered.headings)
        saveLastPath(initial.path)
      } else {
        setCurrentDocument(null)
        setHtml('')
        setHeadings([])
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '目录读取失败')
    } finally {
      setLoading(false)
    }
  }, [settings.showHidden])

  const chooseFolder = useCallback(async () => {
    try {
      if (savedHandle) {
        const permitted = await ensureReadPermission(savedHandle, true)
        if (permitted) {
          await loadDirectory(savedHandle)
          return
        }
      }
      const picker = window.showDirectoryPicker
      if (!picker) throw new Error('当前浏览器不支持文件夹访问 API，请使用最新版 Chrome。')
      const handle = await picker({ mode: 'read' })
      await saveRootHandle(handle)
      await loadDirectory(handle)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError(caught instanceof Error ? caught.message : '无法打开文件夹')
    }
  }, [loadDirectory, savedHandle])

  const refresh = useCallback(async () => {
    if (isDemo) {
      if (currentDocument) await openPath(currentDocument.path)
      return
    }
    if (singleDocument) {
      await openPath(singleDocument.path)
      return
    }
    if (!rootHandle) return chooseFolder()
    const currentPath = currentDocument?.path
    await loadDirectory(rootHandle)
    if (currentPath) await openPath(currentPath)
  }, [chooseFolder, currentDocument, loadDirectory, openPath, rootHandle, singleDocument])

  useEffect(() => {
    if (isDemo || !singleFileId) return
    let active = true
    loadCapturedMarkdown(singleFileId).then(async (captured) => {
      if (!active) return
      const next = toLoadedDocument(captured)
      const rendered = await renderMarkdown(next.markdown)
      if (!active) return
      setSingleDocument(next)
      setRootName(captured.parentName)
      setTree([{ kind: 'file', name: next.name, path: next.path }])
      setCurrentDocument(next)
      setHtml(rendered.html)
      setHeadings(rendered.headings)
    }).catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : '无法读取这个 Markdown 文件')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (isDemo || singleFileId) return
    let active = true
    getRootHandle().then(async (handle) => {
      if (!active || !handle) return
      if (await ensureReadPermission(handle, false)) await loadDirectory(handle)
      else {
        setSavedHandle(handle)
        setRootName(handle.name)
      }
    }).catch(() => setError('无法恢复上次的文件夹授权'))
    return () => { active = false }
  }, [loadDirectory])

  useEffect(() => {
    if (!currentDocument || html) return
    renderMarkdown(currentDocument.markdown).then((rendered) => {
      setHtml(rendered.html)
      setHeadings(rendered.headings)
    })
  }, [currentDocument, html])

  useEffect(() => {
    saveSettings(settings)
    globalThis.document.documentElement.dataset.theme = settings.theme
  }, [settings])

  useEffect(() => {
    if (previousShowHidden.current === settings.showHidden) return
    previousShowHidden.current = settings.showHidden
    if (rootHandle) void loadDirectory(rootHandle)
  }, [loadDirectory, rootHandle, settings.showHidden])

  useEffect(() => {
    if (!settings.autoRefresh || !currentDocument?.fileHandle || !rootHandle) return
    const timer = window.setInterval(async () => {
      try {
        const file = await currentDocument.fileHandle!.getFile()
        if (file.lastModified !== currentDocument.lastModified) await openPath(currentDocument.path)
      } catch { /* permission changes are surfaced on manual refresh */ }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [currentDocument, openPath, rootHandle, settings.autoRefresh])

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setTab('files')
        requestAnimationFrame(() => globalThis.document.getElementById('file-search')?.focus())
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!resizing.current) return
      setSettings((current) => ({ ...current, sidebarWidth: Math.max(260, Math.min(520, event.clientX)) }))
    }
    const up = () => { resizing.current = false; globalThis.document.body.classList.remove('is-resizing') }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])

  return (
    <div className="app-shell" data-theme={settings.theme} style={{ '--sidebar-width': `${settings.sidebarWidth}px` } as React.CSSProperties}>
      <Sidebar rootName={rootName} tree={tree} activePath={currentDocument?.path ?? ''} headings={headings} tab={tab} query={query} onTabChange={setTab} onQueryChange={setQuery} onOpen={openPath} onChooseFolder={chooseFolder} />
      <div className="resize-handle" onPointerDown={() => { resizing.current = true; globalThis.document.body.classList.add('is-resizing') }} />
      <section className="workspace">
        <TopBar rootName={rootName} path={currentDocument?.path ?? ''} theme={settings.theme} loading={loading} onThemeToggle={() => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))} onRefresh={refresh} onSettings={() => setShowSettings(true)} />
        {savedHandle && !rootHandle ? <button className="permission-banner" onClick={chooseFolder}><FolderOpen size={17} /> 恢复“{savedHandle.name}”文件夹访问权限</button> : null}
        {error ? <div className="error-banner"><AlertCircle size={17} /> <span>{error}</span><button onClick={() => setError('')}>关闭</button></div> : null}
        <Reader document={currentDocument} html={html} rootHandle={rootHandle} fontSize={settings.fontSize} onOpenPath={openPath} />
      </section>
      {showSettings ? <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
