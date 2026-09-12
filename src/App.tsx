import { useEffect, useRef, useState } from 'react'
import { ChevronRight, FileCode2, Home, Menu, Moon, Search, ShieldCheck, Sun, X } from 'lucide-react'
import { Link, Outlet, useLocation } from '@tanstack/react-router'

import { TOOLS, toolBreadcrumb } from '@/lib/tools'

function App() {
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('toolbox-theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const searchInput = useRef<HTMLInputElement>(null)
  const location = useLocation()

  const visibleTools = TOOLS.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key === '/' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('toolbox-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <div className="toolbox-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" className="brand" aria-label="Toolbox home" onClick={closeSidebar}>
            <span className="brand-mark"><FileCode2 /></span>
            <span>Toolbox</span>
          </Link>
          <button className="close-sidebar" onClick={closeSidebar} aria-label="Close navigation"><X /></button>
        </div>

        <nav aria-label="Tools">
          <Link to="/" className={`nav-item home-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeSidebar}>
            <Home /><span>Overview</span>
          </Link>
          {(['Developer', 'Data', 'Design', 'Text'] as const).map((category) => (
            <div className="nav-group" key={category}>
              <p>{category}</p>
              {visibleTools.filter((tool) => tool.category === category).map((tool) => {
                const Icon = tool.icon
                if (tool.externalUrl) {
                  return (
                    <a href={tool.externalUrl} target="_blank" rel="noreferrer" className="nav-item" onClick={closeSidebar} key={tool.id}>
                      <Icon /><span>{tool.name}</span>
                    </a>
                  )
                }
                return (
                  <Link to={tool.path} className={`nav-item ${location.pathname === tool.path ? 'active' : ''}`} onClick={closeSidebar} key={tool.id}>
                    <Icon /><span>{tool.name}</span>{!tool.available && <small>Soon</small>}
                  </Link>
                )
              })}
            </div>
          ))}
          {visibleTools.length === 0 && <p className="no-tools">No matching tools</p>}
        </nav>

        <div className="privacy-note"><ShieldCheck /><span><strong>Local workspace</strong>Your data never leaves this browser.</span></div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={closeSidebar} aria-label="Close navigation" />}

      <div className="app-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="breadcrumb"><span>Toolbox</span><ChevronRight /><strong>{toolBreadcrumb(location.pathname)}</strong></div>
          <div className="topbar-actions">
            <label className="global-search">
              <Search />
              <input ref={searchInput} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a tool..." />
              <kbd>/</kbd>
            </label>
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((current) => !current)}
              aria-label={darkMode ? 'Use light mode' : 'Use dark mode'}
              title={darkMode ? 'Use light mode' : 'Use dark mode'}
            >
              {darkMode ? <Sun /> : <Moon />}
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default App
