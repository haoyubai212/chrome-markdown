import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, FolderOpen } from 'lucide-react'
import { Reader } from './components/Reader'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DEMO_TREE, getDemoDocument } from './lib/demo'
import { buildTree, ensureReadPermission, readDocument, resolveFileHandle } from './lib/filesystem'
import { translate, type MessageKey } from './lib/i18n'
import { renderMarkdown } from './lib/markdown'
import { findNode, flattenFiles, isMarkdownFile, normalizePath } from './lib/paths'
import { loadCapturedMarkdown, relativePathFromSource, toLoadedDocument, type CapturedMarkdownFile } from './lib/singleFile'
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
  const [singleSource, setSingleSource] = useState<CapturedMarkdownFile>()
  const [html, setHtml] = useState('')
  const [headings, setHeadings] = useState<Heading[]>([])
  const [tab, setTab] = useState<'files' | 'outline'>(singleFileId ? 'outline' : 'files')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const resizing = useRef(false)
  const previousShowHidden = useRef(settings.showHidden)
  const languageRef = useRef(settings.language)
  languageRef.current = settings.language
  const message = useCallback((key: MessageKey, values?: Record<string, string>) => translate(languageRef.current, key, values), [])

  const fileMap = useMemo(() => new Map(flattenFiles(tree).map((file) => [file.path, file])), [tree])

  const openPath = useCallback(async (requestedPath: string) => {
    const path = normalizePath(requestedPath)
    if (!path || !isMarkdownFile(path)) return
    setLoading(true)
    setError('')
    try {
      let next: LoadedDocument
      if (isDemo) {
        if (!findNode(DEMO_TREE, path) && path !== 'AGENT.md') throw new Error(message('fileNotFound', { path }))
        next = getDemoDocument(path)
      } else if (singleDocument && path === singleDocument.path) {
        next = singleDocument
      } else {
        if (!rootHandle) throw new Error(message('authorizeFolder'))
        const indexed = fileMap.get(path)?.handle
        const handle = indexed ?? await resolveFileHandle(rootHandle, path)
        if (!handle) throw new Error(message('fileNotFound', { path }))
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
      setError(caught instanceof Error ? caught.message : message('readFileFailed'))
    } finally {
      setLoading(false)
    }
  }, [fileMap, message, rootHandle, singleDocument])

  const loadDirectory = useCallback(async (handle: FileSystemDirectoryHandle, preferredPath?: string) => {
    setLoading(true)
    setError('')
    try {
      const root = await buildTree(handle, settings.showHidden)
      setSingleDocument(undefined)
      setSingleSource(undefined)
      setRootHandle(handle)
      setSavedHandle(undefined)
      setRootName(handle.name)
      setTree(root.children)
      const allFiles = flattenFiles(root.children)
      const lastPath = loadLastPath()
      const initial = allFiles.find((file) => file.path === preferredPath)
        ?? allFiles.find((file) => file.path === lastPath)
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
      setError(caught instanceof Error ? caught.message : message('readFolderFailed'))
    } finally {
      setLoading(false)
    }
  }, [message, settings.showHidden])

  const chooseFolder = useCallback(async () => {
    try {
      if (savedHandle) {
        const preferredPath = singleSource ? relativePathFromSource(singleSource.sourceUrl, savedHandle.name) : undefined
        if (!singleSource || preferredPath) {
          const permitted = await ensureReadPermission(savedHandle, true)
          if (permitted) {
            await loadDirectory(savedHandle, preferredPath ?? undefined)
            return
          }
        }
      }
      const picker = window.showDirectoryPicker
      if (!picker) throw new Error(message('unsupportedBrowser'))
      const handle = await picker({ mode: 'read', id: 'local-md-reader-folder' })
      const preferredPath = singleSource ? relativePathFromSource(singleSource.sourceUrl, handle.name) : undefined
      if (singleSource && !preferredPath) {
        setError(message('selectContainingFolder', { name: singleSource.name }))
        return
      }
      await saveRootHandle(handle)
      await loadDirectory(handle, preferredPath ?? undefined)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError(caught instanceof Error ? caught.message : message('cannotOpenFolder'))
    }
  }, [loadDirectory, message, savedHandle, singleSource])

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
      setSingleSource(captured)
      setSingleDocument(next)
      setRootName(captured.parentName)
      setTree([{ kind: 'file', name: next.name, path: next.path }])
      setCurrentDocument(next)
      setHtml(rendered.html)
      setHeadings(rendered.headings)
      try {
        const handle = await getRootHandle()
        const preferredPath = handle ? relativePathFromSource(captured.sourceUrl, handle.name) : null
        if (!active || !handle || !preferredPath) return
        if (!await ensureReadPermission(handle, false)) {
          setSavedHandle(handle)
          return
        }
        const matchingFile = await resolveFileHandle(handle, preferredPath)
        if (matchingFile) await loadDirectory(handle, preferredPath)
      } catch {
        // The captured file remains readable even if a previous directory handle is stale.
      }
    }).catch(() => {
      if (active) setError(message('cannotReadSingle'))
    })
    return () => { active = false }
  }, [loadDirectory, message])

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
    }).catch(() => setError(message('cannotRestoreFolder')))
    return () => { active = false }
  }, [loadDirectory, message])

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
    globalThis.document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en'
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

  const changeTab = useCallback((nextTab: 'files' | 'outline') => {
    setTab(nextTab)
    if (nextTab === 'files' && singleDocument && !rootHandle) void chooseFolder()
  }, [chooseFolder, rootHandle, singleDocument])

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
      <Sidebar rootName={rootName} tree={tree} activePath={currentDocument?.path ?? ''} headings={headings} tab={tab} query={query} language={settings.language} singleFileMode={Boolean(singleFileId && !rootHandle)} onTabChange={changeTab} onQueryChange={setQuery} onOpen={openPath} onChooseFolder={chooseFolder} />
      <div className="resize-handle" onPointerDown={() => { resizing.current = true; globalThis.document.body.classList.add('is-resizing') }} />
      <section className="workspace">
        <TopBar rootName={rootName} path={currentDocument?.path ?? ''} theme={settings.theme} language={settings.language} loading={loading} onThemeToggle={() => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))} onRefresh={refresh} onSettings={() => setShowSettings(true)} />
        {savedHandle && !rootHandle ? <button className="permission-banner" onClick={chooseFolder}><FolderOpen size={17} /> {message('restoreFolder', { name: savedHandle.name })}</button> : null}
        {error ? <div className="error-banner"><AlertCircle size={17} /> <span>{error}</span><button onClick={() => setError('')}>{message('close')}</button></div> : null}
        <Reader document={currentDocument} html={html} rootHandle={rootHandle} fontSize={settings.fontSize} language={settings.language} onOpenPath={openPath} />
      </section>
      {showSettings ? <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
