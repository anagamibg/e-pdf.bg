import path from "path";
import fsPromises from "fs/promises";
import { validateOrigin } from "../../helpers/validateOrigin.js";

const RATINGS_FILE =
  process.env.RATINGS_FILE_PATH ||
  path.join(process.cwd(), "data", "ratings.json");

const VALID_TOOL_KEYS = new Set([
  "EditPDF", "MergePDF", "RotatePDF", "RemovePDFPages", "OrganizePDF",
  "CompressPDF", "GrayscalePDF", "ExtractPages", "RepairPDF", "ProtectPDF",
  "UnlockPDF", "JPGToPDF", "PNGToPDF", "BMPToPDF", "TIFFToPDF", "WORDToPDF",
  "PPTXToPDF", "TXTToPDF", "EXCELToPDF", "PDFToJPG", "PDFToPNG", "PDFToBMP",
  "PDFToTIFF", "PDFToWORD", "PDFToPPTX", "PDFToTXT", "PDFToExcel", "PDFToZIP",
]);

// Serialize writes to prevent JSON corruption under concurrent requests
let writeQueue = Promise.resolve();

const handler = async (req, res) => {
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

  return new Promise((resolve) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const raw = await fsPromises.readFile(RATINGS_FILE, "utf-8");
        const data = JSON.parse(raw);

        const toolData = data[toolKey] || { totalRatings: 0, totalScore: 0, voters: [] };

        if (toolData.voters.includes(userId)) {
          res.status(409).json({ error: "Already rated" });
          resolve();
          return;
        }

        toolData.totalRatings += 1;
        toolData.totalScore += ratingNum;
        toolData.voters.push(userId);
        data[toolKey] = toolData;

        await fsPromises.writeFile(
          RATINGS_FILE,
          JSON.stringify(data, null, 2),
          "utf-8"
        );

        const avg =
          Math.round((toolData.totalScore / toolData.totalRatings) * 10) / 10;

        res.status(200).json({
          averageRating: avg,
          ratingCount: toolData.totalRatings,
        });
        resolve();
      } catch (err) {
        console.error("rate-tool error:", err);
        res.status(500).json({ error: "Failed to save rating" });
        resolve();
      }
    });
  });
};

export const config = {
  api: {
    bodyParser: true,
  },
};

export default validateOrigin(handler);
