import { lazy, Suspense } from 'react'

const MarkdownPdf = lazy(() => import('./markdown-pdf'))

export default function MarkdownPdfRoute() {
  return <Suspense fallback={<div className="route-loading">Loading document editor...</div>}><MarkdownPdf /></Suspense>
}
