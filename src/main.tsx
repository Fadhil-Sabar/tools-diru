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
import SqlFormatter from './routes/sql-formatter.tsx'
import JsonCsv from './routes/json-csv.tsx'
import ColorConverter from './routes/color-converter.tsx'
import ImageColorPicker from './routes/image-color-picker.tsx'
import ColorPalette from './routes/color-palette.tsx'
import MarkdownPdfRoute from './routes/markdown-pdf-lazy.tsx'
import JapaneseQuiz from './routes/japanese-quiz.tsx'
import TokenVisualizer from './routes/token-visualizer.tsx'

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

const markdownRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/markdown-pdf',
  component: MarkdownPdfRoute,
})

const sqlRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sql-formatter',
  component: SqlFormatter,
})

const jsonCsvRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/json-csv',
  component: JsonCsv,
})

const colorConverterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/color-converter',
  component: ColorConverter,
})

const imageColorPickerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/image-color-picker',
  component: ImageColorPicker,
})

const colorPaletteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/color-palette',
  component: ColorPalette,
})

const japaneseQuizRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/japanese-quiz',
  component: JapaneseQuiz,
})

const tokenVisualizerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/token-visualizer',
  component: TokenVisualizer,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  diffRoute,
  jsonRoute,
  timestampRoute,
  textRoute,
  uuidRoute,
  markdownRoute,
  sqlRoute,
  jsonCsvRoute,
  colorConverterRoute,
  imageColorPickerRoute,
  colorPaletteRoute,
  japaneseQuizRoute,
  tokenVisualizerRoute,
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
