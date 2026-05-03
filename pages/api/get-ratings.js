import getDb from "../../helpers/db.js";
import { validateOrigin } from "../../helpers/validateOrigin.js";

const handler = (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const db = getDb();

    const rows = db
      .prepare(
        "SELECT tool_key, COUNT(*) as cnt, ROUND(AVG(rating * 1.0), 1) as avg FROM ratings GROUP BY tool_key"
      )
      .all();

    const result = {};
    for (const row of rows) {
      result[row.tool_key] = {
        averageRating: row.avg,
        ratingCount: row.cnt,
      };
    }

    return res.status(200).json({ ratings: result });
  } catch (err) {
    console.error("get-ratings error:", err);
    return res.status(500).json({ error: "Failed to read ratings" });
  }
};

export default validateOrigin(handler);
