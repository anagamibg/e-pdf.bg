import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  PencilSquare,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import useToolsData from "../hooks/useToolsData";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import Steps from "../components/Steps";
import Features from "../components/Features";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import styles from "../styles/UploadContainer.module.css";
import pageStyles from "../styles/Page.module.css";
import SeoSchema from "../components/SeoSchema";
import Alerts from "../components/Alerts";
import { handlePreventDefault, download, notify } from "../helpers/utils.js";
import dynamic from "next/dynamic";
import StarRating from "../components/StarRating";

// Dynamic import of PDFEditor to avoid SSR issues with canvas/pdfjs
const PDFEditor = dynamic(() => import("../components/PDFEditor"), {
  ssr: false,
});

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "edit-pdf"])),
    },
  };
}

const EditPDFPage = () => {
  const { EditPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  // 0: Upload, 1: Edit (canvas), 2: Download
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [resultBlob, setResultBlob] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [liveRating, setLiveRating] = useState({ ratingValue: "5.0", ratingCount: "3" });
  const { t } = useTranslation();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loadedFilesCount > 0) {
      if (mountedRef.current) setIsSpinnerActive(true);
    } else {
      if (mountedRef.current) setIsSpinnerActive(false);
    }
  }, [loadedFilesCount]);

  useEffect(() => {
    fetch("/api/get-ratings")
      .then((r) => r.json())
      .then((data) => {
        const d = data.ratings?.["EditPDF"];
        if (d)
          setLiveRating({
            ratingValue: d.averageRating.toFixed(1),
            ratingCount: String(d.ratingCount),
          });
      })
      .catch(() => {});
  }, []);

  const handleChange = (event) => {
    event.preventDefault();
    let files;
    if (typeof event.dataTransfer === "undefined") {
      files = event.target.files;
    } else {
      files = event.dataTransfer.files;
    }

    if (!files || files.length === 0) return;

    const file = files[0];
    const { name: fileName, size: fileSize, type: fileType } = file;

    // Validate file
    if (!fileType.includes("application/pdf")) {
      notify("warning", t("common:file_extension_error"));
      return;
    }

    if (fileSize > 26214400) {
      notify(
        "warning",
        "The file is too large. Please try to upload a file smaller than 25MB."
      );
      return;
    }

    if (mountedRef.current) setLoadedFilesCount(1);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (mountedRef.current) {
        const blob = new Blob([reader.result], { type: "application/pdf" });
        setPdfFile(blob);
        setPdfFileName(fileName);
        setFormStep(1);
        setLoadedFilesCount(0);
      }
    };
    reader.onerror = () => {
      notify("error", t("common:file_load_error"));
      if (mountedRef.current) setLoadedFilesCount(0);
    };
  };

  const handleSaveResult = (blob) => {
    setResultBlob(blob);
    setFormStep(2);
  };

  const handleDownload = () => {
    if (resultBlob) {
      const newName = pdfFileName.replace(/\.pdf$/i, "_edited.pdf");
      download(resultBlob, newName);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPdfFileName("");
    setResultBlob(null);
    setHasError(false);
    setFormStep(0);
  };

  return (
    <>
      <Head>
        <title>{t("edit-pdf:title")}</title>
        <meta name="description" content={t("edit-pdf:meta_description")} />
        <meta name="Keywords" content={t("edit-pdf:meta_Keywords")} />
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}/edit-pdf`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("edit-pdf:title")}
        description={t("edit-pdf:meta_description")}
        toolUrl="/edit-pdf"
        toolName={t("edit-pdf:page_header_title")}
        aggregateRating={liveRating}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("edit-pdf:page_header_title")}</h1>
          <p className="description">{t("edit-pdf:page_header_text")}</p>
          <StarRating toolKey="EditPDF" />
        </header>

        <section className="page_section mt-0">
          <article className="container">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Step 0: Upload */}
              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={false}
                  acceptedMimeType="application/pdf"
                />
              )}

              {/* Step 1: PDF Editor */}
              {formStep === 1 && pdfFile && (
                <PDFEditor
                  pdfDocument={pdfFile}
                  onSave={handleSaveResult}
                  fileName={pdfFileName}
                />
              )}

              {/* Step 2: Download */}
              {formStep === 2 && (
                <DownloadFilesFormStep
                  title={t("common:your_document_is_ready")}
                  handleDownload={handleDownload}
                  handleResetInitialState={handleReset}
                >
                  <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
                    <Check2Circle size={130} color="#2a74ed" />
                  </div>
                  {hasError && (
                    <Alerts
                      message={t("common:files_error")}
                      filesData={[]}
                      type="error"
                      icon={<ExclamationTriangle size={22} />}
                    />
                  )}
                </DownloadFilesFormStep>
              )}
            </section>
          </article>
        </section>

        {/* How-to Steps */}
        <Steps
          title={t("edit-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("edit-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("edit-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("edit-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("edit-pdf:how_to_step_four"),
            },
          ]}
        />

        {/* Features */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("edit-pdf:feature_one_title"),
              description: t("edit-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("edit-pdf:feature_two_title"),
              description: t("edit-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("edit-pdf:feature_three_title"),
              description: t("edit-pdf:feature_three_text"),
              icon: <PencilSquare />,
            },
            {
              title: t("edit-pdf:feature_four_title"),
              description: t("edit-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("edit-pdf:feature_five_title"),
              description: t("edit-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("edit-pdf:feature_six_title"),
              description: t("edit-pdf:feature_six_text"),
              icon: <AwardFill />,
            },
          ]}
        />

        {/* Article */}
        <section className="page_section">
          <article className={`container ${pageStyles.article_section}`}>
            <header className={pageStyles.article_header}>
              <h2 className={pageStyles.title_section}>
                {t("edit-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>
            <section className={pageStyles.article_content}>
              <p>{t("edit-pdf:article_paragraph_01")}</p>
              <p>{t("edit-pdf:article_paragraph_02")}</p>
              <p>{t("edit-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
      </main>
    </>
  );
};

export default EditPDFPage;
