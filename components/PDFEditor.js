import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "next-i18next";
import {
  Fonts,
  ImageFill,
  Trash,
  PlusLg,
  DashLg,
  ChevronLeft,
  ChevronRight,
  Download,
  TypeBold,
  TypeItalic,
  TypeUnderline,
  EraserFill,
  PenFill,
} from "react-bootstrap-icons";
import styles from "../styles/PDFEditor.module.css";

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// ── Font configuration for PDF text editing ─────────────────────────────
const FONT_FAMILIES = {
  "Liberation Sans": {
    regular: "/fonts/LiberationSans-Regular.ttf",
    bold: "/fonts/LiberationSans-Bold.ttf",
    italic: "/fonts/LiberationSans-Italic.ttf",
    boldItalic: "/fonts/LiberationSans-BoldItalic.ttf",
    cssFamily: '"Liberation Sans", Arial, Helvetica, sans-serif',
  },
  "Liberation Serif": {
    regular: "/fonts/LiberationSerif-Regular.ttf",
    bold: "/fonts/LiberationSerif-Bold.ttf",
    italic: "/fonts/LiberationSerif-Italic.ttf",
    boldItalic: "/fonts/LiberationSerif-BoldItalic.ttf",
    cssFamily: '"Liberation Serif", "Times New Roman", Times, serif',
  },
  "Liberation Mono": {
    regular: "/fonts/LiberationMono-Regular.ttf",
    bold: "/fonts/LiberationMono-Bold.ttf",
    italic: "/fonts/LiberationMono-Italic.ttf",
    boldItalic: "/fonts/LiberationMono-BoldItalic.ttf",
    cssFamily: '"Liberation Mono", "Courier New", Courier, monospace',
  },
  "Open Sans": {
    regular: "/fonts/OpenSans-Regular.ttf",
    bold: "/fonts/LiberationSans-Bold.ttf",
    italic: "/fonts/OpenSans-Italic.ttf",
    boldItalic: "/fonts/LiberationSans-BoldItalic.ttf",
    cssFamily: '"Open Sans", sans-serif',
  },
  "Calibri": {
    regular: "/fonts/calibri.ttf",
    bold: "/fonts/calibrib.ttf",
    italic: "/fonts/calibrii.ttf",
    boldItalic: "/fonts/calibriz.ttf",
    cssFamily: 'Calibri, "Liberation Sans", Arial, sans-serif',
  },
  "Roboto": {
    regular: "/fonts/Roboto-Regular.ttf",
    bold: "/fonts/Roboto-Bold.ttf",
    italic: "/fonts/Roboto-Italic.ttf",
    boldItalic: "/fonts/Roboto-Bold.ttf",
    cssFamily: 'Roboto, "Liberation Sans", Arial, sans-serif',
  },
  "Lato": {
    regular: "/fonts/Lato-Regular.ttf",
    bold: "/fonts/Lato-Bold.ttf",
    italic: "/fonts/Lato-Italic.ttf",
    boldItalic: "/fonts/Lato-BoldItalic.ttf",
    cssFamily: 'Lato, "Liberation Sans", sans-serif',
  },
  "Montserrat": {
    regular: "/fonts/Montserrat-Regular.ttf",
    bold: "/fonts/Montserrat-Bold.ttf",
    italic: "/fonts/Montserrat-Italic.ttf",
    boldItalic: "/fonts/Montserrat-BoldItalic.ttf",
    cssFamily: 'Montserrat, "Liberation Sans", sans-serif',
  },
  "Noto Sans": {
    regular: "/fonts/NotoSans-Regular.ttf",
    bold: "/fonts/NotoSans-Bold.ttf",
    italic: "/fonts/NotoSans-Italic.ttf",
    boldItalic: "/fonts/NotoSans-BoldItalic.ttf",
    cssFamily: '"Noto Sans", "Liberation Sans", sans-serif',
  },
  "Playfair Display": {
    regular: "/fonts/PlayfairDisplay-Regular.ttf",
    bold: "/fonts/PlayfairDisplay-Bold.ttf",
    italic: "/fonts/PlayfairDisplay-Italic.ttf",
    boldItalic: "/fonts/PlayfairDisplay-BoldItalic.ttf",
    cssFamily: '"Playfair Display", "Liberation Serif", Georgia, serif',
  },
  "PT Sans": {
    regular: "/fonts/PTSans-Regular.ttf",
    bold: "/fonts/PTSans-Bold.ttf",
    italic: "/fonts/PTSans-Italic.ttf",
    boldItalic: "/fonts/PTSans-BoldItalic.ttf",
    cssFamily: '"PT Sans", "Liberation Sans", sans-serif',
  },
  "Raleway": {
    regular: "/fonts/Raleway-Regular.ttf",
    bold: "/fonts/Raleway-Bold.ttf",
    italic: "/fonts/Raleway-Italic.ttf",
    boldItalic: "/fonts/Raleway-BoldItalic.ttf",
    cssFamily: 'Raleway, "Liberation Sans", sans-serif',
  },
  "Oswald": {
    regular: "/fonts/Oswald-Regular.ttf",
    bold: "/fonts/Oswald-Bold.ttf",
    italic: "/fonts/Oswald-Regular.ttf",
    boldItalic: "/fonts/Oswald-Bold.ttf",
    cssFamily: 'Oswald, "Liberation Sans", sans-serif',
  },
  "Ubuntu": {
    regular: "/fonts/Ubuntu-Regular.ttf",
    bold: "/fonts/Ubuntu-Bold.ttf",
    italic: "/fonts/Ubuntu-Italic.ttf",
    boldItalic: "/fonts/Ubuntu-BoldItalic.ttf",
    cssFamily: 'Ubuntu, "Liberation Sans", sans-serif',
  },
  // ── New Google Fonts ──
  "Poppins": {
    regular: "/fonts/Poppins-Regular.ttf",
    bold: "/fonts/Poppins-Bold.ttf",
    italic: "/fonts/Poppins-Italic.ttf",
    boldItalic: "/fonts/Poppins-BoldItalic.ttf",
    cssFamily: 'Poppins, "Liberation Sans", sans-serif',
  },
  "Inter": {
    regular: "/fonts/Inter-Regular.ttf",
    bold: "/fonts/Inter-Bold.ttf",
    italic: "/fonts/Inter-Italic.ttf",
    boldItalic: "/fonts/Inter-BoldItalic.ttf",
    cssFamily: 'Inter, "Liberation Sans", sans-serif',
  },
  "Nunito": {
    regular: "/fonts/Nunito-Regular.ttf",
    bold: "/fonts/Nunito-Bold.ttf",
    italic: "/fonts/Nunito-Italic.ttf",
    boldItalic: "/fonts/Nunito-BoldItalic.ttf",
    cssFamily: 'Nunito, "Liberation Sans", sans-serif',
  },
  "Source Sans 3": {
    regular: "/fonts/SourceSans3-Regular.ttf",
    bold: "/fonts/SourceSans3-Bold.ttf",
    italic: "/fonts/SourceSans3-Italic.ttf",
    boldItalic: "/fonts/SourceSans3-BoldItalic.ttf",
    cssFamily: '"Source Sans 3", "Liberation Sans", sans-serif',
  },
  "Merriweather": {
    regular: "/fonts/Merriweather-Regular.ttf",
    bold: "/fonts/Merriweather-Bold.ttf",
    italic: "/fonts/Merriweather-Italic.ttf",
    boldItalic: "/fonts/Merriweather-BoldItalic.ttf",
    cssFamily: 'Merriweather, "Liberation Serif", Georgia, serif',
  },
  "Fira Sans": {
    regular: "/fonts/FiraSans-Regular.ttf",
    bold: "/fonts/FiraSans-Bold.ttf",
    italic: "/fonts/FiraSans-Italic.ttf",
    boldItalic: "/fonts/FiraSans-BoldItalic.ttf",
    cssFamily: '"Fira Sans", "Liberation Sans", sans-serif',
  },
  "Quicksand": {
    regular: "/fonts/Quicksand-Regular.ttf",
    bold: "/fonts/Quicksand-Bold.ttf",
    italic: "/fonts/Quicksand-Regular.ttf",
    boldItalic: "/fonts/Quicksand-Bold.ttf",
    cssFamily: 'Quicksand, "Liberation Sans", sans-serif',
  },
  "Bitter": {
    regular: "/fonts/Bitter-Regular.ttf",
    bold: "/fonts/Bitter-Bold.ttf",
    italic: "/fonts/Bitter-Italic.ttf",
    boldItalic: "/fonts/Bitter-BoldItalic.ttf",
    cssFamily: 'Bitter, "Liberation Serif", Georgia, serif',
  },
  "Cabin": {
    regular: "/fonts/Cabin-Regular.ttf",
    bold: "/fonts/Cabin-Bold.ttf",
    italic: "/fonts/Cabin-Italic.ttf",
    boldItalic: "/fonts/Cabin-BoldItalic.ttf",
    cssFamily: 'Cabin, "Liberation Sans", sans-serif',
  },
  "Archivo": {
    regular: "/fonts/Archivo-Regular.ttf",
    bold: "/fonts/Archivo-Bold.ttf",
    italic: "/fonts/Archivo-Italic.ttf",
    boldItalic: "/fonts/Archivo-BoldItalic.ttf",
    cssFamily: 'Archivo, "Liberation Sans", sans-serif',
  },
  "Barlow": {
    regular: "/fonts/Barlow-Regular.ttf",
    bold: "/fonts/Barlow-Bold.ttf",
    italic: "/fonts/Barlow-Italic.ttf",
    boldItalic: "/fonts/Barlow-BoldItalic.ttf",
    cssFamily: 'Barlow, "Liberation Sans", sans-serif',
  },
  // ── Decorative / Display fonts ──
  "Dancing Script": {
    regular: "/fonts/DancingScript-Regular.ttf",
    bold: "/fonts/DancingScript-Bold.ttf",
    italic: "/fonts/DancingScript-Regular.ttf",
    boldItalic: "/fonts/DancingScript-Bold.ttf",
    cssFamily: '"Dancing Script", cursive',
  },
  "Comfortaa": {
    regular: "/fonts/Comfortaa-Regular.ttf",
    bold: "/fonts/Comfortaa-Bold.ttf",
    italic: "/fonts/Comfortaa-Regular.ttf",
    boldItalic: "/fonts/Comfortaa-Bold.ttf",
    cssFamily: 'Comfortaa, "Liberation Sans", sans-serif',
  },
  "Pacifico": {
    regular: "/fonts/Pacifico-Regular.ttf",
    bold: "/fonts/Pacifico-Regular.ttf",
    italic: "/fonts/Pacifico-Regular.ttf",
    boldItalic: "/fonts/Pacifico-Regular.ttf",
    cssFamily: 'Pacifico, cursive',
  },
  "Bebas Neue": {
    regular: "/fonts/BebasNeue-Regular.ttf",
    bold: "/fonts/BebasNeue-Regular.ttf",
    italic: "/fonts/BebasNeue-Regular.ttf",
    boldItalic: "/fonts/BebasNeue-Regular.ttf",
    cssFamily: '"Bebas Neue", "Liberation Sans", sans-serif',
  },
  // ── System font alternatives ──
  "Tinos": {
    regular: "/fonts/Tinos-Regular.ttf",
    bold: "/fonts/Tinos-Bold.ttf",
    italic: "/fonts/Tinos-Italic.ttf",
    boldItalic: "/fonts/Tinos-BoldItalic.ttf",
    cssFamily: 'Tinos, Georgia, "Liberation Serif", serif',
  },
};

const PDF_FONT_MAP = {
  "serif": "Liberation Serif",
  "sans-serif": "Liberation Sans",
  "monospace": "Liberation Mono",
  "helvetica": "Liberation Sans",
  "arial": "Liberation Sans",
  "times": "Liberation Serif",
  "times new roman": "Liberation Serif",
  "courier": "Liberation Mono",
  "courier new": "Liberation Mono",
  "calibri": "Calibri",
  "open sans": "Open Sans",
  "roboto": "Roboto",
  "lato": "Lato",
  "montserrat": "Montserrat",
  "noto sans": "Noto Sans",
  "playfair display": "Playfair Display",
  "playfair": "Playfair Display",
  "pt sans": "PT Sans",
  "raleway": "Raleway",
  "oswald": "Oswald",
  "ubuntu": "Ubuntu",
  "poppins": "Poppins",
  "inter": "Inter",
  "nunito": "Nunito",
  "source sans": "Source Sans 3",
  "source sans 3": "Source Sans 3",
  "source sans pro": "Source Sans 3",
  "merriweather": "Merriweather",
  "fira sans": "Fira Sans",
  "quicksand": "Quicksand",
  "bitter": "Bitter",
  "cabin": "Cabin",
  "archivo": "Archivo",
  "barlow": "Barlow",
  "dancing script": "Dancing Script",
  "comfortaa": "Comfortaa",
  "pacifico": "Pacifico",
  "bebas neue": "Bebas Neue",
  "bebas": "Bebas Neue",
  "tinos": "Tinos",
  "georgia": "Tinos",
  "verdana": "Liberation Sans",
  "tahoma": "Liberation Sans",
  "trebuchet": "Liberation Sans",
  "trebuchet ms": "Liberation Sans",
  "impact": "Bebas Neue",
  "comic sans": "Comfortaa",
  "comic sans ms": "Comfortaa",
};

const resolveFontFamily = (pdfFontFamily) => {
  if (!pdfFontFamily) return "Liberation Sans";
  const lower = pdfFontFamily.toLowerCase().trim();
  if (PDF_FONT_MAP[lower]) return PDF_FONT_MAP[lower];
  for (const [key, value] of Object.entries(PDF_FONT_MAP)) {
    if (lower.includes(key)) return value;
  }
  return "Liberation Sans";
};

let canvasFontsLoaded = false;
const loadCanvasFonts = async () => {
  if (canvasFontsLoaded) return;
  // Dynamically build font loading list from FONT_FAMILIES config
  const fontsToLoad = [];
  const seenUrls = new Set();
  for (const [name, config] of Object.entries(FONT_FAMILIES)) {
    const variants = [
      { url: config.regular, weight: "normal", style: "normal" },
      { url: config.bold, weight: "bold", style: "normal" },
      { url: config.italic, weight: "normal", style: "italic" },
      { url: config.boldItalic, weight: "bold", style: "italic" },
    ];
    for (const v of variants) {
      if (v.url && !seenUrls.has(v.url)) {
        seenUrls.add(v.url);
        fontsToLoad.push({ name, url: v.url, weight: v.weight, style: v.style });
      }
    }
  }
  const promises = fontsToLoad.map(async (f) => {
    try {
      const face = new FontFace(f.name, `url(${f.url})`, { weight: f.weight, style: f.style });
      await face.load();
      document.fonts.add(face);
    } catch (e) {
      console.warn(`Failed to load font: ${f.name} ${f.weight} ${f.style}`, e);
    }
  });
  await Promise.all(promises);
  canvasFontsLoaded = true;
};

let pdfjsPromise = null;
const loadPdfJs = () => {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.onload = () => {
      const lib = window.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return pdfjsPromise;
};

const PDFEditor = ({ pdfDocument, onSave, fileName }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const signCanvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const pageWrapperRef = useRef(null);
  const dragOccurredRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageElements, setPageElements] = useState({});
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState("#000000");
  const colorCanvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const renderingRef = useRef(false);

  // Signature state
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signatureReady, setSignatureReady] = useState(false);
  const signDrawingRef = useRef(false);
  const lastSignPoint = useRef(null);

  // Eraser size + color state
  const [eraserWidth, setEraserWidth] = useState(80);
  const [eraserHeight, setEraserHeight] = useState(30);
  const [eraserColor, setEraserColor] = useState("#ffffff");
  const [showEraserColorPicker, setShowEraserColorPicker] = useState(false);
  const [eraserHexInput, setEraserHexInput] = useState("#ffffff");
  const eraserColorCanvasRef = useRef(null);

  // Font family state
  const [selectedFontFamily, setSelectedFontFamily] = useState("Open Sans");

  // Text layer editing state
  const [editingSpanIndex, setEditingSpanIndex] = useState(null);
  const [editingBgColor, setEditingBgColor] = useState("#ffffff"); // sampled background color for cover rect
  const toolbarClickRef = useRef(false); // true when mousedown happened in toolbar

  // Inline text editing state for user-added text (canvas-based)
  const [editingText, setEditingText] = useState(null);
  const textEditRef = useRef(null);

  // Load PDF and render pages
  useEffect(() => {
    if (!pdfDocument) return;
    loadPDF();
  }, [pdfDocument]);

  // Re-render when page changes or elements change
  useEffect(() => {
    if (pdfPages.length > 0) {
      renderCurrentPage();
    }
  }, [currentPage, pageElements, selectedElement, pdfPages, scale, editingText, editingSpanIndex]);

  // Build text layer after canvas render
  useEffect(() => {
    if (pdfPages.length > 0) {
      requestAnimationFrame(() => buildTextLayer());
    }
  }, [currentPage, pageElements, pdfPages, scale, editingSpanIndex, activeTool]);

  // Exit inline editing on page change
  useEffect(() => {
    if (editingText) setEditingText(null);
    if (editingSpanIndex !== null) {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      setEditingSpanIndex(null);
    }
  }, [currentPage]);

  // Sync hex input when fontColor changes
  useEffect(() => {
    setHexInput(fontColor);
  }, [fontColor]);

  // When selecting a text element, load its properties into the toolbar
  useEffect(() => {
    if (selectedElement) {
      const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
      if (el && (el.type === "text" || el.type === "pdfText")) {
        setFontSize(el.fontSize);
        setFontColor(el.color);
        setIsBold(el.bold || false);
        setIsItalic(el.italic || false);
        setIsUnderline(el.underline || false);
        setSelectedFontFamily(el.fontFamily || "Open Sans");
        setActiveTool("text");
      }
    }
  }, [selectedElement]);

  // Init signature canvas when tool activates
  useEffect(() => {
    if (activeTool === "signature" && signCanvasRef.current) {
      const canvas = signCanvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      setSignatureReady(false);
    }
  }, [activeTool]);

  // ResizeObserver to keep text layer in sync with canvas display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const textLayerEl = textLayerRef.current;
      if (!textLayerEl || !canvas.width) return;
      const cssScale = canvas.getBoundingClientRect().width / canvas.width;
      textLayerEl.style.transform = `scale(${cssScale})`;
      textLayerEl.style.transformOrigin = "top left";
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [pdfPages, currentPage]);

  const loadPDF = async () => {
    try {
      const pdfjsLib = await loadPdfJs();
      await loadCanvasFonts();
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      const pages = [];
      const extractedElements = {};

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const viewport1 = page.getViewport({ scale: 1 });

        const offscreen = document.createElement("canvas");
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext("2d");

        await page.render({ canvasContext: ctx, viewport }).promise;

        pages.push({
          imageData: offscreen.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
          originalWidth: viewport1.width,
          originalHeight: viewport1.height,
        });

        // Extract text content and colors from the page
        const textContent = await page.getTextContent();
        const pageIndex = i - 1;
        extractedElements[pageIndex] = [];

        // Extract text fill colors from operator list
        let textColors = [];
        try {
          const ops = await page.getOperatorList();
          const OPS = pdfjsLib.OPS;
          let fillColor = [0, 0, 0]; // default black
          const stateStack = [];
          let textColorIndex = 0;

          for (let fi = 0; fi < ops.fnArray.length; fi++) {
            const fn = ops.fnArray[fi];
            const args = ops.argsArray[fi];

            switch (fn) {
              case OPS.setFillRGBColor:
                fillColor = [args[0], args[1], args[2]]; // 0-1 range
                break;
              case OPS.setFillGray:
                fillColor = [args[0], args[0], args[0]]; // grayscale
                break;
              case OPS.setFillCMYKColor:
                // CMYK to RGB approximate conversion
                if (args.length >= 4) {
                  const c = args[0], m = args[1], y2 = args[2], k = args[3];
                  fillColor = [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y2) * (1 - k)];
                }
                break;
              case OPS.save:
                stateStack.push([...fillColor]);
                break;
              case OPS.restore:
                if (stateStack.length > 0) fillColor = stateStack.pop();
                break;
              case OPS.showText:
              case OPS.showSpacedText:
                // Record the fill color for this text operation
                textColors.push([...fillColor]);
                break;
            }
          }
        } catch (e) {
          console.warn("Could not extract text colors:", e);
        }

        // Build text items and assign colors
        let textOpIndex = 0;
        for (const item of textContent.items) {
          if (!item.str || !item.str.trim()) {
            // Even empty items correspond to text operations, advance counter
            textOpIndex++;
            continue;
          }
          const t = item.transform;
          // Skip rotated/skewed text
          if (Math.abs(t[1]) > 0.01 || Math.abs(t[2]) > 0.01) {
            textOpIndex++;
            continue;
          }

          const itemFontSize = Math.abs(t[3]) || Math.sqrt(t[0] * t[0] + t[1] * t[1]);
          if (itemFontSize < 1) {
            textOpIndex++;
            continue;
          }
          const x = t[4];
          // t[5] is the baseline from bottom of page; convert to top-of-text from top of page
          const y = viewport1.height - t[5] - itemFontSize;

          // Get color from operator list (0-1 range → hex)
          let color = "#000000";
          if (textColors.length > 0 && textOpIndex < textColors.length) {
            const c = textColors[textOpIndex];
            const r = Math.round(Math.min(1, Math.max(0, c[0])) * 255);
            const g = Math.round(Math.min(1, Math.max(0, c[1])) * 255);
            const b = Math.round(Math.min(1, Math.max(0, c[2])) * 255);
            color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
          }
          textOpIndex++;

          const styleInfo = textContent.styles[item.fontName] || {};
          const fontFamily = resolveFontFamily(styleInfo.fontFamily);
          const itemIsItalic = styleInfo.italic || false;
          const itemIsBold = item.fontName ? /bold|black|heavy/i.test(item.fontName) : false;

          extractedElements[pageIndex].push({
            type: "pdfText",
            text: item.str,
            originalText: item.str,
            x,
            y,
            originalX: x,
            originalY: y,
            fontSize: itemFontSize,
            originalFontSize: itemFontSize,
            color,
            originalColor: color,
            fontFamily,
            bold: itemIsBold,
            italic: itemIsItalic,
            underline: false,
            width: item.width || itemFontSize * item.str.length * 0.6,
            height: item.height || itemFontSize,
            modified: false,
          });
        }
      }

      setPdfPages(pages);
      setPageElements(extractedElements);
      if (pages.length > 0) {
        setPageDimensions({ width: pages[0].width, height: pages[0].height });
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
    }
  };

  const buildFontString = (el, scaleMul) => {
    const style = el.italic ? "italic" : "normal";
    const weight = el.bold ? "bold" : "normal";
    const fontConfig = FONT_FAMILIES[el.fontFamily] || FONT_FAMILIES["Open Sans"];
    return `${style} ${weight} ${el.fontSize * scaleMul}px ${fontConfig.cssFamily}`;
  };

  // ── Build HTML text layer with spans over PDF text ──────────────────────
  const buildTextLayer = useCallback(() => {
    const textLayerEl = textLayerRef.current;
    const canvas = canvasRef.current;
    if (!textLayerEl || !canvas || !canvas.width) return;

    const elements = pageElements[currentPage] || [];
    const scaleMul = scale * 1.5;

    // Size the text layer to match the canvas pixel buffer
    textLayerEl.style.width = `${canvas.width}px`;
    textLayerEl.style.height = `${canvas.height}px`;
    const cssScale = canvas.getBoundingClientRect().width / canvas.width;
    textLayerEl.style.transform = `scale(${cssScale})`;
    textLayerEl.style.transformOrigin = "top left";

    // Clear existing spans
    textLayerEl.innerHTML = "";

    const isToolActive = activeTool && activeTool !== "text";

    elements.forEach((el, idx) => {
      if (el.type !== "pdfText") return;

      const span = document.createElement("span");
      span.dataset.idx = String(idx);
      span.textContent = el.text;

      const left = el.x * scaleMul;
      const top = el.y * scaleMul;
      const fSize = el.fontSize * scaleMul;
      const width = el.width * scaleMul;
      const height = el.fontSize * scaleMul * 1.3;
      const fontConfig = FONT_FAMILIES[el.fontFamily] || FONT_FAMILIES["Liberation Sans"];

      span.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        font-size: ${fSize}px;
        line-height: 1.3;
        font-family: ${fontConfig.cssFamily};
        font-weight: ${el.bold ? "bold" : "normal"};
        font-style: ${el.italic ? "italic" : "normal"};
        color: transparent;
        white-space: pre;
        cursor: text;
        pointer-events: ${isToolActive ? "none" : "auto"};
        min-width: ${width}px;
        min-height: ${height}px;
        border-radius: 2px;
        transition: background 0.1s ease;
      `;

      // Modified text — show visibly
      if (el.modified) {
        span.style.color = el.color;
        if (el.underline) {
          span.style.textDecoration = "underline";
        }
      }

      // Editing state — single click enters edit mode directly
      if (editingSpanIndex === idx) {
        span.contentEditable = "true";
        span.style.color = el.color;
        // Use sampled background color so span blends with the page background
        // Canvas has a cover rect in the same color, so only the span text is visible
        const bgCol = el.bgColor || editingBgColor || "#ffffff";
        span.style.background = bgCol;
        span.style.outline = "2px solid #2563eb";
        span.style.outlineOffset = "1px";
        span.style.cursor = "text";
        span.style.caretColor = el.color === "#FFFFFF" || el.color === "#ffffff" ? "#2563eb" : el.color;
        span.style.zIndex = "10";
        span.style.minWidth = `${Math.max(width, fSize * 2)}px`;
        span.style.pointerEvents = "auto";
        if (el.underline) {
          span.style.textDecoration = "underline";
        }

        // Add delete button on editing span
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "&times;";
        deleteBtn.style.cssText = `
          position: absolute;
          top: -12px;
          right: -12px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #ff4444;
          color: #fff;
          border: 2px solid #fff;
          font-size: 14px;
          font-weight: bold;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          z-index: 20;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          padding: 0;
        `;
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleDeleteElement(currentPage, idx);
        });
        span.appendChild(deleteBtn);
      }

      textLayerEl.appendChild(span);
    });

    // Focus editing span after DOM update
    if (editingSpanIndex !== null) {
      requestAnimationFrame(() => {
        const editSpan = textLayerEl.querySelector(`span[data-idx="${editingSpanIndex}"]`);
        if (editSpan && document.activeElement !== editSpan) {
          editSpan.focus();
          // Select all text for easy editing
          const range = document.createRange();
          range.selectNodeContents(editSpan);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    }
  }, [currentPage, pageElements, scale, editingSpanIndex, activeTool, editingBgColor]);

  // ── Canvas rendering ──────────────────────────────────────────────────
  const renderCurrentPage = useCallback(() => {
    if (renderingRef.current) return;
    renderingRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas || !pdfPages[currentPage]) {
      renderingRef.current = false;
      return;
    }

    const ctx = canvas.getContext("2d");
    const page = pdfPages[currentPage];

    canvas.width = page.width * scale;
    canvas.height = page.height * scale;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const elements = pageElements[currentPage] || [];
      elements.forEach((el, idx) => {
        // Skip rendering user-text that is being edited inline
        if (editingText && editingText.pageIndex === currentPage && editingText.elementIndex === idx) {
          return;
        }

        const isSelected =
          selectedElement !== null &&
          selectedElement.pageIndex === currentPage &&
          selectedElement.elementIndex === idx;

        if (el.type === "text") {
          const scaleMul = scale * 1.5;
          ctx.font = buildFontString(el, scaleMul);
          ctx.fillStyle = el.color;
          ctx.textBaseline = "top";

          const maxWidth = el.width ? el.width * scaleMul : canvas.width - el.x * scaleMul;
          const lines = wrapText(ctx, el.text, maxWidth);
          const lineHeight = el.fontSize * scaleMul * 1.3;

          lines.forEach((line, lineIdx) => {
            const lx = el.x * scaleMul;
            const ly = el.y * scaleMul + lineIdx * lineHeight;
            ctx.fillText(line, lx, ly);

            if (el.underline) {
              const metrics = ctx.measureText(line);
              ctx.strokeStyle = el.color;
              ctx.lineWidth = Math.max(1, el.fontSize * scaleMul * 0.05);
              ctx.beginPath();
              ctx.moveTo(lx, ly + el.fontSize * scaleMul * 1.05);
              ctx.lineTo(lx + metrics.width, ly + el.fontSize * scaleMul * 1.05);
              ctx.stroke();
            }
          });

          if (isSelected) {
            const totalHeight = lines.length * lineHeight;
            const measuredWidth = Math.max(
              ...lines.map((l) => ctx.measureText(l).width)
            );
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(
              el.x * scaleMul - 4,
              el.y * scaleMul - 4,
              measuredWidth + 8,
              totalHeight + 8
            );
            ctx.setLineDash([]);
            drawDeleteHandle(ctx, el.x * scaleMul + measuredWidth + 4, el.y * scaleMul - 12);
          }
        } else if (el.type === "eraser") {
          const sm = scale * 1.5;
          ctx.fillStyle = el.color || "#ffffff";
          ctx.fillRect(el.x * sm, el.y * sm, el.width * sm, el.height * sm);

          if (isSelected) {
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(el.x * sm - 2, el.y * sm - 2, el.width * sm + 4, el.height * sm + 4);
            ctx.setLineDash([]);
            drawResizeHandle(ctx, el.x * sm + el.width * sm, el.y * sm + el.height * sm);
            drawDeleteHandle(ctx, el.x * sm + el.width * sm + 4, el.y * sm - 12);
          }
        } else if (el.type === "image") {
          const elImg = new Image();
          elImg.onload = () => {
            ctx.drawImage(
              elImg,
              el.x * scale * 1.5,
              el.y * scale * 1.5,
              el.width * scale * 1.5,
              el.height * scale * 1.5
            );

            if (isSelected) {
              ctx.strokeStyle = "#2563eb";
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 3]);
              ctx.strokeRect(
                el.x * scale * 1.5 - 4,
                el.y * scale * 1.5 - 4,
                el.width * scale * 1.5 + 8,
                el.height * scale * 1.5 + 8
              );
              ctx.setLineDash([]);
              drawResizeHandle(
                ctx,
                el.x * scale * 1.5 + el.width * scale * 1.5,
                el.y * scale * 1.5 + el.height * scale * 1.5
              );
              drawDeleteHandle(
                ctx,
                el.x * scale * 1.5 + el.width * scale * 1.5 + 4,
                el.y * scale * 1.5 - 12
              );
            }
          };
          elImg.src = el.dataUrl;
        } else if (el.type === "pdfText") {
          // Draw cover rect for BOTH modified AND currently-editing text
          // This hides the canvas-rendered text so only the HTML span is visible
          const isBeingEdited = editingSpanIndex === idx;
          if (!el.modified && !isBeingEdited) return;

          const scaleMul = scale * 1.5;
          const pad = 2;
          // Use stored bgColor if available (sampled background), otherwise white
          const coverColor = el.bgColor || "#ffffff";
          ctx.fillStyle = coverColor;
          ctx.fillRect(
            (el.originalX - pad) * scaleMul,
            (el.originalY - pad) * scaleMul,
            (el.width + pad * 2) * scaleMul,
            (el.originalFontSize * 1.3 + pad * 2) * scaleMul
          );
          // Text is shown by the HTML text layer span, not canvas
        }
      });

      renderingRef.current = false;
    };
    img.src = page.imageData;
  }, [currentPage, pageElements, selectedElement, pdfPages, scale, editingText, editingSpanIndex]);

  const drawDeleteHandle = (ctx, x, y) => {
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.moveTo(x + 4, y - 4);
    ctx.lineTo(x - 4, y + 4);
    ctx.stroke();
  };

  const drawResizeHandle = (ctx, x, y) => {
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(x - 6, y - 6, 12, 12);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 6, y - 6, 12, 12);
  };

  const wrapText = (ctx, text, maxWidth) => {
    if (!text) return [""];
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // ── Sample background color from canvas at a text position ───────────
  const sampleBackgroundColor = useCallback((el) => {
    const canvas = canvasRef.current;
    if (!canvas) return "#ffffff";
    const ctx = canvas.getContext("2d");
    const scaleMul = scale * 1.5;
    // Sample a small strip above and below the text baseline area
    const x = Math.round(el.x * scaleMul);
    const y = Math.round(el.y * scaleMul);
    const w = Math.round((el.width || el.fontSize * el.text.length * 0.6) * scaleMul);
    const h = Math.round(el.fontSize * scaleMul * 1.3);

    if (w <= 0 || h <= 0 || x < 0 || y < 0) return "#ffffff";

    // Sample a few pixels from the left edge of the text area (likely background, not text)
    // We'll sample from the top-left corner area which is less likely to contain text
    const samplePoints = [];
    // Sample from top edge (above text baseline)
    for (let sx = x; sx < Math.min(x + 5, canvas.width); sx++) {
      if (y >= 0 && y < canvas.height) samplePoints.push({ x: sx, y: y });
    }
    // Sample from left edge
    for (let sy = y; sy < Math.min(y + Math.min(h, 5), canvas.height); sy++) {
      if (x >= 0 && x < canvas.width) samplePoints.push({ x: x, y: sy });
    }
    // Also sample a few pixels to the right of the text area (likely pure background)
    const rightX = Math.min(x + w + 2, canvas.width - 1);
    for (let sy = y; sy < Math.min(y + Math.min(h, 5), canvas.height); sy++) {
      if (rightX >= 0 && rightX < canvas.width) samplePoints.push({ x: rightX, y: sy });
    }

    if (samplePoints.length === 0) return "#ffffff";

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (const pt of samplePoints) {
      try {
        const pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
        rSum += pixel[0];
        gSum += pixel[1];
        bSum += pixel[2];
        count++;
      } catch (e) { /* canvas security error, ignore */ }
    }

    if (count === 0) return "#ffffff";

    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }, [scale]);

  // ── Canvas coordinate conversion ──────────────────────────────────────
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: ((e.clientX - rect.left) * scaleX) / (scale * 1.5),
      y: ((e.clientY - rect.top) * scaleY) / (scale * 1.5),
    };
  };

  // Find non-pdfText elements at position (pdfText is handled by text layer)
  const findElementAtPosition = (x, y) => {
    const elements = pageElements[currentPage] || [];
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === "text") {
        const textWidth = el.width || 200;
        const textHeight = el.fontSize * 2;
        if (x >= el.x && x <= el.x + textWidth && y >= el.y && y <= el.y + textHeight) {
          return { pageIndex: currentPage, elementIndex: i };
        }
      } else if (el.type === "eraser" || el.type === "image") {
        if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
          return { pageIndex: currentPage, elementIndex: i };
        }
      }
    }
    return null;
  };

  const isOnDeleteHandle = (x, y, el) => {
    let handleX, handleY;
    if (el.type === "text") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.font = buildFontString(el, 1.5);
      const textWidth = ctx.measureText(el.text).width / 1.5;
      handleX = el.x + textWidth + 4 / 1.5;
      handleY = el.y - 12 / 1.5;
    } else {
      handleX = el.x + el.width + 4 / 1.5;
      handleY = el.y - 12 / 1.5;
    }
    const dist = Math.sqrt((x - handleX) ** 2 + (y - handleY) ** 2);
    return dist < 15;
  };

  const isOnResizeHandle = (x, y, el) => {
    if (el.type !== "image" && el.type !== "eraser") return false;
    const handleX = el.x + el.width;
    const handleY = el.y + el.height;
    return Math.abs(x - handleX) < 10 && Math.abs(y - handleY) < 10;
  };

  // ── Canvas mouse/touch handlers (for non-pdfText elements) ────────────
  const handleCanvasMouseDown = (e) => {
    if (editingText) return;
    const { x, y } = getCanvasCoordinates(e);

    if (selectedElement) {
      const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
      if (el && el.type !== "pdfText" && isOnDeleteHandle(x, y, el)) {
        handleDeleteElement(selectedElement.pageIndex, selectedElement.elementIndex);
        return;
      }
      if (el && isOnResizeHandle(x, y, el)) {
        setIsResizing(true);
        setDragOffset({ x: el.width, y: el.height });
        return;
      }
    }

    const found = findElementAtPosition(x, y);
    if (found) {
      const el = (pageElements[found.pageIndex] || [])[found.elementIndex];
      setSelectedElement(found);
      // Don't clear editingSpanIndex here — blur handler on contentEditable span
      // will fire when focus leaves, committing changes and clearing editingSpanIndex
      setIsDragging(true);
      setDragOffset({ x: x - el.x, y: y - el.y });
    } else {
      setSelectedElement(null);
      // Don't clear editingSpanIndex here — let blur handler do it
      if (activeTool === "text" && textInput.trim()) {
        addTextElement(x, y);
      } else if (activeTool === "eraser") {
        addEraserElement(x, y);
      } else if (activeTool === "signature" && signatureReady) {
        placeSignatureOnCanvas(x, y);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && selectedElement) {
      const { x, y } = getCanvasCoordinates(e);
      updateElementPosition(selectedElement.pageIndex, selectedElement.elementIndex, x - dragOffset.x, y - dragOffset.y);
      return;
    }
    if (isResizing && selectedElement) {
      const { x, y } = getCanvasCoordinates(e);
      const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
      if (el && (el.type === "image" || el.type === "eraser")) {
        const newWidth = Math.max(20, x - el.x);
        if (el.type === "image") {
          const aspectRatio = el.originalHeight / el.originalWidth;
          const newHeight = newWidth * aspectRatio;
          updateElementSize(selectedElement.pageIndex, selectedElement.elementIndex, newWidth, newHeight);
        } else {
          const newHeight = Math.max(10, y - el.y);
          updateElementSize(selectedElement.pageIndex, selectedElement.elementIndex, newWidth, newHeight);
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleCanvasDoubleClick = (e) => {
    // Only handle double-click for user-added text elements
    const { x, y } = getCanvasCoordinates(e);
    const found = findElementAtPosition(x, y);
    if (found) {
      const el = (pageElements[found.pageIndex] || [])[found.elementIndex];
      if (el && el.type === "text") {
        setEditingText(found);
        setSelectedElement(null);
        setActiveTool(null);
        return;
      }
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleCanvasMouseUp();
  };

  // ── Text layer event handlers ─────────────────────────────────────────
  const handleTextLayerClick = useCallback((e) => {
    // Don't interfere with delete button clicks
    if (e.target.tagName === "BUTTON") return;
    // If a drag just occurred, skip (don't enter edit mode after drag)
    if (dragOccurredRef.current) { dragOccurredRef.current = false; return; }

    const span = e.target.closest("span[data-idx]");
    if (!span) return;
    e.preventDefault();
    e.stopPropagation();
    const idx = parseInt(span.dataset.idx);
    const el = (pageElements[currentPage] || [])[idx];
    if (!el) return;

    // If already editing this span, let browser handle cursor placement
    if (editingSpanIndex === idx) return;

    // Sample background color from canvas BEFORE we draw the cover rect
    // For modified text, use previously stored bgColor; for unmodified, sample now
    if (!el.modified) {
      const sampledBg = sampleBackgroundColor(el);
      setEditingBgColor(sampledBg);
      // Store the sampled bg color on the element so cover rect can use it
      setPageElements((prev) => {
        const elements = [...(prev[currentPage] || [])];
        elements[idx] = { ...elements[idx], bgColor: sampledBg };
        return { ...prev, [currentPage]: elements };
      });
    } else {
      setEditingBgColor(el.bgColor || "#ffffff");
    }

    // Single click enters edit mode directly (Sejda-style)
    setEditingSpanIndex(idx);
    setSelectedElement(null);
    setEditingText(null);
    setActiveTool(null);

    // Load font properties into toolbar
    setFontSize(el.fontSize);
    setFontColor(el.color);
    setIsBold(el.bold || false);
    setIsItalic(el.italic || false);
    setIsUnderline(el.underline || false);
    setSelectedFontFamily(el.fontFamily || "Liberation Sans");
  }, [currentPage, pageElements, editingSpanIndex, sampleBackgroundColor]);

  const blurTimeoutRef = useRef(null);

  // Refocus the editing span after toolbar interaction completes
  const refocusEditingSpan = useCallback(() => {
    const textLayerEl = textLayerRef.current;
    if (!textLayerEl || editingSpanIndex === null) return;
    const editSpan = textLayerEl.querySelector(`span[data-idx="${editingSpanIndex}"]`);
    if (editSpan && editSpan.isConnected) editSpan.focus();
  }, [editingSpanIndex]);

  const handleTextLayerBlur = useCallback((e) => {
    if (editingSpanIndex === null) return;
    const span = e.target.closest("span[data-idx]");
    if (!span) return;
    const idx = parseInt(span.dataset.idx);
    if (idx !== editingSpanIndex) return;

    // Delay the commit — if the user clicked on toolbar controls (bold, font, color, etc.)
    // the toolbarClickRef will be true and we keep editing mode alive.
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);

    blurTimeoutRef.current = setTimeout(() => {
      // If mousedown happened in toolbar area, keep editing mode alive
      if (toolbarClickRef.current) {
        toolbarClickRef.current = false;
        // Check what element has focus — if it's an interactive element (select, input)
        // let it keep focus and don't refocus the span (would close the dropdown).
        // The span will be refocused when the toolbar interaction finishes.
        const active = document.activeElement;
        const tag = active ? active.tagName : "";
        if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") {
          // Don't refocus — let the interactive element do its thing.
          // Span will be refocused via onChange handlers or when the element blurs.
          return;
        }
        // For buttons and other non-interactive clicks, refocus the span immediately
        if (span.isConnected) span.focus();
        return;
      }

      const newText = span.textContent.replace(/\u00d7$/, ""); // strip × from delete btn if present
      const el = (pageElements[currentPage] || [])[idx];
      if (!el) return;

      // Compare against originalText to determine if truly changed from source
      if (newText !== el.originalText) {
        setPageElements((prev) => {
          const elements = [...(prev[currentPage] || [])];
          elements[idx] = { ...elements[idx], text: newText, modified: true };
          return { ...prev, [currentPage]: elements };
        });
      } else if (!el.modified) {
        // Text matches original and wasn't modified by toolbar — clean up bgColor
        // so the canvas cover rect disappears and original rendering shows through
        setPageElements((prev) => {
          const elements = [...(prev[currentPage] || [])];
          const { bgColor, ...rest } = elements[idx];
          elements[idx] = rest;
          return { ...prev, [currentPage]: elements };
        });
      }

      setEditingSpanIndex(null);
    }, 100);
  }, [editingSpanIndex, currentPage, pageElements]);

  const handleTextLayerKeyDown = useCallback((e) => {
    if (e.key === "Escape" && editingSpanIndex !== null) {
      e.preventDefault();
      // Cancel any pending blur commit
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      const span = e.target.closest("span[data-idx]");
      if (span) {
        const el = (pageElements[currentPage] || [])[editingSpanIndex];
        if (el) {
          span.textContent = el.text;
          // If text was not modified, remove bgColor so canvas cover disappears
          if (!el.modified) {
            setPageElements((prev) => {
              const elements = [...(prev[currentPage] || [])];
              const { bgColor, ...rest } = elements[editingSpanIndex];
              elements[editingSpanIndex] = rest;
              return { ...prev, [currentPage]: elements };
            });
          }
        }
      }
      setEditingSpanIndex(null);
    }
  }, [editingSpanIndex, currentPage, pageElements]);

  // Drag-to-move for pdfText spans (only modified elements can be dragged)
  const handleTextLayerMouseDown = useCallback((e) => {
    const span = e.target.closest("span[data-idx]");
    if (!span) return;
    // Don't interfere with delete button
    if (e.target.tagName === "BUTTON") return;

    const idx = parseInt(span.dataset.idx);
    // If this span is currently being edited, let browser handle text selection
    if (editingSpanIndex === idx) return;

    const el = (pageElements[currentPage] || [])[idx];
    if (!el) return;
    // Only allow drag for modified elements (unmodified go straight to edit on click)
    if (!el.modified) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origElX = el.x;
    const origElY = el.y;
    let moved = false;

    const canvasRect = canvas.getBoundingClientRect();
    const cssScaleVal = canvasRect.width / canvas.width;
    const scaleMul = scale * 1.5;

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / (cssScaleVal * scaleMul);
      const dy = (moveEvent.clientY - startY) / (cssScaleVal * scaleMul);
      if (Math.abs(moveEvent.clientX - startX) > 3 || Math.abs(moveEvent.clientY - startY) > 3) {
        moved = true;
        dragOccurredRef.current = true;
      }
      if (moved) {
        updateElementPosition(currentPage, idx, origElX + dx, origElY + dy);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [currentPage, pageElements, scale, editingSpanIndex]);

  // ── Element management ────────────────────────────────────────────────
  const addTextElement = (x, y) => {
    const newElement = {
      type: "text",
      text: textInput,
      x,
      y,
      fontSize,
      color: fontColor,
      fontFamily: selectedFontFamily,
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      width: 200,
    };
    setPageElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));
    setTextInput("");
  };

  const addEraserElement = (x, y) => {
    const newElement = {
      type: "eraser",
      x: x - eraserWidth / 2,
      y: y - eraserHeight / 2,
      width: eraserWidth,
      height: eraserHeight,
      color: eraserColor,
    };
    setPageElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));
  };

  const addImageElement = (dataUrl, width, height) => {
    const maxWidth = 200;
    const scaleFactor = width > maxWidth ? maxWidth / width : 1;
    const newElement = {
      type: "image",
      dataUrl,
      x: 50,
      y: 50,
      width: width * scaleFactor,
      height: height * scaleFactor,
      originalWidth: width * scaleFactor,
      originalHeight: height * scaleFactor,
    };
    setPageElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));
  };

  const placeSignatureOnCanvas = (x, y) => {
    const signCanvas = signCanvasRef.current;
    if (!signCanvas) return;
    const dataUrl = signCanvas.toDataURL("image/png");
    const maxWidth = 150;
    const aspect = signCanvas.height / signCanvas.width;
    const newElement = {
      type: "image",
      dataUrl,
      x: x - maxWidth / 2,
      y: y - (maxWidth * aspect) / 2,
      width: maxWidth,
      height: maxWidth * aspect,
      originalWidth: maxWidth,
      originalHeight: maxWidth * aspect,
    };
    setPageElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));
    const ctx = signCanvas.getContext("2d");
    ctx.clearRect(0, 0, signCanvas.width, signCanvas.height);
    setSignatureReady(false);
    setActiveTool(null);
  };

  const updateElementPosition = (pageIndex, elementIndex, x, y) => {
    setPageElements((prev) => {
      const elements = [...(prev[pageIndex] || [])];
      const el = elements[elementIndex];
      const updates = { x, y };
      if (el.type === "pdfText") updates.modified = true;
      elements[elementIndex] = { ...el, ...updates };
      return { ...prev, [pageIndex]: elements };
    });
  };

  const updateElementSize = (pageIndex, elementIndex, width, height) => {
    setPageElements((prev) => {
      const elements = [...(prev[pageIndex] || [])];
      elements[elementIndex] = { ...elements[elementIndex], width, height };
      return { ...prev, [pageIndex]: elements };
    });
  };

  const updateSelectedTextProp = (prop, value) => {
    if (!selectedElement) return;
    const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
    if (!el || (el.type !== "text" && el.type !== "pdfText")) return;
    setPageElements((prev) => {
      const elements = [...(prev[selectedElement.pageIndex] || [])];
      const cur = elements[selectedElement.elementIndex];
      const updates = { [prop]: value };
      if (cur.type === "pdfText") updates.modified = true;
      elements[selectedElement.elementIndex] = { ...cur, ...updates };
      return { ...prev, [selectedElement.pageIndex]: elements };
    });
  };

  // Update property on the currently editing pdfText span
  const updateEditingSpanProp = (prop, value) => {
    if (editingSpanIndex === null) return;
    setPageElements((prev) => {
      const elements = [...(prev[currentPage] || [])];
      const cur = elements[editingSpanIndex];
      if (!cur || cur.type !== "pdfText") return prev;
      elements[editingSpanIndex] = { ...cur, [prop]: value, modified: true };
      return { ...prev, [currentPage]: elements };
    });
  };

  const handleDeleteElement = (pageIndex, elementIndex) => {
    setPageElements((prev) => {
      const elements = [...(prev[pageIndex] || [])];
      elements.splice(elementIndex, 1);
      return { ...prev, [pageIndex]: elements };
    });
    setSelectedElement(null);
    setEditingSpanIndex(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => { addImageElement(reader.result, img.width, img.height); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Signature canvas drawing ──────────────────────────────────────────
  const getSignCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    }
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleSignMouseDown = (e) => {
    e.preventDefault();
    signDrawingRef.current = true;
    const canvas = signCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getSignCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastSignPoint.current = { x, y };
  };

  const handleSignMouseMove = (e) => {
    e.preventDefault();
    if (!signDrawingRef.current) return;
    const canvas = signCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getSignCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastSignPoint.current = { x, y };
  };

  const handleSignMouseUp = (e) => {
    e.preventDefault();
    signDrawingRef.current = false;
    lastSignPoint.current = null;
    const canvas = signCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasContent = data.some((v, i) => i % 4 === 3 && v > 0);
    setSignatureReady(hasContent);
  };

  const clearSignatureCanvas = () => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureReady(false);
  };

  // ── Eraser color picker canvas ─────────────────────────────────────────
  useEffect(() => {
    if (!showEraserColorPicker || !eraserColorCanvasRef.current) return;
    const canvas = eraserColorCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `hsl(${hue}, 100%, 100%)`);
      gradient.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 0%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 1, h);
    }
  }, [showEraserColorPicker]);

  const handleEraserColorCanvasClick = (e) => {
    const canvas = eraserColorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const ctx = canvas.getContext("2d");
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`.toUpperCase();
    setEraserColor(hex);
    setEraserHexInput(hex);
  };

  const handleEraserHexInputChange = (val) => {
    setEraserHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setEraserColor(val.toUpperCase());
    }
  };

  const handleEraserColorQuickPick = (c) => {
    setEraserColor(c);
    setEraserHexInput(c);
    setShowEraserColorPicker(false);
  };

  // ── Color picker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showColorPicker || !colorCanvasRef.current) return;
    const canvas = colorCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `hsl(${hue}, 100%, 100%)`);
      gradient.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 0%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 1, h);
    }
  }, [showColorPicker]);

  const handleColorCanvasClick = (e) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const ctx = canvas.getContext("2d");
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`.toUpperCase();
    setFontColor(hex);
    if (selectedElement) updateSelectedTextProp("color", hex);
    if (editingSpanIndex !== null) {
      updateEditingSpanProp("color", hex);
      setTimeout(refocusEditingSpan, 50);
    }
  };

  const handleHexInputChange = (val) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setFontColor(val.toUpperCase());
      if (selectedElement) updateSelectedTextProp("color", val.toUpperCase());
      if (editingSpanIndex !== null) updateEditingSpanProp("color", val.toUpperCase());
    }
  };

  const handleColorQuickPick = (c) => {
    setFontColor(c);
    setShowColorPicker(false);
    if (selectedElement) updateSelectedTextProp("color", c);
    if (editingSpanIndex !== null) {
      updateEditingSpanProp("color", c);
      setTimeout(refocusEditingSpan, 50);
    }
  };

  const toggleBold = () => {
    const newVal = !isBold;
    setIsBold(newVal);
    if (selectedElement) updateSelectedTextProp("bold", newVal);
    if (editingSpanIndex !== null) updateEditingSpanProp("bold", newVal);
  };

  const toggleItalic = () => {
    const newVal = !isItalic;
    setIsItalic(newVal);
    if (selectedElement) updateSelectedTextProp("italic", newVal);
    if (editingSpanIndex !== null) updateEditingSpanProp("italic", newVal);
  };

  const toggleUnderline = () => {
    const newVal = !isUnderline;
    setIsUnderline(newVal);
    if (selectedElement) updateSelectedTextProp("underline", newVal);
    if (editingSpanIndex !== null) updateEditingSpanProp("underline", newVal);
  };

  const handleFontSizeChange = (val) => {
    const newSize = parseInt(val) || 16;
    setFontSize(newSize);
    if (selectedElement) updateSelectedTextProp("fontSize", newSize);
    if (editingSpanIndex !== null) {
      updateEditingSpanProp("fontSize", newSize);
      setTimeout(refocusEditingSpan, 50);
    }
  };

  const handleFontFamilyChange = (family) => {
    setSelectedFontFamily(family);
    if (selectedElement) updateSelectedTextProp("fontFamily", family);
    if (editingSpanIndex !== null) {
      updateEditingSpanProp("fontFamily", family);
      setTimeout(refocusEditingSpan, 50);
    }
  };

  // ── Save PDF ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isProcessing) return;

    // Commit any active text layer edit
    if (editingSpanIndex !== null) {
      const textLayerEl = textLayerRef.current;
      if (textLayerEl) {
        const span = textLayerEl.querySelector(`span[data-idx="${editingSpanIndex}"]`);
        if (span) {
          const newText = span.textContent;
          const el = (pageElements[currentPage] || [])[editingSpanIndex];
          if (el && newText !== el.text) {
            setPageElements((prev) => {
              const elements = [...(prev[currentPage] || [])];
              elements[editingSpanIndex] = { ...elements[editingSpanIndex], text: newText, modified: true };
              return { ...prev, [currentPage]: elements };
            });
          }
        }
      }
      setEditingSpanIndex(null);
    }
    if (editingText) setEditingText(null);

    setIsProcessing(true);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const fontkit = (await import("@pdf-lib/fontkit")).default;
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Dynamic font loading with cache
      const fontCache = {};
      const getFontForElement = async (el) => {
        const family = el.fontFamily || "Open Sans";
        const variant = el.bold && el.italic ? "boldItalic"
          : el.bold ? "bold"
          : el.italic ? "italic"
          : "regular";
        const cacheKey = `${family}-${variant}`;
        if (fontCache[cacheKey]) return fontCache[cacheKey];

        const config = FONT_FAMILIES[family] || FONT_FAMILIES["Liberation Sans"];
        const url = config[variant] || config.regular;
        try {
          const bytes = await fetch(url).then((r) => r.arrayBuffer());
          const font = await pdfDoc.embedFont(bytes, { subset: true });
          fontCache[cacheKey] = font;
          return font;
        } catch (e) {
          console.warn(`Font load failed for ${cacheKey}, falling back`, e);
          if (!fontCache["Liberation Sans-regular"]) {
            const bytes = await fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer());
            fontCache["Liberation Sans-regular"] = await pdfDoc.embedFont(bytes, { subset: true });
          }
          return fontCache["Liberation Sans-regular"];
        }
      };

      const pages = pdfDoc.getPages();

      for (const [pageIndexStr, elements] of Object.entries(pageElements)) {
        const pageIndex = parseInt(pageIndexStr);
        if (pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        const renderPage = pdfPages[pageIndex];
        if (!renderPage) continue;

        const scaleFactorX = pdfWidth / (renderPage.width / 1.5);
        const scaleFactorY = pdfHeight / (renderPage.height / 1.5);

        for (const el of elements) {
          if (el.type === "pdfText") {
            if (!el.modified) continue;

            // Cover over original text position using sampled background color
            const coverX = el.originalX * scaleFactorX;
            const coverH = el.originalFontSize * scaleFactorY * 1.4;
            const coverY = pdfHeight - el.originalY * scaleFactorY - coverH;
            const coverW = (el.width + 4) * scaleFactorX;
            const bgHex = (el.bgColor || "#ffffff").replace("#", "");
            const bgR = parseInt(bgHex.substring(0, 2), 16) / 255;
            const bgG = parseInt(bgHex.substring(2, 4), 16) / 255;
            const bgB = parseInt(bgHex.substring(4, 6), 16) / 255;
            page.drawRectangle({
              x: coverX - 1,
              y: coverY - 1,
              width: coverW + 2,
              height: coverH + 2,
              color: rgb(bgR, bgG, bgB),
            });

            // Draw new text
            if (el.text.trim()) {
              const font = await getFontForElement(el);
              const pdfFontSize = el.fontSize * scaleFactorX;
              const pdfX = el.x * scaleFactorX;
              const pdfY = pdfHeight - el.y * scaleFactorY - pdfFontSize;
              const hex = (el.color || "#000000").replace("#", "");
              const cr = parseInt(hex.substring(0, 2), 16) / 255;
              const cg = parseInt(hex.substring(2, 4), 16) / 255;
              const cb = parseInt(hex.substring(4, 6), 16) / 255;
              page.drawText(el.text, { x: pdfX, y: pdfY, size: pdfFontSize, font, color: rgb(cr, cg, cb) });
            }
          } else if (el.type === "text") {
            const font = await getFontForElement(el);
            const pdfFontSize = el.fontSize * scaleFactorX;
            const pdfX = el.x * scaleFactorX;
            const pdfY = pdfHeight - el.y * scaleFactorY - pdfFontSize;
            const hex = el.color.replace("#", "");
            const cr = parseInt(hex.substring(0, 2), 16) / 255;
            const cg = parseInt(hex.substring(2, 4), 16) / 255;
            const cb = parseInt(hex.substring(4, 6), 16) / 255;
            page.drawText(el.text, { x: pdfX, y: pdfY, size: pdfFontSize, font, color: rgb(cr, cg, cb) });
            if (el.underline) {
              const textWidth = font.widthOfTextAtSize(el.text, pdfFontSize);
              const lineY = pdfY - pdfFontSize * 0.1;
              page.drawLine({
                start: { x: pdfX, y: lineY },
                end: { x: pdfX + textWidth, y: lineY },
                thickness: Math.max(0.5, pdfFontSize * 0.05),
                color: rgb(cr, cg, cb),
              });
            }
          } else if (el.type === "eraser") {
            const pdfX = el.x * scaleFactorX;
            const pdfY = pdfHeight - el.y * scaleFactorY - el.height * scaleFactorY;
            const eraserHex = (el.color || "#ffffff").replace("#", "");
            const er = parseInt(eraserHex.substring(0, 2), 16) / 255;
            const eg = parseInt(eraserHex.substring(2, 4), 16) / 255;
            const eb = parseInt(eraserHex.substring(4, 6), 16) / 255;
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: el.width * scaleFactorX,
              height: el.height * scaleFactorY,
              color: rgb(er, eg, eb),
            });
          } else if (el.type === "image") {
            let embeddedImage;
            const response = await fetch(el.dataUrl);
            const imageBytes = await response.arrayBuffer();
            try {
              if (el.dataUrl.includes("image/png") || el.dataUrl.includes(".png")) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
              } else {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
              }
            } catch {
              try { embeddedImage = await pdfDoc.embedPng(imageBytes); }
              catch { embeddedImage = await pdfDoc.embedJpg(imageBytes); }
            }
            const pdfX = el.x * scaleFactorX;
            const pdfY = pdfHeight - el.y * scaleFactorY - el.height * scaleFactorY;
            page.drawImage(embeddedImage, {
              x: pdfX, y: pdfY,
              width: el.width * scaleFactorX,
              height: el.height * scaleFactorY,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const newName = fileName ? fileName.replace(/\.pdf$/i, "_edited.pdf") : "edited.pdf";
      const link = document.createElement("a");
      link.download = newName;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      if (onSave) onSave(blob);
    } catch (err) {
      console.error("Error saving PDF:", err);
      alert("Error processing PDF: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Inline text edit helpers (for user-added "text" elements only)
  const getTextEditStyle = () => {
    if (!editingText) return {};
    const el = (pageElements[editingText.pageIndex] || [])[editingText.elementIndex];
    if (!el || el.type !== "text") return {};
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return {};
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const cssScaleX = canvasRect.width / canvas.width;
    const left = (canvasRect.left - containerRect.left + container.scrollLeft) + el.x * scale * 1.5 * cssScaleX;
    const top = (canvasRect.top - containerRect.top + container.scrollTop) + el.y * scale * 1.5 * cssScaleX;
    const fSize = el.fontSize * scale * 1.5 * cssScaleX;
    const width = (el.width || 200) * scale * 1.5 * cssScaleX;
    const fontConfig = FONT_FAMILIES[el.fontFamily] || FONT_FAMILIES["Open Sans"];
    return {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      fontSize: `${fSize}px`,
      lineHeight: "1.3",
      fontFamily: fontConfig.cssFamily,
      fontWeight: el.bold ? "bold" : "normal",
      fontStyle: el.italic ? "italic" : "normal",
      color: el.color,
      width: `${Math.max(width, fSize * 3)}px`,
      minHeight: `${fSize * 1.5}px`,
    };
  };

  const handleEditingTextChange = (newText) => {
    if (!editingText) return;
    setPageElements((prev) => {
      const elements = [...(prev[editingText.pageIndex] || [])];
      elements[editingText.elementIndex] = { ...elements[editingText.elementIndex], text: newText };
      return { ...prev, [editingText.pageIndex]: elements };
    });
  };

  const finishEditing = () => {
    if (!editingText) return;
    const el = (pageElements[editingText.pageIndex] || [])[editingText.elementIndex];
    if (el && !el.text.trim()) {
      handleDeleteElement(editingText.pageIndex, editingText.elementIndex);
    }
    setEditingText(null);
  };

  const hasModifiedContent = Object.values(pageElements).some((els) =>
    els.some((el) => el.type !== "pdfText" || (el.type === "pdfText" && el.modified))
  );
  const selectedTextEl = selectedElement
    ? (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex]
    : null;
  const isTextSelected = selectedTextEl && (selectedTextEl.type === "text" || selectedTextEl.type === "pdfText");

  return (
    <div className={styles.editor_wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar} onMouseDown={() => { toolbarClickRef.current = true; }}>
        <div className={styles.toolbar_group}>
          {/* Text tool */}
          <button
            className={`${styles.tool_btn} ${activeTool === "text" ? styles.active : ""}`}
            onClick={() => { setActiveTool(activeTool === "text" ? null : "text"); setSelectedElement(null); setEditingSpanIndex(null); }}
            title={t("edit-pdf:add_text")}
          >
            <Fonts size={18} />
            <span className={styles.tool_label}>{t("edit-pdf:add_text")}</span>
          </button>

          {/* Image tool */}
          <button
            className={`${styles.tool_btn} ${activeTool === "image" ? styles.active : ""}`}
            onClick={() => { setActiveTool("image"); fileInputRef.current?.click(); }}
            title={t("edit-pdf:add_image")}
          >
            <ImageFill size={18} />
            <span className={styles.tool_label}>{t("edit-pdf:add_image")}</span>
          </button>

          {/* Eraser tool */}
          <button
            className={`${styles.tool_btn} ${activeTool === "eraser" ? styles.active : ""}`}
            onClick={() => { setActiveTool(activeTool === "eraser" ? null : "eraser"); setSelectedElement(null); setEditingSpanIndex(null); }}
            title={t("edit-pdf:add_eraser")}
          >
            <EraserFill size={18} />
            <span className={styles.tool_label}>{t("edit-pdf:add_eraser")}</span>
          </button>

          {/* Signature tool */}
          <button
            className={`${styles.tool_btn} ${activeTool === "signature" ? styles.active : ""}`}
            onClick={() => { setActiveTool(activeTool === "signature" ? null : "signature"); setSelectedElement(null); setEditingSpanIndex(null); }}
            title={t("edit-pdf:add_signature")}
          >
            <PenFill size={18} />
            <span className={styles.tool_label}>{t("edit-pdf:add_signature")}</span>
          </button>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleImageUpload} style={{ display: "none" }} />
        </div>

        {/* Text options */}
        {(activeTool === "text" || isTextSelected || editingSpanIndex !== null) && (
          <div className={styles.text_options}>
            {activeTool === "text" && !isTextSelected && editingSpanIndex === null && (
              <input
                type="text"
                className={styles.text_input}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t("edit-pdf:type_text_here")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && textInput.trim()) {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      addTextElement(canvas.width / (scale * 1.5) / 2 - 50, canvas.height / (scale * 1.5) / 2);
                    }
                  }
                }}
              />
            )}
            <div className={styles.text_controls}>
              <select
                className={styles.font_select}
                value={selectedFontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
              >
                <optgroup label="Sans-serif">
                  <option value="Open Sans">Open Sans</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Inter">Inter</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Nunito">Nunito</option>
                  <option value="Noto Sans">Noto Sans</option>
                  <option value="Source Sans 3">Source Sans</option>
                  <option value="Fira Sans">Fira Sans</option>
                  <option value="Raleway">Raleway</option>
                  <option value="PT Sans">PT Sans</option>
                  <option value="Barlow">Barlow</option>
                  <option value="Cabin">Cabin</option>
                  <option value="Archivo">Archivo</option>
                  <option value="Ubuntu">Ubuntu</option>
                  <option value="Quicksand">Quicksand</option>
                  <option value="Oswald">Oswald</option>
                  <option value="Comfortaa">Comfortaa</option>
                </optgroup>
                <optgroup label="Serif">
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Bitter">Bitter</option>
                  <option value="Tinos">Georgia / Tinos</option>
                  <option value="Liberation Serif">Times New Roman</option>
                </optgroup>
                <optgroup label="Monospace">
                  <option value="Liberation Mono">Courier New</option>
                </optgroup>
                <optgroup label="Display / Decorative">
                  <option value="Bebas Neue">Bebas Neue</option>
                  <option value="Dancing Script">Dancing Script</option>
                  <option value="Pacifico">Pacifico</option>
                </optgroup>
                <optgroup label="System">
                  <option value="Liberation Sans">Arial / Helvetica</option>
                  <option value="Calibri">Calibri</option>
                </optgroup>
              </select>
              <div className={styles.format_buttons}>
                <button className={`${styles.format_btn} ${isBold ? styles.format_active : ""}`} onClick={toggleBold} title="Bold"><TypeBold size={18} /></button>
                <button className={`${styles.format_btn} ${isItalic ? styles.format_active : ""}`} onClick={toggleItalic} title="Italic"><TypeItalic size={18} /></button>
                <button className={`${styles.format_btn} ${isUnderline ? styles.format_active : ""}`} onClick={toggleUnderline} title="Underline"><TypeUnderline size={18} /></button>
              </div>
              <label className={styles.control_label}>
                {t("edit-pdf:font_size")}:
                <input type="number" min="8" max="72" value={fontSize} onChange={(e) => handleFontSizeChange(e.target.value)} className={styles.number_input} />
              </label>
              <div className={styles.color_picker_wrapper}>
                <span className={styles.control_label}>{t("edit-pdf:color")}:</span>
                <button className={styles.color_preview} style={{ backgroundColor: fontColor }} onClick={() => setShowColorPicker(!showColorPicker)} title={t("edit-pdf:color")} />
                {showColorPicker && (
                  <div className={styles.color_dropdown}>
                    <canvas ref={colorCanvasRef} width={220} height={120} className={styles.color_canvas} onClick={handleColorCanvasClick} />
                    <div className={styles.color_quick_row}>
                      {["#000000","#FF0000","#FF8800","#FFCC00","#00CC00","#0088FF","#0000FF","#8800FF","#FFFFFF"].map((c) => (
                        <button key={c} className={styles.color_quick} style={{ backgroundColor: c }} onClick={() => handleColorQuickPick(c)} />
                      ))}
                    </div>
                    <div className={styles.hex_input_row}>
                      <span className={styles.hex_label}>HEX:</span>
                      <input type="text" className={styles.hex_input} value={hexInput} onChange={(e) => handleHexInputChange(e.target.value)} placeholder="#000000" maxLength={7} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {activeTool === "text" && !isTextSelected && editingSpanIndex === null && (
              <p className={styles.hint}>{t("edit-pdf:click_to_place")}</p>
            )}
            {editingSpanIndex !== null && (
              <p className={styles.hint}>{t("edit-pdf:editing_text_hint")}</p>
            )}
          </div>
        )}

        {/* Eraser size + color options */}
        {activeTool === "eraser" && (
          <div className={styles.text_options}>
            <div className={styles.text_controls}>
              <label className={styles.control_label}>
                W:
                <input type="number" min="10" max="500" value={eraserWidth} onChange={(e) => setEraserWidth(parseInt(e.target.value) || 80)} className={styles.number_input} />
              </label>
              <label className={styles.control_label}>
                H:
                <input type="number" min="10" max="300" value={eraserHeight} onChange={(e) => setEraserHeight(parseInt(e.target.value) || 30)} className={styles.number_input} />
              </label>
              <div className={styles.color_picker_wrapper}>
                <span className={styles.control_label}>{t("edit-pdf:eraser_color")}:</span>
                <button
                  className={styles.color_preview}
                  style={{ backgroundColor: eraserColor, border: eraserColor === "#ffffff" ? "2px solid #ccc" : `2px solid ${eraserColor}` }}
                  onClick={() => setShowEraserColorPicker(!showEraserColorPicker)}
                  title={t("edit-pdf:eraser_color")}
                />
                {showEraserColorPicker && (
                  <div className={styles.color_dropdown}>
                    <canvas ref={eraserColorCanvasRef} width={220} height={120} className={styles.color_canvas} onClick={handleEraserColorCanvasClick} />
                    <div className={styles.color_quick_row}>
                      {["#ffffff","#000000","#FF0000","#FF8800","#FFFF00","#00CC00","#0088FF","#CCCCCC","#FFF9C4"].map((c) => (
                        <button key={c} className={styles.color_quick} style={{ backgroundColor: c }} onClick={() => handleEraserColorQuickPick(c)} />
                      ))}
                    </div>
                    <div className={styles.hex_input_row}>
                      <span className={styles.hex_label}>HEX:</span>
                      <input type="text" className={styles.hex_input} value={eraserHexInput} onChange={(e) => handleEraserHexInputChange(e.target.value)} placeholder="#ffffff" maxLength={7} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className={styles.hint}>{t("edit-pdf:eraser_hint")}</p>
          </div>
        )}

        {/* Signature pad */}
        {activeTool === "signature" && (
          <div className={styles.signature_panel}>
            <canvas
              ref={signCanvasRef}
              width={320}
              height={100}
              className={styles.sign_canvas}
              onMouseDown={handleSignMouseDown}
              onMouseMove={handleSignMouseMove}
              onMouseUp={handleSignMouseUp}
              onMouseLeave={handleSignMouseUp}
              onTouchStart={handleSignMouseDown}
              onTouchMove={handleSignMouseMove}
              onTouchEnd={handleSignMouseUp}
            />
            <div className={styles.sign_actions}>
              <button className={styles.sign_clear_btn} onClick={clearSignatureCanvas}>{t("edit-pdf:clear_signature")}</button>
              {signatureReady && (
                <p className={styles.hint}>{t("edit-pdf:sign_hint")}</p>
              )}
            </div>
          </div>
        )}

        {/* Delete selected element */}
        {selectedElement && (
          <div className={styles.toolbar_group}>
            <button
              className={`${styles.tool_btn} ${styles.delete_btn}`}
              onClick={() => handleDeleteElement(selectedElement.pageIndex, selectedElement.elementIndex)}
              title={t("common:delete")}
            >
              <Trash size={18} />
              <span className={styles.tool_label}>{t("common:delete")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Canvas area with text layer overlay */}
      <div className={styles.canvas_container} ref={containerRef}>
        <div className={styles.page_wrapper} ref={pageWrapperRef}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDoubleClick={handleCanvasDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: isDragging ? "grabbing" : isResizing ? "nwse-resize" : activeTool === "text" ? "text" : activeTool === "eraser" ? "crosshair" : activeTool === "signature" && signatureReady ? "copy" : "default",
            }}
          />
          <div
            ref={textLayerRef}
            className={styles.text_layer}
            onClick={handleTextLayerClick}
            onBlur={handleTextLayerBlur}
            onKeyDown={handleTextLayerKeyDown}
            onMouseDown={handleTextLayerMouseDown}
          />
        </div>
        {editingText && (() => {
          const el = (pageElements[editingText.pageIndex] || [])[editingText.elementIndex];
          if (!el || el.type !== "text") return null;
          return (
            <textarea
              ref={textEditRef}
              className={styles.text_edit_overlay}
              style={getTextEditStyle()}
              value={el.text}
              onChange={(e) => handleEditingTextChange(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  finishEditing();
                }
              }}
              autoFocus
            />
          );
        })()}
      </div>

      {/* Page navigation */}
      <div className={styles.page_nav}>
        <div className={styles.zoom_controls}>
          <button className={styles.nav_btn} onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} title="Zoom out"><DashLg size={16} /></button>
          <span className={styles.zoom_label}>{Math.round(scale * 100)}%</span>
          <button className={styles.nav_btn} onClick={() => setScale((s) => Math.min(2, s + 0.1))} title="Zoom in"><PlusLg size={16} /></button>
        </div>
        <div className={styles.page_controls}>
          <button className={styles.nav_btn} onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}><ChevronLeft size={16} /></button>
          <span className={styles.page_label}>{t("edit-pdf:page")} {currentPage + 1} / {totalPages}</span>
          <button className={styles.nav_btn} onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}><ChevronRight size={16} /></button>
        </div>
        <button
          className={`${styles.save_btn} ${!hasModifiedContent || isProcessing ? styles.disabled : ""}`}
          onClick={handleSave}
          disabled={!hasModifiedContent || isProcessing}
        >
          <Download size={20} />
          {isProcessing ? t("edit-pdf:processing") : t("edit-pdf:save_changes")}
        </button>
      </div>
    </div>
  );
};

export default PDFEditor;
