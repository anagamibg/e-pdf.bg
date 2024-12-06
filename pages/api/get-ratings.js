import path from "path";
import fsPromises from "fs/promises";
import { validateOrigin } from "../../helpers/validateOrigin.js";

const RATINGS_FILE =
  process.env.RATINGS_FILE_PATH ||
  path.join(process.cwd(), "data", "ratings.json");

const handler = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const raw = await fsPromises.readFile(RATINGS_FILE, "utf-8");
    const data = JSON.parse(raw);

    const result = {};
    for (const [key, val] of Object.entries(data)) {
      const avg =
        val.totalRatings > 0
          ? Math.round((val.totalScore / val.totalRatings) * 10) / 10
          : 5;
      result[key] = {
        averageRating: avg,
        ratingCount: val.totalRatings,
      };
    }

    return res.status(200).json({ ratings: result });
  } catch (err) {
    console.error("get-ratings error:", err);
    return res.status(500).json({ error: "Failed to read ratings" });
  }
};

export default validateOrigin(handler);
