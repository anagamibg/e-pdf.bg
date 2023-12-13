# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
