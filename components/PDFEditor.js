import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "next-i18next";
import {
  Fonts,
  ImageFill,
  Trash,
  ArrowsMove,
  PlusLg,
  DashLg,
  ChevronLeft,
  ChevronRight,
  Download,
} from "react-bootstrap-icons";
import styles from "../styles/PDFEditor.module.css";

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageElements, setPageElements] = useState({}); // { pageIndex: [elements] }
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorCanvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null); // 'text' | 'image' | null
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPages, setPdfPages] = useState([]);
  const renderingRef = useRef(false);

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
  }, [currentPage, pageElements, selectedElement, pdfPages, scale]);

  const loadPDF = async () => {
    try {
      // Load pdf.js from CDN
      const pdfjsLib = await loadPdfJs();

      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      // Pre-render all pages to image data
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const offscreen = document.createElement("canvas");
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext("2d");

        await page.render({ canvasContext: ctx, viewport }).promise;

        pages.push({
          imageData: offscreen.toDataURL("image/png"),
          width: viewport.width,
          height: viewport.height,
          originalWidth: page.getViewport({ scale: 1 }).width,
          originalHeight: page.getViewport({ scale: 1 }).height,
        });
      }

      setPdfPages(pages);
      if (pages.length > 0) {
        setPageDimensions({ width: pages[0].width, height: pages[0].height });
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
    }
  };

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

      // Draw all elements for this page
      const elements = pageElements[currentPage] || [];
      elements.forEach((el, idx) => {
        const isSelected =
          selectedElement !== null &&
          selectedElement.pageIndex === currentPage &&
          selectedElement.elementIndex === idx;

        if (el.type === "text") {
          ctx.font = `${el.fontSize * scale * 1.5}px "Open Sans", sans-serif`;
          ctx.fillStyle = el.color;
          ctx.textBaseline = "top";

          // Word wrap
          const maxWidth = el.width ? el.width * scale * 1.5 : canvas.width - el.x * scale * 1.5;
          const lines = wrapText(ctx, el.text, maxWidth);
          const lineHeight = el.fontSize * scale * 1.5 * 1.3;

          lines.forEach((line, lineIdx) => {
            ctx.fillText(
              line,
              el.x * scale * 1.5,
              el.y * scale * 1.5 + lineIdx * lineHeight
            );
          });

          if (isSelected) {
            const totalHeight = lines.length * lineHeight;
            const measuredWidth = Math.max(
              ...lines.map((l) => ctx.measureText(l).width)
            );
            ctx.strokeStyle = "#2a74ed";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(
              el.x * scale * 1.5 - 4,
              el.y * scale * 1.5 - 4,
              measuredWidth + 8,
              totalHeight + 8
            );
            ctx.setLineDash([]);

            // Delete handle
            drawDeleteHandle(
              ctx,
              el.x * scale * 1.5 + measuredWidth + 4,
              el.y * scale * 1.5 - 12
            );
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
              ctx.strokeStyle = "#2a74ed";
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 3]);
              ctx.strokeRect(
                el.x * scale * 1.5 - 4,
                el.y * scale * 1.5 - 4,
                el.width * scale * 1.5 + 8,
                el.height * scale * 1.5 + 8
              );
              ctx.setLineDash([]);

              // Resize handle
              drawResizeHandle(
                ctx,
                el.x * scale * 1.5 + el.width * scale * 1.5,
                el.y * scale * 1.5 + el.height * scale * 1.5
              );

              // Delete handle
              drawDeleteHandle(
                ctx,
                el.x * scale * 1.5 + el.width * scale * 1.5 + 4,
                el.y * scale * 1.5 - 12
              );
            }
          };
          elImg.src = el.dataUrl;
        }
      });

      renderingRef.current = false;
    };
    img.src = page.imageData;
  }, [currentPage, pageElements, selectedElement, pdfPages, scale]);

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
    ctx.fillStyle = "#2a74ed";
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

  const findElementAtPosition = (x, y) => {
    const elements = pageElements[currentPage] || [];
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === "text") {
        const textWidth = el.width || 200;
        const textHeight = el.fontSize * 2;
        if (
          x >= el.x &&
          x <= el.x + textWidth &&
          y >= el.y &&
          y <= el.y + textHeight
        ) {
          return { pageIndex: currentPage, elementIndex: i };
        }
      } else if (el.type === "image") {
        if (
          x >= el.x &&
          x <= el.x + el.width &&
          y >= el.y &&
          y <= el.y + el.height
        ) {
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
      ctx.font = `${el.fontSize * 1.5}px "Open Sans", sans-serif`;
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
    if (el.type !== "image") return false;
    const handleX = el.x + el.width;
    const handleY = el.y + el.height;
    return Math.abs(x - handleX) < 10 && Math.abs(y - handleY) < 10;
  };

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoordinates(e);

    // Check if clicking on delete handle of selected element
    if (selectedElement) {
      const el =
        (pageElements[selectedElement.pageIndex] || [])[
          selectedElement.elementIndex
        ];
      if (el && isOnDeleteHandle(x, y, el)) {
        handleDeleteElement(
          selectedElement.pageIndex,
          selectedElement.elementIndex
        );
        return;
      }

      // Check resize handle for images
      if (el && isOnResizeHandle(x, y, el)) {
        setIsResizing(true);
        setDragOffset({ x: el.width, y: el.height });
        return;
      }
    }

    // Find element at position
    const found = findElementAtPosition(x, y);
    if (found) {
      const el =
        (pageElements[found.pageIndex] || [])[found.elementIndex];
      setSelectedElement(found);
      setIsDragging(true);
      setDragOffset({ x: x - el.x, y: y - el.y });
    } else {
      setSelectedElement(null);

      // If text tool is active, add text at click position
      if (activeTool === "text" && textInput.trim()) {
        addTextElement(x, y);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging && selectedElement) {
      const { x, y } = getCanvasCoordinates(e);
      updateElementPosition(
        selectedElement.pageIndex,
        selectedElement.elementIndex,
        x - dragOffset.x,
        y - dragOffset.y
      );
    }

    if (isResizing && selectedElement) {
      const { x, y } = getCanvasCoordinates(e);
      const el =
        (pageElements[selectedElement.pageIndex] || [])[
          selectedElement.elementIndex
        ];
      if (el && el.type === "image") {
        const newWidth = Math.max(30, x - el.x);
        const aspectRatio = el.originalHeight / el.originalWidth;
        const newHeight = newWidth * aspectRatio;
        updateElementSize(
          selectedElement.pageIndex,
          selectedElement.elementIndex,
          newWidth,
          newHeight
        );
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Touch support
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleCanvasMouseUp();
  };

  const addTextElement = (x, y) => {
    const newElement = {
      type: "text",
      text: textInput,
      x,
      y,
      fontSize,
      color: fontColor,
      width: 200,
    };

    setPageElements((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newElement],
    }));

    setTextInput("");
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

  const updateElementPosition = (pageIndex, elementIndex, x, y) => {
    setPageElements((prev) => {
      const elements = [...(prev[pageIndex] || [])];
      elements[elementIndex] = { ...elements[elementIndex], x, y };
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

  const handleDeleteElement = (pageIndex, elementIndex) => {
    setPageElements((prev) => {
      const elements = [...(prev[pageIndex] || [])];
      elements.splice(elementIndex, 1);
      return { ...prev, [pageIndex]: elements };
    });
    setSelectedElement(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        addImageElement(reader.result, img.width, img.height);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = "";
  };

  // Draw color gradient on canvas when picker opens
  useEffect(() => {
    if (!showColorPicker || !colorCanvasRef.current) return;
    const canvas = colorCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // Draw hue gradient (horizontal)
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
  };

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      // Process each page
      for (const [pageIndexStr, elements] of Object.entries(pageElements)) {
        const pageIndex = parseInt(pageIndexStr);
        if (pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        // The render scale used in pdfjs
        const renderPage = pdfPages[pageIndex];
        if (!renderPage) continue;

        // Scale factor: canvas coords (at scale=1) → PDF coords
        const scaleFactorX = pdfWidth / (renderPage.width / 1.5);
        const scaleFactorY = pdfHeight / (renderPage.height / 1.5);

        for (const el of elements) {
          if (el.type === "text") {
            const pdfFontSize = el.fontSize * scaleFactorX;
            const pdfX = el.x * scaleFactorX;
            // PDF Y is from bottom, canvas Y is from top
            const pdfY = pdfHeight - el.y * scaleFactorY - pdfFontSize;

            // Parse hex color
            const hex = el.color.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            page.drawText(el.text, {
              x: pdfX,
              y: pdfY,
              size: pdfFontSize,
              font: helveticaFont,
              color: rgb(r, g, b),
            });
          } else if (el.type === "image") {
            // Embed image
            let embeddedImage;
            const response = await fetch(el.dataUrl);
            const imageBytes = await response.arrayBuffer();

            try {
              if (
                el.dataUrl.includes("image/png") ||
                el.dataUrl.includes(".png")
              ) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
              } else {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
              }
            } catch {
              // Try the other format
              try {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
              } catch {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
              }
            }

            const pdfX = el.x * scaleFactorX;
            const pdfY =
              pdfHeight -
              el.y * scaleFactorY -
              el.height * scaleFactorY;
            const pdfImgWidth = el.width * scaleFactorX;
            const pdfImgHeight = el.height * scaleFactorY;

            page.drawImage(embeddedImage, {
              x: pdfX,
              y: pdfY,
              width: pdfImgWidth,
              height: pdfImgHeight,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      // Directly download the file
      const newName = fileName
        ? fileName.replace(/\.pdf$/i, "_edited.pdf")
        : "edited.pdf";
      const link = document.createElement("a");
      link.download = newName;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);

      // Also notify parent if callback exists
      if (onSave) onSave(blob);
    } catch (err) {
      console.error("Error saving PDF:", err);
      alert("Error processing PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasElements = Object.values(pageElements).some(
    (els) => els.length > 0
  );

  return (
    <div className={styles.editor_wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbar_group}>
          <button
            className={`${styles.tool_btn} ${
              activeTool === "text" ? styles.active : ""
            }`}
            onClick={() => setActiveTool(activeTool === "text" ? null : "text")}
            title={t("edit-pdf:add_text")}
          >
            <Fonts size={18} />
            <span className={styles.tool_label}>
              {t("edit-pdf:add_text")}
            </span>
          </button>

          <button
            className={`${styles.tool_btn} ${
              activeTool === "image" ? styles.active : ""
            }`}
            onClick={() => {
              setActiveTool("image");
              fileInputRef.current?.click();
            }}
            title={t("edit-pdf:add_image")}
          >
            <ImageFill size={18} />
            <span className={styles.tool_label}>
              {t("edit-pdf:add_image")}
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* Text options */}
        {activeTool === "text" && (
          <div className={styles.text_options}>
            <input
              type="text"
              className={styles.text_input}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t("edit-pdf:type_text_here")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && textInput.trim()) {
                  // Add text at center of visible canvas
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const centerX = (canvas.width / (scale * 1.5)) / 2 - 50;
                    const centerY = (canvas.height / (scale * 1.5)) / 2;
                    addTextElement(centerX, centerY);
                  }
                }
              }}
            />
            <div className={styles.text_controls}>
              <label className={styles.control_label}>
                {t("edit-pdf:font_size")}:
                <input
                  type="number"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
                  className={styles.number_input}
                />
              </label>
              <div className={styles.color_picker_wrapper}>
                <span className={styles.control_label}>{t("edit-pdf:color")}:</span>
                <button
                  className={styles.color_preview}
                  style={{ backgroundColor: fontColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title={t("edit-pdf:color")}
                />
                {showColorPicker && (
                  <div className={styles.color_dropdown}>
                    <canvas
                      ref={colorCanvasRef}
                      width={220}
                      height={120}
                      className={styles.color_canvas}
                      onClick={handleColorCanvasClick}
                    />
                    <div className={styles.color_quick_row}>
                      {["#000000", "#FF0000", "#FF8800", "#FFCC00", "#00CC00", "#0088FF", "#0000FF", "#8800FF", "#FFFFFF"].map((c) => (
                        <button
                          key={c}
                          className={styles.color_quick}
                          style={{ backgroundColor: c }}
                          onClick={() => { setFontColor(c); setShowColorPicker(false); }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className={styles.hint}>
              {t("edit-pdf:click_to_place")}
            </p>
          </div>
        )}

        {/* Selected element controls */}
        {selectedElement && (
          <div className={styles.toolbar_group}>
            <button
              className={`${styles.tool_btn} ${styles.delete_btn}`}
              onClick={() =>
                handleDeleteElement(
                  selectedElement.pageIndex,
                  selectedElement.elementIndex
                )
              }
              title={t("common:delete")}
            >
              <Trash size={18} />
              <span className={styles.tool_label}>
                {t("common:delete")}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div className={styles.canvas_container} ref={containerRef}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: isDragging
              ? "grabbing"
              : isResizing
              ? "nwse-resize"
              : activeTool === "text"
              ? "text"
              : "default",
          }}
        />
      </div>

      {/* Page navigation */}
      <div className={styles.page_nav}>
        <div className={styles.zoom_controls}>
          <button
            className={styles.nav_btn}
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            title="Zoom out"
          >
            <DashLg size={16} />
          </button>
          <span className={styles.zoom_label}>
            {Math.round(scale * 100)}%
          </span>
          <button
            className={styles.nav_btn}
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            title="Zoom in"
          >
            <PlusLg size={16} />
          </button>
        </div>

        <div className={styles.page_controls}>
          <button
            className={styles.nav_btn}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.page_label}>
            {t("edit-pdf:page")} {currentPage + 1} / {totalPages}
          </span>
          <button
            className={styles.nav_btn}
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          className={`${styles.save_btn} ${
            !hasElements || isProcessing ? styles.disabled : ""
          }`}
          onClick={handleSave}
          disabled={!hasElements || isProcessing}
        >
          <Download size={20} />
          {isProcessing
            ? t("edit-pdf:processing")
            : t("edit-pdf:save_changes")}
        </button>
      </div>
    </div>
  );
};

export default PDFEditor;
