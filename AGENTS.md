# daily-tools

SPA toolbox — private, client-only React app. No SSR, no API, no DB.

## Commands

```sh
npm run dev       # Vite dev server with HMR
npm run build     # tsc -b && vite build (run both before push)
npm run lint      # oxlint
npm run preview   # vite preview (prod build locally)
```

`build` runs **tsc + vite** — typecheck failure fails the build regardless of Vite. Run `lint && npm run build` before pushing.

## Routing

Each tool is a route at its own path, defined in `src/main.tsx` via `@tanstack/react-router`'s imperative API (`createRootRoute` / `createRoute` / `addChildren`). Adding a new tool = add a route in `main.tsx` + a component in `src/routes/`. Path and metadata live in `src/lib/tools.ts`.

Tool category list in sidebar (`src/App.tsx:56`): `['Developer', 'Data', 'Design', 'Text']`.

## Toolchain quirks

- `verbatimModuleSyntax` — use `import type` for type-only imports or TS will error.
- `@/` path alias maps to `./src/*` (configured in vite + tsconfig).
- CSS is Tailwind v4 + custom properties in `src/index.css` (no PostCSS config, `@tailwindcss/vite` plugin).
- Icons: `lucide-react`. UI primitives: `@base-ui/react`. Shadcn via `shadcn` package + `components.json`.
- Type declarations for untyped deps (`html2pdf.js`, `sql-formatter`) live in `src/types/`.
- `src/lib/color.ts` — color parser/converter (hex, rgb, hsl, cmyk), shared by color-converter and image-color-picker routes.
- `react-query` is installed but currently unused — no data fetching exists.

## Tools

| Route | Component | Dependencies |
|-------|-----------|-------------|
| `/diff-viewer` | `diff-viewer.tsx` | `diff` (npm) |
| `/json-formatter` | `json-formatter.tsx` | none |
| `/timestamp` | `timestamp.tsx` | none |
| `/text-inspector` | `text-inspector.tsx` | none |
| `/uuid-generator` | `uuid-generator.tsx` | none |
| `/markdown-pdf` | `markdown-pdf.tsx` | `marked`, `DOMPurify`, `html2pdf.js` |
| `/sql-formatter` | `sql-formatter.tsx` | `sql-formatter` (npm) |
| `/json-csv` | `json-csv.tsx` | `papaparse` |
| `/color-converter` | `color-converter.tsx` | `src/lib/color.ts` |
| `/image-color-picker` | `image-color-picker.tsx` | `src/lib/color.ts` |
| `/color-palette` | `color-palette.tsx` | `src/lib/color.ts` (seeded PRNG, no new deps) |

All tools are client-only — data stays in localStorage or in-memory.
