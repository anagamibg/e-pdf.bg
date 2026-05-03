import getDb from "../../helpers/db.js";
import { validateOrigin } from "../../helpers/validateOrigin.js";

const VALID_TOOL_KEYS = new Set([
  "EditPDF", "MergePDF", "RotatePDF", "RemovePDFPages", "OrganizePDF",
  "CompressPDF", "GrayscalePDF", "LightenPDF", "ExtractPages", "RepairPDF",
  "ProtectPDF", "UnlockPDF", "JPGToPDF", "PNGToPDF", "BMPToPDF", "TIFFToPDF",
  "WORDToPDF", "PPTXToPDF", "TXTToPDF", "EXCELToPDF", "PDFToJPG", "PDFToPNG",
  "PDFToBMP", "PDFToTIFF", "PDFToWORD", "PDFToPPTX", "PDFToTXT", "PDFToExcel",
  "PDFToZIP", "SplitPDF", "CropPDF",
]);

const handler = (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { toolKey, rating, userId } = req.body;

  if (!toolKey || !VALID_TOOL_KEYS.has(toolKey)) {
    return res.status(400).json({ error: "Invalid toolKey" });
  }
  const ratingNum = parseInt(rating, 10);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  if (!userId || typeof userId !== "string" || userId.length > 128) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    const db = getDb();

    // Check if already voted
    const existing = db
      .prepare("SELECT id FROM ratings WHERE tool_key = ? AND user_id = ?")
      .get(toolKey, userId);

    if (existing) {
      return res.status(409).json({ error: "Already rated" });
    }

    db.prepare(
      "INSERT INTO ratings (tool_key, rating, user_id) VALUES (?, ?, ?)"
    ).run(toolKey, ratingNum, userId);

    const stats = db
      .prepare(
        "SELECT COUNT(*) as cnt, ROUND(AVG(rating * 1.0), 1) as avg FROM ratings WHERE tool_key = ?"
      )
      .get(toolKey);

    return res.status(200).json({
      averageRating: stats.avg,
      ratingCount: stats.cnt,
    });
  } catch (err) {
    console.error("rate-tool error:", err);
    return res.status(500).json({ error: "Failed to save rating" });
  }
};

export const config = {
  api: {
    bodyParser: true,
  },
};

export default validateOrigin(handler);
