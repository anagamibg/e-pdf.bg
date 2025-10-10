import { filesRepo } from "../../helpers/files-repo.js";
const formidable = require("formidable");
const path = require("path");
const fsPromises = require("fs/promises");
import { validateOrigin } from "../../helpers/validateOrigin.js";

const handler = async (req, res) => {
  const contentType = req.headers["content-type"];
  if (contentType && contentType.indexOf("multipart/form-data") !== -1) {
    const form = formidable({ maxFileSize: 5120 * 1024 * 1024 });
    const result = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          reject(err);
        }
        resolve({ files, fields });
      });
    });

    if (!result.files || !result.fields) {
      res
        .status(400)
        .json({ error: "An error occurred while parsing the form data" });
    } else {
      if (result.files.file && result.files.file.newFilename) {
        const lightenLevel = result.fields.lightenLevel;
        const outputFileExtension = ".pdf";
        const id = path.parse(result.files.file.newFilename).name;
        const filepath = result.files.file.filepath;
        const file = await filesRepo.saveDataToJson(
          id,
          filepath,
          outputFileExtension
        );

        if (file != null) {
          const exist = await filesRepo.isExists(file.inputFilePath);
          if (exist) {
            const { gamma } = selectLightenSettings(lightenLevel);

            // Lightening approach using Ghostscript transfer functions via a
            // PostScript prologue file written to disk (avoids shell escaping issues).
            //
            // The transfer function applies gamma correction to all color channels:
            //   { <gamma> exp }
            // gamma < 1 makes output lighter (lifts midtones & shadows)
            // gamma > 1 makes output darker
            //
            // setcolortransfer sets transfer functions for C, M, Y, K channels.
            // For RGB content Ghostscript maps this appropriately.
            // This works with pdfwrite device — it modifies color values in the output PDF
            // without rasterizing to images, preserving text selectability and vector content.
            const prologuePath = file.inputFilePath + "_lighten.ps";
            const prologueContent =
              `<< /Install {\n` +
              `  { ${gamma} exp } dup dup dup setcolortransfer\n` +
              `} bind >> setpagedevice\n`;

            await fsPromises.writeFile(prologuePath, prologueContent);

            const command = `gs -dSAFER -dBATCH -dNOPAUSE -q \
            -sDEVICE=pdfwrite \
            -dPDFSETTINGS=/prepress \
            -dAutoRotatePages=/None \
            -sOutputFile=${file.outputFilePath} \
            ${prologuePath} \
            -f ${file.inputFilePath} ; \
            rm -f ${prologuePath}`;

            filesRepo.runCommand(command, file.dataJSONPath);

            res.status(200).json({
              file: file,
            });
          } else {
            res.status(400).json({
              error:
                "An error occurred while processing the file, missing PDF file",
            });
          }
        } else {
          res.status(400).json({
            error:
              "Error occurred while creating record for file with id " + id,
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

const selectLightenSettings = (lightenLevel) => {
  // Transfer function gamma: { gamma exp }
  // gamma < 1 = lighter output (lifts midtones and shadows)
  // gamma > 1 = darker output

  if (lightenLevel === "1") {
    // Light: subtle brightening
    return { gamma: 0.7 };
  } else if (lightenLevel === "3") {
    // Strong: aggressive brightening for very dark scans
    return { gamma: 0.4 };
  }
  // Medium (default/recommended): balanced for most scans
  return { gamma: 0.55 };
};

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default validateOrigin(handler);
