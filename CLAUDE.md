# CLAUDE.md — e-pdf.bg Project Guide

## Project Overview
**e-pdf.bg** is a free online PDF tools web application built with Next.js. It allows users to merge, compress, convert, edit, protect, and unlock PDF files. The site supports Bulgarian (bg, default) and English (en) localization.

**Version:** 1.1.0
**Live URL:** https://e-pdf.bg

## Tech Stack
- **Framework:** Next.js 15.5.12 with React 18.2.0 (Pages Router)
- **Styling:** CSS Modules + Global CSS with CSS custom properties
- **i18n:** next-i18next (bg default, en)
- **PDF Processing:**
  - Client-side: `pdf-lib` v1.17.1 (text/image embedding), `react-pdf` v8.0.2 (rendering)
  - Server-side: Ghostscript (compression, grayscale), qpdf (protect/unlock), LibreOffice (office conversions)
  - `pdfjs-dist` loaded from CDN (3.11.174) for PDF Editor canvas rendering
- **File Handling:** formidable (uploads), jszip (zip), pdfkit (image→PDF)
- **UI:** react-bootstrap-icons, react-toastify, react-dnd, react-selecto

## Architecture

### Directory Structure
```
/pages/              — Next.js pages (one per tool + index, about, contacts, privacy, terms)
/pages/api/          — API endpoints for server-side tools (formidable + file processing)
/components/         — Reusable React components
/hooks/              — Custom hooks (useDocuments, useUploadStats, useToolsData, usePassword)
/helpers/            — Utilities (utils.js, files-repo.js, pdf-utils.js, validateOrigin.js)
/styles/             — CSS Modules + global.css
/public/locales/bg/  — Bulgarian translations (JSON per page)
/public/locales/en/  — English translations (JSON per page)
/public/img/         — Static images (logo, favicon, thumbnails)
```

### Tool Registration Pattern
1. Add tool config in `hooks/useToolsData.js` (key, title, description, href, icon, MIME types, etc.)
2. Create page at `pages/<tool-name>.js` using existing component pattern
3. Create API endpoint at `pages/api/<tool-name>.js` (if server-side processing needed)
4. Add locale files: `public/locales/bg/<tool-name>.json` and `public/locales/en/<tool-name>.json`
5. Add tool to `components/ToolsList.js` dropdown menu
6. Tool auto-appears on homepage grid via `useToolsData` iteration

### Form Steps Pattern (Server-Side Tools)
Most tool pages follow a consistent form step pattern:
- **Step 0:** Upload (UploadAreaFormStep)
- **Step 1:** Edit/Configure (EditFilesFormStep or custom)
- **Step 2:** Options (SelectOptionFormStep, optional)
- **Step 3:** Uploading (UploadingFilesFormStep)
- **Step 4:** Processing (ProcessingFilesFormStep)
- **Step 5:** Download (DownloadFilesFormStep)

### Client-Side Tool Pattern (Edit PDF)
The Edit PDF tool processes entirely in the browser:
- **Step 0:** Upload
- **Step 1:** Canvas-based editor (PDFEditor component, pdf.js for rendering, pdf-lib for saving)
- **Step 2:** Download

### API Endpoint Pattern
```
1. Parse multipart form with formidable
2. Extract file ID and path
3. Create JSON tracking file via filesRepo.saveDataToJson()
4. Build shell command (gs, qpdf, libreoffice, etc.)
5. Run async via filesRepo.runCommand()
6. Return file object; client polls /api/check-processing for completion
```

### File Processing Flow
- Files uploaded → saved to temp dir → tracked via JSON file
- Background command processes file → updates JSON status to "processed" or "failed"
- Client polls `/api/check-processing` every 5s → returns base64 of processed file
- Files auto-deleted after 1 hour via `scheduleFileDeletion()`

## Deployment

### Server
- **Host:** Hetzner VPS at `e-pdf.bg`
- **Container:** Docker (ID: `dc9f48b7cc4b`)
- **SSH Key:** `~/.ssh/hetzner_key`

### Deployment Steps
```bash
# 1. Upload files to server host
rsync -avz -e "ssh -i ~/.ssh/hetzner_key -o IdentitiesOnly=yes" \
  ./path/to/files root@e-pdf.bg:/root/pdf-tools/

# 2. Copy into Docker container
ssh -i ~/.ssh/hetzner_key root@e-pdf.bg \
  "docker cp /root/pdf-tools/path/. dc9f48b7cc4b:/app/path/"

# 3. Clear cache and rebuild
ssh -i ~/.ssh/hetzner_key root@e-pdf.bg \
  "docker exec dc9f48b7cc4b rm -rf /app/.next && docker exec dc9f48b7cc4b npm run build"

# 4. Restart container
ssh -i ~/.ssh/hetzner_key root@e-pdf.bg "docker restart dc9f48b7cc4b"
```

### GitHub
- **Repo:** `FileSubmit/e-pdf.bg`
- **SSH Key:** `~/.ssh/github_key`
- **Push:** `GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git push origin main`

## Key Files

| File | Purpose |
|------|---------|
| `hooks/useToolsData.js` | Central tool registry — all tools defined here |
| `components/ToolsList.js` | Navigation dropdown menu — manually lists tools by group |
| `components/Nav.js` | Header navigation with sticky positioning; includes inline language dropdown |
| `components/PDFEditor.js` | Canvas-based PDF editor (text + images) |
| `components/SeoSchema.js` | Reusable JSON-LD structured data |
| `helpers/utils.js` | File handling, upload/download, notifications |
| `helpers/files-repo.js` | Server-side file management, command execution |
| `styles/global.css` | Global styles, CSS variables, base font settings |
| `styles/MegaMenu.module.css` | Header/navigation styles |
| `next.config.js` | i18n config, env variables, image domains |
| `CHANGELOG.md` | Version history and release notes |

## CSS Variables (defined in global.css)
- `--secondary` — primary brand color (used for header, buttons, accents)
- `--nav-height` — navigation bar height
- `--text-primary`, `--text-secondary` — text colors

## Build & Development
```bash
npm run dev    # Development mode (node app.js)
npm run build  # Production build (next build)
npm run start  # Production server (NODE_ENV=production node app.js)
npm run lint   # ESLint
```

## Important Notes
- **Sticky header:** Uses `position: sticky` on `<header>` element. Requires `overflow-x: clip` (not `hidden`) on body.
- **Base font-size:** `html { font-size: 16px }` for rem consistency, `body { line-height: 1.5 }`
- **Google Analytics:** G-C4D38EX2MD (set in next.config.js)
- **noindex:** Currently active for development phase
- **PDF Editor CDN:** pdf.js loaded from cdnjs.cloudflare.com (v3.11.174), not npm
- **No fabric.js needed:** The editor uses native HTML5 Canvas API instead
- **Language switcher:** Inline dropdown in nav (no modal). `LangModal.js` and `LangModal.module.css` removed. Styles live in `MegaMenu.module.css` under `.lang_dropdown*` classes.
