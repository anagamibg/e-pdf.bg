import React, { useState, useMemo } from "react";
import NavItem from "./NavItem";
import { useTranslation } from "next-i18next";
import { Search } from "react-bootstrap-icons";
import useToolsData from "../hooks/useToolsData";
import styles from "../styles/MegaMenu.module.css";

const ToolsList = React.memo(function ToolsList() {
  const toolsData = useToolsData();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const groups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filterTools = (keys) => {
      if (!query) return keys;
      return keys.filter((key) => {
        const tool = toolsData[key];
        return (
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          key.toLowerCase().includes(query)
        );
      });
    };

    return [
      {
        heading: t("common:tool_group_merge_&_edit"),
        tools: filterTools([
          "MergePDFTool", "RotatePDFTool", "RemovePDFPagesTool",
          "OrganizePDFTool", "EditPDFTool", "CropPDFTool", "SplitPDFTool",
        ]),
      },
      {
        heading: t("common:tool_group_optimize_&_extract"),
        tools: filterTools([
          "CompressPDFTool", "GrayscalePDFTool", "LightenPDFTool",
          "ExtractPagesTool", "RepairPDFTool",
        ]),
      },
      {
        heading: t("common:tool_group_convert_to_pdf"),
        tools: filterTools([
          "JPGToPDFTool", "PNGToPDFTool", "BMPToPDFTool", "TIFFToPDFTool",
          "WORDToPDFTool", "PPTXToPDFTool", "TXTToPDFTool", "EXCELToPDFTool",
        ]),
      },
      {
        heading: t("common:tool_group_convert_from_pdf"),
        tools: filterTools([
          "PDFToJPGTool", "PDFToPNGTool", "PDFToBMPTool", "PDFToTIFFTool",
          "PDFToWORDTool", "PDFToPPTXTool", "PDFToTXTTool", "PDFToEXCELTool",
          "PDFToZIPTool",
        ]),
      },
      {
        heading: t("common:tool_group_pdf_security"),
        tools: filterTools(["ProtectPDFTool", "UnlockPDFTool"]),
      },
    ];
  }, [searchQuery, toolsData, t]);

  const hasResults = groups.some((g) => g.tools.length > 0);

  return (
    <div>
      <div className={styles.menu_search_wrapper}>
        <Search className={styles.menu_search_icon} />
        <input
          type="text"
          className={styles.menu_search_input}
          placeholder={t("common:search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {!hasResults && (
        <p className={styles.menu_no_results}>{t("common:search_no_results")}</p>
      )}
      {groups.map(
        (group) =>
          group.tools.length > 0 && (
            <div className="dropdown_item" key={group.heading}>
              <h3 className="item_heading">{group.heading}</h3>
              {group.tools.map((key) => (
                <NavItem
                  key={key}
                  title={toolsData[key].title}
                  url={toolsData[key].href}
                  icon={toolsData[key].icon}
                />
              ))}
            </div>
          )
      )}
    </div>
  );
});

export default ToolsList;
