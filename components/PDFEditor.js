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

  // Sync hex input when fontColor changes
  useEffect(() => {
    setHexInput(fontColor);
  }, [fontColor]);

  // When selecting a text element, load its properties into the toolbar
  useEffect(() => {
    if (selectedElement) {
      const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
      if (el && el.type === "text") {
        setFontSize(el.fontSize);
        setFontColor(el.color);
        setIsBold(el.bold || false);
        setIsItalic(el.italic || false);
        setIsUnderline(el.underline || false);
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

  const loadPDF = async () => {
    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

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

  const buildFontString = (el, scaleMul) => {
    const style = el.italic ? "italic" : "normal";
    const weight = el.bold ? "bold" : "normal";
    return `${style} ${weight} ${el.fontSize * scaleMul}px "Open Sans", sans-serif`;
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

      const elements = pageElements[currentPage] || [];
      elements.forEach((el, idx) => {
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

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoordinates(e);

    if (selectedElement) {
      const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
      if (el && isOnDeleteHandle(x, y, el)) {
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
      setIsDragging(true);
      setDragOffset({ x: x - el.x, y: y - el.y });
    } else {
      setSelectedElement(null);
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

  const addTextElement = (x, y) => {
    const newElement = {
      type: "text",
      text: textInput,
      x,
      y,
      fontSize,
      color: fontColor,
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
    // Clear signature canvas after placing
    const ctx = signCanvas.getContext("2d");
    ctx.clearRect(0, 0, signCanvas.width, signCanvas.height);
    setSignatureReady(false);
    setActiveTool(null);
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

  const updateSelectedTextProp = (prop, value) => {
    if (!selectedElement) return;
    const el = (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex];
    if (!el || el.type !== "text") return;
    setPageElements((prev) => {
      const elements = [...(prev[selectedElement.pageIndex] || [])];
      elements[selectedElement.elementIndex] = { ...elements[selectedElement.elementIndex], [prop]: value };
      return { ...prev, [selectedElement.pageIndex]: elements };
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
    // Check if anything drawn
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
  };

  const handleHexInputChange = (val) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setFontColor(val.toUpperCase());
      if (selectedElement) updateSelectedTextProp("color", val.toUpperCase());
    }
  };

  const handleColorQuickPick = (c) => {
    setFontColor(c);
    setShowColorPicker(false);
    if (selectedElement) updateSelectedTextProp("color", c);
  };

  const toggleBold = () => {
    const newVal = !isBold;
    setIsBold(newVal);
    if (selectedElement) updateSelectedTextProp("bold", newVal);
  };

  const toggleItalic = () => {
    const newVal = !isItalic;
    setIsItalic(newVal);
    if (selectedElement) updateSelectedTextProp("italic", newVal);
  };

  const toggleUnderline = () => {
    const newVal = !isUnderline;
    setIsUnderline(newVal);
    if (selectedElement) updateSelectedTextProp("underline", newVal);
  };

  const handleFontSizeChange = (val) => {
    const newSize = parseInt(val) || 16;
    setFontSize(newSize);
    if (selectedElement) updateSelectedTextProp("fontSize", newSize);
  };

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const fontkit = (await import("@pdf-lib/fontkit")).default;
      const arrayBuffer = await pdfDocument.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      pdfDoc.registerFontkit(fontkit);

      const [regularFontBytes, italicFontBytes] = await Promise.all([
        fetch("/fonts/OpenSans-Regular.ttf").then((r) => r.arrayBuffer()),
        fetch("/fonts/OpenSans-Italic.ttf").then((r) => r.arrayBuffer()),
      ]);

      const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: true });
      const italicFont = await pdfDoc.embedFont(italicFontBytes, { subset: true });
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
          if (el.type === "text") {
            const pdfFontSize = el.fontSize * scaleFactorX;
            const pdfX = el.x * scaleFactorX;
            const pdfY = pdfHeight - el.y * scaleFactorY - pdfFontSize;
            const hex = el.color.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            const font = el.italic ? italicFont : regularFont;
            page.drawText(el.text, { x: pdfX, y: pdfY, size: pdfFontSize, font, color: rgb(r, g, b) });
            if (el.underline) {
              const textWidth = font.widthOfTextAtSize(el.text, pdfFontSize);
              const lineY = pdfY - pdfFontSize * 0.1;
              page.drawLine({
                start: { x: pdfX, y: lineY },
                end: { x: pdfX + textWidth, y: lineY },
                thickness: Math.max(0.5, pdfFontSize * 0.05),
                color: rgb(r, g, b),
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

  const hasElements = Object.values(pageElements).some((els) => els.length > 0);
  const selectedTextEl = selectedElement
    ? (pageElements[selectedElement.pageIndex] || [])[selectedElement.elementIndex]
    : null;
  const isTextSelected = selectedTextEl && selectedTextEl.type === "text";

  return (
    <div className={styles.editor_wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbar_group}>
          {/* Text tool */}
          <button
            className={`${styles.tool_btn} ${activeTool === "text" ? styles.active : ""}`}
            onClick={() => { setActiveTool(activeTool === "text" ? null : "text"); setSelectedElement(null); }}
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
            onClick={() => { setActiveTool(activeTool === "eraser" ? null : "eraser"); setSelectedElement(null); }}
            title={t("edit-pdf:add_eraser")}
          >
            <EraserFill size={18} />
            <span className={styles.tool_label}>{t("edit-pdf:add_eraser")}</span>
          </button>

          {/* Signature tool */}
          <button
            className={`${styles.tool_btn} ${activeTool === "signature" ? styles.active : ""}`}
            onClick={() => { setActiveTool(activeTool === "signature" ? null : "signature"); setSelectedElement(null); }}
            title={t("edit-pdf:add_signature")}
          >
            <PenFill size={18} />
            <span className={styles.tool_label}>{t("edit-pdf:add_signature")}</span>
          </button>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleImageUpload} style={{ display: "none" }} />
        </div>

        {/* Text options */}
        {(activeTool === "text" || isTextSelected) && (
          <div className={styles.text_options}>
            {activeTool === "text" && !isTextSelected && (
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
            {activeTool === "text" && !isTextSelected && (
              <p className={styles.hint}>{t("edit-pdf:click_to_place")}</p>
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
            cursor: isDragging ? "grabbing" : isResizing ? "nwse-resize" : activeTool === "text" ? "text" : activeTool === "eraser" ? "crosshair" : activeTool === "signature" && signatureReady ? "copy" : "default",
          }}
        />
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
          className={`${styles.save_btn} ${!hasElements || isProcessing ? styles.disabled : ""}`}
          onClick={handleSave}
          disabled={!hasElements || isProcessing}
        >
          <Download size={20} />
          {isProcessing ? t("edit-pdf:processing") : t("edit-pdf:save_changes")}
        </button>
      </div>
    </div>
  );
};

export default PDFEditor;
