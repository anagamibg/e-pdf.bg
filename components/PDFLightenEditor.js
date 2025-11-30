import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "next-i18next";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  PlusLg,
  DashLg,
  ArrowCounterclockwise,
} from "react-bootstrap-icons";
import styles from "../styles/PDFLightenEditor.module.css";

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsPromise = null;
const loadPdfJs = () => {
  if (pdfjsPromise) return pdfjsPromise;
  pdfjsPromise = new Promise((resolve) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(window.pdfjsLib);
    };
    document.head.appendChild(script);
  });
  return pdfjsPromise;
};

const PDFLightenEditor = ({ pdfDocument, onSave, fileName }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderingRef = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pdfPages, setPdfPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter state
  const [brightness, setBrightness] = useState(130);
  const [contrast, setContrast] = useState(110);
  const [saturation, setSaturation] = useState(100);
  const [sharpness, setSharpness] = useState(0);

  // Load PDF
  useEffect(() => {
    if (!pdfDocument) return;
    loadPDF();
  }, [pdfDocument]);

  // Re-render when page/scale changes
  useEffect(() => {
    if (pdfPages.length > 0) {
      renderCurrentPage();
    }
  }, [currentPage, pdfPages, scale]);

  const loadPDF = async () => {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      const pages = [];
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 1 });
        const renderScale = 1.5;
        const renderViewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport: renderViewport })
          .promise;
        pages.push({
          dataUrl: canvas.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
          renderWidth: renderViewport.width,
          renderHeight: renderViewport.height,
        });
      }
      setPdfPages(pages);
      setCurrentPage(0);
    } catch (err) {
      console.error("Failed to load PDF:", err);
    }
  };

  const renderCurrentPage = useCallback(() => {
    if (renderingRef.current || !pdfPages[currentPage]) return;
    renderingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) {
      renderingRef.current = false;
      return;
    }
    const ctx = canvas.getContext("2d");
    const pageData = pdfPages[currentPage];
    canvas.width = pageData.renderWidth;
    canvas.height = pageData.renderHeight;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      renderingRef.current = false;
    };
    img.src = pageData.dataUrl;
  }, [currentPage, pdfPages, scale]);

  const getCSSFilter = () => {
    let filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (sharpness > 0) {
      // CSS doesn't have a sharpness filter, but we can approximate with a very slight contrast boost
      // We'll handle sharpness via canvas convolution on save
    }
    return filter;
  };

  const resetFilters = () => {
    setBrightness(130);
    setContrast(110);
    setSaturation(100);
    setSharpness(0);
  };

  const resetToOriginal = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(0);
  };

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Import pdf-lib dynamically
      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2 }); // High quality render

        // Render page to canvas
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const ctx = tempCanvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Apply filters to the canvas
        const filteredCanvas = applyCanvasFilters(tempCanvas);

        // Embed filtered image into new PDF
        const pngData = filteredCanvas.toDataURL("image/png");
        const pngBytes = await fetch(pngData).then((r) => r.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(pngBytes);

        // Use original page dimensions
        const origViewport = page.getViewport({ scale: 1 });
        const newPage = pdfDoc.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      onSave(blob);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCanvasFilters = (sourceCanvas) => {
    const canvas = document.createElement("canvas");
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext("2d");

    // Use CSS filter via OffscreenCanvas-like approach
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(sourceCanvas, 0, 0);

    // Apply sharpness via unsharp mask if needed
    if (sharpness > 0) {
      applyUnsharpMask(ctx, canvas.width, canvas.height, sharpness);
    }

    return canvas;
  };

  const applyUnsharpMask = (ctx, width, height, amount) => {
    // Simple unsharp mask: sharpen by blending original with difference from blur
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Create blurred version
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = width;
    blurCanvas.height = height;
    const blurCtx = blurCanvas.getContext("2d");
    blurCtx.filter = "blur(1px)";
    blurCtx.drawImage(ctx.canvas, 0, 0);
    const blurData = blurCtx.getImageData(0, 0, width, height).data;

    const strength = amount / 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + (data[i] - blurData[i]) * strength));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (data[i + 1] - blurData[i + 1]) * strength));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (data[i + 2] - blurData[i + 2]) * strength));
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const presets = [
    {
      key: "scanned",
      brightness: 145,
      contrast: 120,
      saturation: 90,
      sharpness: 30,
    },
    {
      key: "photo",
      brightness: 130,
      contrast: 110,
      saturation: 100,
      sharpness: 0,
    },
    {
      key: "faded",
      brightness: 160,
      contrast: 95,
      saturation: 60,
      sharpness: 0,
    },
    {
      key: "high_contrast",
      brightness: 115,
      contrast: 140,
      saturation: 100,
      sharpness: 20,
    },
  ];

  const applyPreset = (preset) => {
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setSharpness(preset.sharpness);
  };

  return (
    <div className={styles.editor_wrapper}>
      {/* Toolbar with filters */}
      <div className={styles.toolbar}>
        <div className={styles.presets}>
          <span className={styles.section_label}>
            {t("lighten-pdf:presets")}:
          </span>
          {presets.map((p) => (
            <button
              key={p.key}
              className={styles.preset_btn}
              onClick={() => applyPreset(p)}
            >
              {t(`lighten-pdf:preset_${p.key}`)}
            </button>
          ))}
          <button
            className={`${styles.preset_btn} ${styles.reset_btn}`}
            onClick={resetToOriginal}
            title={t("lighten-pdf:reset_original")}
          >
            <ArrowCounterclockwise size={14} />
            {t("lighten-pdf:original")}
          </button>
        </div>
      </div>

      {/* Filter sliders */}
      <div className={styles.filters_panel}>
        <div className={styles.filter_row}>
          <label className={styles.filter_label}>
            {t("lighten-pdf:brightness")}
          </label>
          <input
            type="range"
            min="50"
            max="250"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className={styles.filter_slider}
          />
          <span className={styles.filter_value}>{brightness}%</span>
        </div>

        <div className={styles.filter_row}>
          <label className={styles.filter_label}>
            {t("lighten-pdf:contrast")}
          </label>
          <input
            type="range"
            min="50"
            max="200"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className={styles.filter_slider}
          />
          <span className={styles.filter_value}>{contrast}%</span>
        </div>

        <div className={styles.filter_row}>
          <label className={styles.filter_label}>
            {t("lighten-pdf:saturation")}
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => setSaturation(Number(e.target.value))}
            className={styles.filter_slider}
          />
          <span className={styles.filter_value}>{saturation}%</span>
        </div>

        <div className={styles.filter_row}>
          <label className={styles.filter_label}>
            {t("lighten-pdf:sharpness")}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={sharpness}
            onChange={(e) => setSharpness(Number(e.target.value))}
            className={styles.filter_slider}
          />
          <span className={styles.filter_value}>{sharpness}%</span>
        </div>
      </div>

      {/* Canvas preview with CSS filters applied in real-time */}
      <div className={styles.canvas_container} ref={containerRef}>
        <div className={styles.page_wrapper}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={{ filter: getCSSFilter() }}
          />
        </div>
      </div>

      {/* Bottom bar: page nav + zoom + save */}
      <div className={styles.page_nav}>
        <div className={styles.zoom_controls}>
          <button
            className={styles.nav_btn}
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            disabled={scale <= 0.5}
          >
            <DashLg />
          </button>
          <span className={styles.zoom_label}>{Math.round(scale * 100)}%</span>
          <button
            className={styles.nav_btn}
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            disabled={scale >= 3}
          >
            <PlusLg />
          </button>
        </div>

        <div className={styles.page_controls}>
          <button
            className={styles.nav_btn}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft />
          </button>
          <span className={styles.page_label}>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className={styles.nav_btn}
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight />
          </button>
        </div>

        <button
          className={`${styles.save_btn} ${isProcessing ? styles.disabled : ""}`}
          onClick={handleSave}
          disabled={isProcessing}
        >
          <Download size={18} />
          {isProcessing
            ? t("lighten-pdf:processing")
            : t("common:save_&_download")}
        </button>
      </div>
    </div>
  );
};

export default PDFLightenEditor;
