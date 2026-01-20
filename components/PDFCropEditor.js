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
import styles from "../styles/PDFCropEditor.module.css";

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;
const RENDER_SCALE = 1.5;
const MIN_CROP_PT = 10; // minimum crop area in PDF points
const PT_PER_MM = 72 / 25.4;
const PT_PER_IN = 72;

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

const PDFCropEditor = ({ pdfDocument, onSave, fileName }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pageWrapperRef = useRef(null);
  const renderingRef = useRef(false);
  const dragRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pdfPages, setPdfPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Crop state - per page: { top, right, bottom, left } in PDF points
  const [cropRegions, setCropRegions] = useState([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [unit, setUnit] = useState("mm");

  // Display dimensions for coordinate conversion
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

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

  // Track display size via ResizeObserver
  useEffect(() => {
    const wrapper = pageWrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDisplaySize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [pdfPages, currentPage]);

  const loadPDF = async () => {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      const pages = [];
      const defaultCrops = [];

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport: renderViewport })
          .promise;
        pages.push({
          dataUrl: canvas.toDataURL("image/png"),
          pdfWidth: viewport.width,
          pdfHeight: viewport.height,
          renderWidth: renderViewport.width,
          renderHeight: renderViewport.height,
        });
        defaultCrops.push({ top: 0, right: 0, bottom: 0, left: 0 });
      }
      setPdfPages(pages);
      setCropRegions(defaultCrops);
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

  // Coordinate conversion helpers
  const pdfToDisplay = useCallback(
    (pdfPt, pdfDim, displayDim) => {
      if (pdfDim === 0) return 0;
      return (pdfPt / pdfDim) * displayDim;
    },
    []
  );

  const displayToPdf = useCallback(
    (displayPx, displayDim, pdfDim) => {
      if (displayDim === 0) return 0;
      return (displayPx / displayDim) * pdfDim;
    },
    []
  );

  // Unit conversion
  const ptToUnit = (pt) => {
    if (unit === "pt") return pt;
    if (unit === "in") return pt / PT_PER_IN;
    return pt / PT_PER_MM; // mm
  };

  const unitToPt = (val) => {
    if (unit === "pt") return val;
    if (unit === "in") return val * PT_PER_IN;
    return val * PT_PER_MM; // mm
  };

  const getUnitLabel = () => {
    if (unit === "pt") return "pt";
    if (unit === "in") return "in";
    return "mm";
  };

  // Get crop overlay positions in display pixels
  const getCropDisplayRect = () => {
    const crop = cropRegions[currentPage];
    if (!crop || !pdfPages[currentPage]) {
      return { x: 0, y: 0, width: displaySize.width, height: displaySize.height };
    }
    const page = pdfPages[currentPage];
    const x = pdfToDisplay(crop.left, page.pdfWidth, displaySize.width);
    const y = pdfToDisplay(crop.top, page.pdfHeight, displaySize.height);
    const w =
      displaySize.width -
      pdfToDisplay(crop.left + crop.right, page.pdfWidth, displaySize.width);
    const h =
      displaySize.height -
      pdfToDisplay(crop.top + crop.bottom, page.pdfHeight, displaySize.height);
    return { x, y, width: Math.max(0, w), height: Math.max(0, h) };
  };

  // Update crop for current page (or all pages)
  const updateCrop = useCallback(
    (newCrop) => {
      setCropRegions((prev) => {
        const updated = [...prev];
        if (applyToAll) {
          for (let i = 0; i < updated.length; i++) {
            updated[i] = { ...newCrop };
          }
        } else {
          updated[currentPage] = { ...newCrop };
        }
        return updated;
      });
    },
    [currentPage, applyToAll]
  );

  // Clamp crop to valid bounds
  const clampCrop = (crop, page) => {
    const c = { ...crop };
    c.top = Math.max(0, c.top);
    c.right = Math.max(0, c.right);
    c.bottom = Math.max(0, c.bottom);
    c.left = Math.max(0, c.left);
    // Ensure minimum crop area
    if (c.left + c.right > page.pdfWidth - MIN_CROP_PT) {
      const excess = c.left + c.right - (page.pdfWidth - MIN_CROP_PT);
      c.left -= excess / 2;
      c.right -= excess / 2;
      c.left = Math.max(0, c.left);
      c.right = Math.max(0, c.right);
    }
    if (c.top + c.bottom > page.pdfHeight - MIN_CROP_PT) {
      const excess = c.top + c.bottom - (page.pdfHeight - MIN_CROP_PT);
      c.top -= excess / 2;
      c.bottom -= excess / 2;
      c.top = Math.max(0, c.top);
      c.bottom = Math.max(0, c.bottom);
    }
    return c;
  };

  // Mouse/touch event handlers for crop dragging
  const getEventPos = (e) => {
    const wrapper = pageWrapperRef.current;
    if (!wrapper) return { x: 0, y: 0 };
    const rect = wrapper.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const HANDLE_HIT = 16;

  const hitTestTarget = (pos) => {
    const r = getCropDisplayRect();
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;

    // Corner handles
    if (Math.abs(pos.x - r.x) < HANDLE_HIT && Math.abs(pos.y - r.y) < HANDLE_HIT) return "nw";
    if (Math.abs(pos.x - (r.x + r.width)) < HANDLE_HIT && Math.abs(pos.y - r.y) < HANDLE_HIT) return "ne";
    if (Math.abs(pos.x - r.x) < HANDLE_HIT && Math.abs(pos.y - (r.y + r.height)) < HANDLE_HIT) return "sw";
    if (Math.abs(pos.x - (r.x + r.width)) < HANDLE_HIT && Math.abs(pos.y - (r.y + r.height)) < HANDLE_HIT) return "se";

    // Edge midpoint handles
    if (Math.abs(pos.x - cx) < HANDLE_HIT && Math.abs(pos.y - r.y) < HANDLE_HIT) return "n";
    if (Math.abs(pos.x - cx) < HANDLE_HIT && Math.abs(pos.y - (r.y + r.height)) < HANDLE_HIT) return "s";
    if (Math.abs(pos.x - r.x) < HANDLE_HIT && Math.abs(pos.y - cy) < HANDLE_HIT) return "w";
    if (Math.abs(pos.x - (r.x + r.width)) < HANDLE_HIT && Math.abs(pos.y - cy) < HANDLE_HIT) return "e";

    // Edge lines
    if (pos.x >= r.x - HANDLE_HIT && pos.x <= r.x + r.width + HANDLE_HIT) {
      if (Math.abs(pos.y - r.y) < HANDLE_HIT) return "n";
      if (Math.abs(pos.y - (r.y + r.height)) < HANDLE_HIT) return "s";
    }
    if (pos.y >= r.y - HANDLE_HIT && pos.y <= r.y + r.height + HANDLE_HIT) {
      if (Math.abs(pos.x - r.x) < HANDLE_HIT) return "w";
      if (Math.abs(pos.x - (r.x + r.width)) < HANDLE_HIT) return "e";
    }

    // Inside crop rect -> move
    if (pos.x >= r.x && pos.x <= r.x + r.width && pos.y >= r.y && pos.y <= r.y + r.height) {
      return "move";
    }

    return null;
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const target = hitTestTarget(pos);
    if (!target) return;

    dragRef.current = {
      target,
      startPos: pos,
      startCrop: { ...(cropRegions[currentPage] || { top: 0, right: 0, bottom: 0, left: 0 }) },
    };

    const onMove = (ev) => {
      ev.preventDefault();
      handlePointerMove(ev);
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    const pos = getEventPos(e);
    const { target, startPos, startCrop } = dragRef.current;
    const page = pdfPages[currentPage];
    if (!page) return;

    const dx = pos.x - startPos.x;
    const dy = pos.y - startPos.y;

    // Convert display delta to PDF point delta
    const dxPt = displayToPdf(dx, displaySize.width, page.pdfWidth);
    const dyPt = displayToPdf(dy, displaySize.height, page.pdfHeight);

    let newCrop = { ...startCrop };

    switch (target) {
      case "n":
        newCrop.top = startCrop.top + dyPt;
        break;
      case "s":
        newCrop.bottom = startCrop.bottom - dyPt;
        break;
      case "w":
        newCrop.left = startCrop.left + dxPt;
        break;
      case "e":
        newCrop.right = startCrop.right - dxPt;
        break;
      case "nw":
        newCrop.top = startCrop.top + dyPt;
        newCrop.left = startCrop.left + dxPt;
        break;
      case "ne":
        newCrop.top = startCrop.top + dyPt;
        newCrop.right = startCrop.right - dxPt;
        break;
      case "sw":
        newCrop.bottom = startCrop.bottom - dyPt;
        newCrop.left = startCrop.left + dxPt;
        break;
      case "se":
        newCrop.bottom = startCrop.bottom - dyPt;
        newCrop.right = startCrop.right - dxPt;
        break;
      case "move":
        newCrop.top = startCrop.top + dyPt;
        newCrop.bottom = startCrop.bottom - dyPt;
        newCrop.left = startCrop.left + dxPt;
        newCrop.right = startCrop.right - dxPt;
        break;
    }

    newCrop = clampCrop(newCrop, page);
    updateCrop(newCrop);
  };

  // Handle margin input changes
  const handleMarginChange = (side, value) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) return;
    const ptVal = unitToPt(numVal);
    const crop = cropRegions[currentPage] || { top: 0, right: 0, bottom: 0, left: 0 };
    const page = pdfPages[currentPage];
    if (!page) return;
    const newCrop = { ...crop, [side]: ptVal };
    updateCrop(clampCrop(newCrop, page));
  };

  // Reset crop
  const handleReset = () => {
    const zeroCrop = { top: 0, right: 0, bottom: 0, left: 0 };
    setCropRegions((prev) => prev.map(() => ({ ...zeroCrop })));
  };

  // Handle "apply to all" toggle
  const handleApplyToAllChange = (checked) => {
    setApplyToAll(checked);
    if (checked && cropRegions[currentPage]) {
      // Copy current page crop to all pages
      const currentCrop = cropRegions[currentPage];
      setCropRegions((prev) => prev.map(() => ({ ...currentCrop })));
    }
  };

  // Save with pdf-lib CropBox approach
  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const mediaBox = page.getMediaBox();
        const crop = cropRegions[i] || { top: 0, right: 0, bottom: 0, left: 0 };

        if (crop.top > 0 || crop.right > 0 || crop.bottom > 0 || crop.left > 0) {
          const newX = mediaBox.x + crop.left;
          const newY = mediaBox.y + crop.bottom;
          const newWidth = mediaBox.width - crop.left - crop.right;
          const newHeight = mediaBox.height - crop.top - crop.bottom;

          if (newWidth > 0 && newHeight > 0) {
            page.setMediaBox(newX, newY, newWidth, newHeight);
            page.setCropBox(newX, newY, newWidth, newHeight);
            page.setTrimBox(newX, newY, newWidth, newHeight);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      onSave(blob);
    } catch (err) {
      console.error("Crop save failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render crop overlay
  const cropRect = getCropDisplayRect();
  const crop = cropRegions[currentPage] || { top: 0, right: 0, bottom: 0, left: 0 };

  return (
    <div className={styles.editor_wrapper}>
      {/* Toolbar with margin inputs */}
      <div className={styles.toolbar}>
        <div className={styles.margin_row}>
          {["top", "right", "bottom", "left"].map((side) => (
            <div key={side} className={styles.margin_group}>
              <label className={styles.margin_label}>
                {t(`crop-pdf:${side}`)}:
              </label>
              <input
                type="number"
                className={styles.margin_input}
                min="0"
                step={unit === "pt" ? "1" : "0.1"}
                value={ptToUnit(crop[side]).toFixed(unit === "pt" ? 0 : 1)}
                onChange={(e) => handleMarginChange(side, e.target.value)}
              />
              <span className={styles.margin_unit}>{getUnitLabel()}</span>
            </div>
          ))}
        </div>

        <div className={styles.toolbar_separator} />

        <select
          className={styles.unit_select}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="mm">mm</option>
          <option value="pt">pt</option>
          <option value="in">in</option>
        </select>

        <label className={styles.apply_all_label}>
          <input
            type="checkbox"
            className={styles.apply_all_checkbox}
            checked={applyToAll}
            onChange={(e) => handleApplyToAllChange(e.target.checked)}
          />
          {t("crop-pdf:apply_to_all")}
        </label>

        <button className={styles.reset_btn} onClick={handleReset}>
          <ArrowCounterclockwise size={14} />
          {t("crop-pdf:reset_crop")}
        </button>
      </div>

      {/* Canvas with crop overlay */}
      <div className={styles.canvas_container} ref={containerRef}>
        <div
          className={styles.page_wrapper}
          ref={pageWrapperRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <canvas ref={canvasRef} className={styles.canvas} />

          {/* Crop overlay - 4 dark masks around the crop rectangle */}
          {displaySize.width > 0 && (
            <div className={styles.crop_overlay}>
              {/* Top mask */}
              <div
                className={styles.mask_top}
                style={{ height: cropRect.y }}
              />
              {/* Bottom mask */}
              <div
                className={styles.mask_bottom}
                style={{ height: displaySize.height - cropRect.y - cropRect.height }}
              />
              {/* Left mask */}
              <div
                className={styles.mask_left}
                style={{
                  top: cropRect.y,
                  width: cropRect.x,
                  height: cropRect.height,
                }}
              />
              {/* Right mask */}
              <div
                className={styles.mask_right}
                style={{
                  top: cropRect.y,
                  width: displaySize.width - cropRect.x - cropRect.width,
                  height: cropRect.height,
                }}
              />

              {/* Crop rectangle border */}
              <div
                className={styles.crop_rect}
                style={{
                  left: cropRect.x,
                  top: cropRect.y,
                  width: cropRect.width,
                  height: cropRect.height,
                }}
              >
                {/* 8 resize handles */}
                {/* Corners */}
                <div className={`${styles.handle} ${styles.handle_nw}`} style={{ left: 0, top: 0 }} />
                <div className={`${styles.handle} ${styles.handle_ne}`} style={{ left: "100%", top: 0 }} />
                <div className={`${styles.handle} ${styles.handle_sw}`} style={{ left: 0, top: "100%" }} />
                <div className={`${styles.handle} ${styles.handle_se}`} style={{ left: "100%", top: "100%" }} />
                {/* Edge midpoints */}
                <div className={`${styles.handle} ${styles.handle_n}`} style={{ left: "50%", top: 0 }} />
                <div className={`${styles.handle} ${styles.handle_s}`} style={{ left: "50%", top: "100%" }} />
                <div className={`${styles.handle} ${styles.handle_w}`} style={{ left: 0, top: "50%" }} />
                <div className={`${styles.handle} ${styles.handle_e}`} style={{ left: "100%", top: "50%" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar: zoom + page nav + save */}
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
            ? t("crop-pdf:processing")
            : t("common:save_&_download")}
        </button>
      </div>
    </div>
  );
};

export default PDFCropEditor;
