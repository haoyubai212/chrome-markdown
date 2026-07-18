import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, FolderOpen } from 'lucide-react'
import { Reader } from './components/Reader'
import { SettingsPanel } from './components/SettingsPanel'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DEMO_TREE, getDemoDocument } from './lib/demo'
import { buildTree, ensureReadPermission, readDocument, resolveFileHandle } from './lib/filesystem'
import { translate, type MessageKey } from './lib/i18n'
import { localUrlForPath, parentDirectoryUrl, readLocalDirectory, readLocalDirectoryTree, readLocalMarkdown, replaceDirectoryChildren } from './lib/localFiles'
import { renderMarkdown } from './lib/markdown'
import { findNode, flattenFiles, isMarkdownFile, normalizePath } from './lib/paths'
import { relativePathFromSource, toLoadedDocument, type CapturedMarkdownFile } from './lib/singleFile'
import { getRootHandles, loadLastPath, loadSettings, saveLastPath, saveRootHandle, saveSettings } from './lib/storage'
import type { Heading, LoadedDocument, Settings, TreeNode } from './types'

const searchParams = new URLSearchParams(location.search)
const isDemo = searchParams.has('demo')

type AppProps = {
  initialFile?: CapturedMarkdownFile
  initialSettings?: Settings
  navigateToLocalFile?: (url: string) => void
}

export default function App({ initialFile, initialSettings, navigateToLocalFile }: AppProps) {
  const [settings, setSettings] = useState<Settings>(() => initialSettings ?? loadSettings())
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle>()
  const [localRootUrl, setLocalRootUrl] = useState<string>()
  const [pendingDirectories, setPendingDirectories] = useState<Array<{ handle: FileSystemDirectoryHandle; relativePath?: string }>>([])
  const [rootName, setRootName] = useState(isDemo ? 'brain-hub' : '')
  const [tree, setTree] = useState<TreeNode[]>(isDemo ? DEMO_TREE : [])
  const [currentDocument, setCurrentDocument] = useState<LoadedDocument | null>(isDemo ? getDemoDocument() : null)
  const [singleDocument, setSingleDocument] = useState<LoadedDocument>()
  const [singleSource, setSingleSource] = useState<CapturedMarkdownFile>()
  const [html, setHtml] = useState('')
  const [headings, setHeadings] = useState<Heading[]>([])
  const [tab, setTab] = useState<'files' | 'outline'>('files')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const resizing = useRef(false)
  const previousShowHidden = useRef(settings.showHidden)
  const languageRef = useRef(settings.language)
  const showHiddenRef = useRef(settings.showHidden)
  languageRef.current = settings.language
  showHiddenRef.current = settings.showHidden
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
      } else if (localRootUrl && singleSource) {
        const indexed = fileMap.get(path)
        const sourceUrl = indexed?.url
          ?? (path === singleDocument?.path ? singleSource.sourceUrl : localUrlForPath(localRootUrl, path))
        if (!sourceUrl) throw new Error(message('fileNotFound', { path }))
        if (navigateToLocalFile && sourceUrl !== singleSource.sourceUrl) {
          navigateToLocalFile(sourceUrl)
          return
        }
        next = {
          path,
          name: indexed?.name ?? path.split('/').at(-1) ?? path,
          markdown: await readLocalMarkdown(singleSource.sourceUrl, sourceUrl),
          lastModified: Date.now(),
          sourceUrl,
        }
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
      requestAnimationFrame(() => document.querySelector('.reader-scroll')?.scrollTo({ top: 0 }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : message('readFileFailed'))
    } finally {
      setLoading(false)
    }
  }, [fileMap, localRootUrl, message, navigateToLocalFile, rootHandle, singleDocument, singleSource])

  const loadDirectory = useCallback(async (handle: FileSystemDirectoryHandle, preferredPath?: string) => {
    setLoading(true)
    setError('')
    try {
      const root = await buildTree(handle, settings.showHidden)
      setSingleDocument(undefined)
      setSingleSource(undefined)
      setRootHandle(handle)
      setLocalRootUrl(undefined)
      setPendingDirectories([])
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
  }, [loadDirectory, message, singleSource])

  const restoreSavedFolder = useCallback(async () => {
    setError('')
    try {
      for (const candidate of pendingDirectories) {
        const permitted = await ensureReadPermission(candidate.handle, true)
        if (!permitted) {
          setError(message('permissionNotGranted'))
          return
        }
        if (candidate.relativePath) {
          const matchingFile = await resolveFileHandle(candidate.handle, candidate.relativePath)
          if (!matchingFile) continue
        }
        await saveRootHandle(candidate.handle)
        await loadDirectory(candidate.handle, candidate.relativePath)
        return
      }
      setError(message('savedFolderMismatch'))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : message('cannotRestoreFolder'))
    }
  }, [loadDirectory, message, pendingDirectories])

  const refresh = useCallback(async () => {
    if (isDemo) {
      if (currentDocument) await openPath(currentDocument.path)
      return
    }
    if (localRootUrl && singleSource) {
      const refreshedTree = await readLocalDirectoryTree(singleSource.sourceUrl, localRootUrl, showHiddenRef.current)
      setTree(refreshedTree)
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
  }, [chooseFolder, currentDocument, loadDirectory, localRootUrl, openPath, rootHandle, singleDocument, singleSource])

  useEffect(() => {
    if (isDemo || !initialFile) return
    let active = true
    Promise.resolve(initialFile).then(async (captured) => {
      if (!active) return
      const next = toLoadedDocument(captured)
      const directoryUrl = parentDirectoryUrl(captured.sourceUrl)
      const rendered = await renderMarkdown(next.markdown)
      if (!active) return
      setSingleSource(captured)
      setSingleDocument(next)
      setRootName(captured.parentName)
      setLocalRootUrl(undefined)
      setTree([{ kind: 'file', name: next.name, path: next.path, url: captured.sourceUrl }])
      setCurrentDocument(next)
      setHtml(rendered.html)
      setHeadings(rendered.headings)
      const localTree = await readLocalDirectoryTree(captured.sourceUrl, directoryUrl, showHiddenRef.current).catch(() => null)
      if (!active || !localTree) return
      setLocalRootUrl(directoryUrl)
      setTree(localTree)
    }).catch(() => {
      if (active) setError(message('cannotReadSingle'))
    })
    return () => { active = false }
  }, [initialFile, message])

  useEffect(() => {
    if (isDemo || initialFile) return
    let active = true
    getRootHandles().then(async (handles) => {
      const pending: Array<{ handle: FileSystemDirectoryHandle; relativePath?: undefined }> = []
      for (const handle of handles) {
        if (!active) return
        if (await ensureReadPermission(handle, false)) {
          await saveRootHandle(handle)
          await loadDirectory(handle)
          return
        }
        pending.push({ handle })
      }
      if (!active || !pending.length) return
      setPendingDirectories(pending)
      setRootName(pending[0].handle.name)
    }).catch(() => setError(message('cannotRestoreFolder')))
    return () => { active = false }
  }, [initialFile, loadDirectory, message])

  const expandLocalDirectory = useCallback(async (path: string, url: string) => {
    if (!singleSource || !localRootUrl) return
    setError('')
    try {
      const children = await readLocalDirectory(singleSource.sourceUrl, url, path, showHiddenRef.current)
      setTree((current) => replaceDirectoryChildren(current, path, children))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : message('readFolderFailed'))
    }
  }, [localRootUrl, message, singleSource])

  useEffect(() => {
    if (!currentDocument || html) return
    renderMarkdown(currentDocument.markdown).then((rendered) => {
      setHtml(rendered.html)
      setHeadings(rendered.headings)
    })
  }, [currentDocument, html])

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.theme = settings.theme
    document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en'
  }, [settings])

  useEffect(() => {
    if (previousShowHidden.current === settings.showHidden) return
    previousShowHidden.current = settings.showHidden
    if (rootHandle) void loadDirectory(rootHandle)
    else if (localRootUrl && singleSource) {
      void readLocalDirectoryTree(singleSource.sourceUrl, localRootUrl, settings.showHidden)
        .then(setTree)
        .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : message('readFolderFailed')))
    }
  }, [loadDirectory, localRootUrl, message, rootHandle, settings.showHidden, singleSource])

  useEffect(() => {
    if (!settings.autoRefresh || !currentDocument) return
    if (currentDocument.sourceUrl && singleSource) {
      let refreshing = false
      const timer = window.setInterval(async () => {
        if (refreshing) return
        refreshing = true
        try {
          const markdown = await readLocalMarkdown(singleSource.sourceUrl, currentDocument.sourceUrl!)
          if (markdown !== currentDocument.markdown) {
            const rendered = await renderMarkdown(markdown)
            setCurrentDocument((document) => {
              if (!document || document.sourceUrl !== currentDocument.sourceUrl) return document
              return { ...document, markdown, lastModified: Date.now() }
            })
            setHtml(rendered.html)
            setHeadings(rendered.headings)
          }
        } catch { /* permission changes are surfaced on manual refresh */ }
        finally { refreshing = false }
      }, 1500)
      return () => window.clearInterval(timer)
    }
    if (!currentDocument.fileHandle || !rootHandle) return
    const timer = window.setInterval(async () => {
      try {
        const file = await currentDocument.fileHandle!.getFile()
        if (file.lastModified !== currentDocument.lastModified) await openPath(currentDocument.path)
      } catch { /* permission changes are surfaced on manual refresh */ }
    }, 1500)
    return () => window.clearInterval(timer)
  }, [currentDocument, openPath, rootHandle, settings.autoRefresh, singleSource])

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setTab('files')
        requestAnimationFrame(() => document.getElementById('file-search')?.focus())
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [])

  const changeTab = useCallback((nextTab: 'files' | 'outline') => {
    setTab(nextTab)
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
      <Sidebar rootName={rootName} tree={tree} activePath={currentDocument?.path ?? ''} headings={headings} tab={tab} query={query} language={settings.language} singleFileMode={Boolean(initialFile && !rootHandle && !localRootUrl)} showFolderAction={!initialFile} restoreFolderName={pendingDirectories[0]?.handle.name} onTabChange={changeTab} onQueryChange={setQuery} onOpen={openPath} onExpandDirectory={expandLocalDirectory} onChooseFolder={chooseFolder} onRestoreFolder={restoreSavedFolder} />
      <div className="resize-handle" onPointerDown={() => { resizing.current = true; globalThis.document.body.classList.add('is-resizing') }} />
      <section className="workspace">
        <TopBar rootName={rootName} path={currentDocument?.path ?? ''} theme={settings.theme} language={settings.language} loading={loading} onThemeToggle={() => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))} onRefresh={refresh} onSettings={() => setShowSettings(true)} />
        {pendingDirectories.length && !rootHandle ? <button className="permission-banner" onClick={restoreSavedFolder}><FolderOpen size={17} /> {message('restoreFolderPersistent', { name: pendingDirectories[0].handle.name })}</button> : null}
        {error ? <div className="error-banner"><AlertCircle size={17} /> <span>{error}</span><button onClick={() => setError('')}>{message('close')}</button></div> : null}
        <Reader document={currentDocument} html={html} rootHandle={rootHandle} localSourceUrl={singleSource?.sourceUrl} fontSize={settings.fontSize} language={settings.language} onOpenPath={openPath} />
      </section>
      {showSettings ? <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} /> : null}
    </div>
  )
}
