import { filesRepo } from "../../helpers/files-repo.js";
const formidable = require("formidable");
const path = require("path");
import { validateOrigin } from "../../helpers/validateOrigin.js";

const handler = async (req, res) => {
  const contentType = req.headers["content-type"];
  if (contentType && contentType.indexOf("multipart/form-data") !== -1) {
    const form = formidable({ maxFileSize: 5120 * 1024 * 1024 }); //Max file size is set to 5GB
    const result = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          reject(err);
        }
        resolve({ files, fields });
      });
    });
    //check if an error occurred while parsing the form
    if (!result.files || !result.fields) {
      res
        .status(400)
        .json({ error: "An error occurred while parsing the form data" });
    } else {
      //check if file is not null
      if (result.files.file && result.files.file.newFilename) {
        //Get split option
        const splitOption = result.fields.splitOption;
        //Get page ranges (for SPLIT_BY_RANGES option)
        const pageRanges = result.fields.pageRanges || "";
        //Extract the new file name under which it was saved on the server
        const id = path.parse(result.files.file.newFilename).name;
        //Extract saved file path
        const filepath = result.files.file.filepath;
        //Create a json file to store file data
        const file = await filesRepo.saveDataToJsonForSplit(id, filepath);

        if (file != null) {
          const exist = await filesRepo.isExists(file.inputFilePath);

          if (exist) {
            let command;
            const inputPath = file.inputFilePath;
            const outputDir = file.splitPagesPath;

            switch (splitOption) {
              case "SPLIT_ALL_PAGES":
                // Shell script: get page count with qpdf, then loop and extract each page
                command = `PAGES=$(qpdf --show-npages "${inputPath}") && for i in $(seq 1 $PAGES); do gs -dSAFER -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -dFirstPage=$i -dLastPage=$i -sOutputFile="${outputDir}/page_$i.pdf" -f "${inputPath}"; done`;
                break;

              case "SPLIT_BY_RANGES": {
                if (!pageRanges || pageRanges.trim() === "") {
                  res.status(400).json({
                    error: "Page ranges are required for SPLIT_BY_RANGES option",
                  });
                  return;
                }
                // Parse and validate ranges, then build a command for each range
                // Expected format: "1-3,4-6,7-10" or "1-3, 4-6, 7-10"
                const ranges = pageRanges
                  .split(",")
                  .map((r) => r.trim())
                  .filter((r) => r !== "");

                // Validate ranges format (each should be "N" or "N-M")
                const rangePattern = /^\d+(-\d+)?$/;
                for (const range of ranges) {
                  if (!rangePattern.test(range)) {
                    res.status(400).json({
                      error: `Invalid page range format: "${range}". Use format like "1-3" or "5".`,
                    });
                    return;
                  }
                }

                // Build command for each range
                const commands = ranges.map((range) => {
                  const parts = range.split("-");
                  const firstPage = parts[0];
                  const lastPage = parts.length > 1 ? parts[1] : parts[0];
                  const fileName =
                    parts.length > 1
                      ? `pages_${firstPage}-${lastPage}.pdf`
                      : `page_${firstPage}.pdf`;
                  return `gs -dSAFER -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -dFirstPage=${firstPage} -dLastPage=${lastPage} -sOutputFile="${outputDir}/${fileName}" -f "${inputPath}"`;
                });

                command = commands.join(" && ");
                break;
              }

              default:
                res.status(400).json({
                  error: "Invalid split option",
                });
                return;
            }

            //start processing
            filesRepo.runSplitPDFCommand(
              command,
              file.dataJSONPath,
              file.splitPagesPath,
              file.outputFilePath
            );

            //return file object in response
            res.status(200).json({
              file: file,
            });
          } else {
            res.status(400).json({
              error: "An error occurred while processing the file, missing original PDF file",
            });
          }
        } else {
          res.status(400).json({
            error: "Error occurred while creating record for file with id " + id,
          });
        }
      } else {
        res.status(400).json({ error: "file value is not defined" });
      }
    }
  } else {
    res.status(400).json({ error: "Wrong content-type" });
  }
};

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default validateOrigin(handler);
