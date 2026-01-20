import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  AwardFill,
  GearFill,
  HeartFill,
  ShieldFillCheck,
  Infinity as InfinityIcon,
  LightningChargeFill,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import { handlePreventDefault, download, notify } from "../helpers/utils.js";
import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import useToolsData from "../hooks/useToolsData";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
import SeoSchema from "../components/SeoSchema";
import StarRating from "../components/StarRating";
import dynamic from "next/dynamic";

const PDFCropEditor = dynamic(() => import("../components/PDFCropEditor"), {
  ssr: false,
});

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "crop-pdf"])),
    },
  };
}

const CropPDFPage = () => {
  const { CropPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  // 0: Upload, 1: Editor (canvas + crop), 2: Download
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [resultBlob, setResultBlob] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [liveRating, setLiveRating] = useState({
    ratingValue: "5.0",
    ratingCount: "3",
  });
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
        const d = data.ratings?.["CropPDF"];
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

    if (!fileType.includes("application/pdf")) {
      notify("warning", t("common:file_extension_error"));
      return;
    }

    if (fileSize > CropPDFTool.acceptedInputFileMaxSize) {
      notify("warning", t("common:file_extension_error"));
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
      const newName = pdfFileName.replace(/\.pdf$/i, "_cropped.pdf");
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
        <title>{t("crop-pdf:title")}</title>
        <meta
          name="description"
          content={t("crop-pdf:meta_description")}
        />
        <meta name="Keywords" content={t("crop-pdf:meta_Keywords")} />
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${CropPDFTool.href}`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("crop-pdf:title")}
        description={t("crop-pdf:meta_description")}
        toolUrl="/crop-pdf"
        toolName={t("crop-pdf:page_header_title")}
        aggregateRating={liveRating}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("crop-pdf:page_header_title")}</h1>
          <p className="description">{t("crop-pdf:page_header_text")}</p>
          <StarRating toolKey="CropPDF" />
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

              {/* Step 1: Crop Editor */}
              {formStep === 1 && pdfFile && (
                <PDFCropEditor
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

        <Steps
          title={t("crop-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("crop-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("crop-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("crop-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("crop-pdf:how_to_step_four"),
            },
          ]}
        />

        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("crop-pdf:feature_one_title"),
              description: t("crop-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("crop-pdf:feature_two_title"),
              description: t("crop-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("crop-pdf:feature_three_title"),
              description: t("crop-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("crop-pdf:feature_four_title"),
              description: t("crop-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("crop-pdf:feature_five_title"),
              description: t("crop-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("crop-pdf:feature_six_title"),
              description: t("crop-pdf:feature_six_text"),
              icon: <AwardFill />,
            },
          ]}
        />

        <section className="page_section">
          <article className={`container ${pageStyles.article_section}`}>
            <header className={pageStyles.article_header}>
              <h2 className={pageStyles.title_section}>
                {t("crop-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("crop-pdf:article_paragraph_01")}</p>
              <p>{t("crop-pdf:article_paragraph_02")}</p>
              <p>{t("crop-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
      </main>
    </>
  );
};
export default CropPDFPage;
