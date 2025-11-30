# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-02-20

### Added
- **Lighten PDF tool** (`/lighten-pdf`) — fully client-side tool to brighten and enhance scanned documents and photos of documents
  - Real-time preview: pdf.js renders PDF pages to canvas, CSS `filter` property applies brightness/contrast/saturation instantly as user adjusts sliders
  - **4 adjustment filters:** Brightness (50–250%), Contrast (50–200%), Saturation (0–200%), Sharpness (0–100%)
  - **4 presets:** Scanned Document, Photo, Faded, High Contrast — one-click corrections for common use cases
  - Sharpness filter uses unsharp mask via canvas pixel manipulation (blur difference blending)
  - Saving via pdf-lib: renders each page at 2× resolution through filtered canvas to PNG, embeds in new PDF preserving original page dimensions
  - Multi-page navigation with zoom controls
  - No server upload required — all processing happens in the browser
  - `PDFLightenEditor` component (`components/PDFLightenEditor.js`) with dedicated CSS Module
  - Dynamic import with `ssr: false` to avoid SSR issues with canvas/pdfjs
  - Full BG/EN localization, star ratings, SEO schema
  - Added to navigation under "Optimize & Extract" group

## [1.5.0] - 2026-02-20

### Added
- **Split PDF tool:** New server-side tool to split a PDF file into multiple separate PDF files, downloaded as a ZIP archive
  - **Split all pages** — each page is extracted as an individual PDF file using Ghostscript (`gs -dFirstPage=N -dLastPage=N`)
  - **Split by ranges** — user defines custom page ranges (e.g. 1-3, 4-6, 7-10), each range becomes a separate PDF
  - Page count detection via `qpdf --show-npages`
  - Page previews shown client-side before splitting (reuses `handleExtractPagesFileSelection`)
  - New server helpers: `saveDataToJsonForSplit()`, `runSplitPDFCommand()` in `files-repo.js`
  - Full BG/EN localization, star ratings, SEO schema
  - Added to navigation under "Merge & Edit" group

## [1.4.0] - 2026-02-20

### Added
- **PDF Editor — inline text editing:** Rewritten text editing system with HTML text layer overlay for Sejda-style single-click editing of existing PDF text
  - Text color extraction from PDF operator list (RGB, Gray, CMYK color spaces)
  - Background color sampling from canvas pixels for cover rectangles (works on colored backgrounds)
  - Toolbar blur prevention — formatting controls (bold, italic, font, color, size) stay open during editing
  - 30 fonts available in dropdown organized by category (Sans-serif, Serif, Monospace, Display/Decorative, System)
  - **Google Fonts added:** Roboto, Poppins, Inter, Lato, Montserrat, Nunito, Noto Sans, Source Sans 3, Fira Sans, Raleway, PT Sans, Barlow, Cabin, Archivo, Ubuntu, Quicksand, Oswald, Comfortaa, Playfair Display, Merriweather, Bitter, Bebas Neue, Dancing Script, Pacifico
  - **System font alternatives:** Tinos (Georgia metric-compatible), Liberation Sans/Serif/Mono, Calibri
  - Dynamic font loading from FONT_FAMILIES config via FontFace API
  - PDF font name recognition via PDF_FONT_MAP (maps PDF-embedded font names to available fonts)

### Fixed
- **PDF Editor — font dropdown:** Fixed font select dropdown closing immediately when clicked during text editing (blur handler now checks active element type before refocusing span)
- **PDF Editor — toolbar interaction:** All formatting controls (bold, italic, underline, font family, font size, color picker) now properly work during inline text editing without losing editing mode

## [1.3.1] - 2026-02-19

### Fixed
- **excel-to-pdf:** Fixed text overlapping in PDF output when Excel cells contain wrapped text in narrow columns. Added Python pre-processing step (`scripts/fix-excel-row-heights.py`) using openpyxl to auto-calculate and set proper row heights before LibreOffice conversion. Handles both `.xlsx` and `.xls` formats.

## [1.3.0] - 2026-02-19

### Added
- **PDF to Excel tool** (`/pdf-to-excel`) — converts PDF documents to editable Excel XLSX spreadsheets using Python pdfplumber + openpyxl for table extraction (LibreOffice cannot do PDF→Calc conversion)
  - Full bilingual support (BG/EN locale files)
  - Star ratings and SEO schema integration
  - Added to navigation dropdown, sitemap, and homepage tools grid

## [1.2.1] - 2026-02-19

### Fixed
- **compress-pdf.js:** Removed `-dOmitID=true` from Ghostscript compression command. This flag was stripping the PDF Document ID, which prevented external digital signing services (Adobe Sign, Evrotrust, eID, etc.) from adding electronic signatures to compressed PDF files.

## [1.1.0] - 2025-02-17

### Added
- **PDF Editor tool** (`/edit-pdf`) — new client-side PDF editor that allows users to add text and images to PDF documents directly in the browser
  - Canvas-based visual editor with drag & drop positioning
  - Text tool with customizable font size and color
  - Image tool supporting JPG and PNG uploads with resize handles
  - Multi-page navigation and zoom controls
  - Touch support for mobile devices
  - Client-side processing using pdf-lib (no server upload required)
- **SeoSchema component** — reusable JSON-LD structured data component added to all 26 tool pages
- **Homepage SEO sections** — 3 content sections with h2 headings for improved search engine visibility
- **JSON-LD WebApplication schema** on homepage with hrefLang alternate links
- **CHANGELOG.md** — project changelog for tracking versions and changes

### Changed
- Header menu font sizes reduced (16px to 14px, CTA button 14px to 13px)
- Base font-size set to 16px on html element for consistent rem units
- Line-height improved from 1.13 to 1.5 for better readability
- Sticky header fix: changed `overflow-x: hidden` to `overflow-x: clip` on body
- Moved sticky positioning from inner `<nav>` to outer `<header>` element

### Fixed
- Sticky header not working due to `overflow-x: hidden` on html/body breaking `position: sticky`
- Typos in EN locale titles: "Passowrd" to "Password" (protect-pdf, unlock-pdf)
- Typos in EN locale titles: "Convertor" to "Converter" (grayscale-pdf, jpg-to-pdf, bmp-to-pdf, tiff-to-pdf)
- All placeholder meta descriptions and keywords in EN locale files replaced with proper SEO content
- About and Contact page meta tags improved in both BG and EN locales

## [1.0.0] - 2025-02-16

### Added
- Initial customized deployment of PDF Tools for e-pdf.bg
- Bulgarian (bg) and English (en) localization
- Custom branding: logo, colors, fonts (Open Sans)
- Google Analytics integration (G-C4D38EX2MD)
- Custom favicon
- Privacy Policy page with GDPR content
- CTA button in header navigation
- Footer with "Anagami Digital Accounting" branding
- GitHub repository setup and SSH deployment pipeline
- Docker container deployment on Hetzner server
- noindex meta tag for development phase

### Changed
- Removed unused languages (kept bg and en only)
- Removed Share section from all tool pages
- Removed AvailableTools section
- Removed codecanyon attribution text
- Custom hero text and descriptions in Bulgarian
- Mobile-responsive header and logo adjustments

### Fixed
- Mobile header layout issues
- Footer text styling (bold company name)
