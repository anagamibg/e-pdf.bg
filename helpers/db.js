import Database from "better-sqlite3";
import path from "path";

const DB_PATH =
  process.env.RATINGS_DB_PATH ||
  path.join(process.cwd(), "data", "ratings.db");

let _db = null;

function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("busy_timeout = 5000");

  // --- Migrations (run on every startup, idempotent) ---

  _db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_key TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(tool_key, user_id)
    )
  `);

  _db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ratings_tool_key ON ratings(tool_key)
  `);

  // Seed data: if table is empty, insert 3x5★ per tool (matches original JSON seeds)
  const count = _db.prepare("SELECT COUNT(*) as cnt FROM ratings").get();
  if (count.cnt === 0) {
    const TOOL_KEYS = [
      "EditPDF", "MergePDF", "RotatePDF", "RemovePDFPages", "OrganizePDF",
      "CompressPDF", "GrayscalePDF", "LightenPDF", "ExtractPages", "RepairPDF",
      "ProtectPDF", "UnlockPDF", "JPGToPDF", "PNGToPDF", "BMPToPDF",
      "TIFFToPDF", "WORDToPDF", "PPTXToPDF", "TXTToPDF", "EXCELToPDF",
      "PDFToJPG", "PDFToPNG", "PDFToBMP", "PDFToTIFF", "PDFToWORD",
      "PDFToPPTX", "PDFToTXT", "PDFToExcel", "PDFToZIP", "SplitPDF", "CropPDF",
    ];
    const insert = _db.prepare(
      "INSERT OR IGNORE INTO ratings (tool_key, rating, user_id) VALUES (?, 5, ?)"
    );
    const seedAll = _db.transaction(() => {
      for (const key of TOOL_KEYS) {
        insert.run(key, "seed1");
        insert.run(key, "seed2");
        insert.run(key, "seed3");
      }
    });
    seedAll();
  }

  return _db;
}

export default getDb;
