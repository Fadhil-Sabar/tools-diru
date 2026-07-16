import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'

import Layout from './App.tsx'
import Dashboard from './routes/index.tsx'
import DiffViewer from './routes/diff-viewer.tsx'
import JsonFormatter from './routes/json-formatter.tsx'
import Timestamp from './routes/timestamp.tsx'
import TextInspector from './routes/text-inspector.tsx'
import UuidGenerator from './routes/uuid-generator.tsx'

import './index.css'

const rootRoute = createRootRoute({ component: Layout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const diffRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/diff-viewer',
  component: DiffViewer,
})

const jsonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/json-formatter',
  component: JsonFormatter,
})

const timestampRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timestamp',
  component: Timestamp,
})

const textRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/text-inspector',
  component: TextInspector,
})

const uuidRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/uuid-generator',
  component: UuidGenerator,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  diffRoute,
  jsonRoute,
  timestampRoute,
  textRoute,
  uuidRoute,
])

const router = createRouter({ routeTree })
const queryClient = new QueryClient()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
