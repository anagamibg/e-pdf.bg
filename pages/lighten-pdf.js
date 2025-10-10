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
import DocumentPreview from "../components/DocumentPreview";
import {
  handleFileSelection,
  uploadFiles,
  saveNewFiles,
  downloadFiles,
} from "../helpers/utils.js";

import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import SelectOptionFormStep from "../components/SelectOptionFormStep";
import Option from "../components/Option";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
import SeoSchema from "../components/SeoSchema";
import StarRating from "../components/StarRating";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "lighten-pdf"])),
    },
  };
}

const LightenPDFPage = () => {
  const { LightenPDFTool } = useToolsData();
  const {
    currentUploadingFile,
    currentUploadedFilesCounter,
    currentProcessedFilesCounter,
    totalUploadingProgress,
    uploadSpeed,
    uploadTimeLeft,
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateCurrentUploadingStatus,
    handleUpdateResultsDisplay,
    handleResetCurrentProcessingStatus,
    handleUpdateCurrentProcessingStatus,
  } = useUploadStats();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const { t } = useTranslation();

  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const [lightenLevel, setLightenLevel] = useState(2);
  const [liveRating, setLiveRating] = useState({
    ratingValue: "5.0",
    ratingCount: "3",
  });

  const handleChange = (event) => {
    handleFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      LightenPDFTool
    );
  };

  const handleLightenFiles = async () => {
    handleResetCurrentUploadingStatus();
    handleResetCurrentProcessingStatus();

    setFormStep(3);

    const data = {
      lightenLevel: lightenLevel,
    };

    const { uploadResponsesArray, uploadResponsesUnsuccessfulRequests } =
      await uploadFiles({
        signal: requestSignal,
        documents: documents,
        handleUpdateCurrentUploadingStatus: handleUpdateCurrentUploadingStatus,
        uri: LightenPDFTool.URI,
        data: data,
      });

    setFormStep(4);

    const { downloadResponsesArray, downloadResponsesUnsuccessfulRequests } =
      await downloadFiles({
        responseMimeType: LightenPDFTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
        handleUpdateCurrentProcessingStatus:
          handleUpdateCurrentProcessingStatus,
      });

    const failedFiles = [
      ...uploadResponsesUnsuccessfulRequests,
      ...downloadResponsesUnsuccessfulRequests,
    ];
    const successfullyProcessedFiles = [...downloadResponsesArray];

    if (successfullyProcessedFiles.length === documents.length) {
      handleUpdateResultsDisplay(true, []);
    } else {
      if (failedFiles.length === documents.length) {
        handleUpdateResultsDisplay(false, failedFiles);
      } else {
        handleUpdateResultsDisplay(true, failedFiles);
      }
    }

    setFormStep(5);
  };

  const handleHandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    setLightenLevel(2);
    setFormStep(0);
  };

  const handleDownload = () => {
    saveNewFiles(documents);
  };

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const signal = controller.signal;
    setRequestSignal(signal);
    return () => {
      controller.abort();
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loadedFilesCount > 0) {
      if (mountedRef.current) {
        setIsSpinnerActive(true);
      }
    } else {
      if (mountedRef.current) {
        setIsSpinnerActive(false);
      }
    }
  }, [loadedFilesCount]);

  const pagesComponentsArray = (
    <div className={`${styles.previewer_content} d-flex flex-wrap`}>
      {documents.map((doc) => {
        return (
          <DocumentPreview
            key={"doc-" + doc.id}
            id={doc.id}
            blob={doc.inputBlob}
            fileName={doc.fileName}
            width={doc.width}
            height={doc.height}
            degree={doc.previewRotation}
            numberOfPages={doc.numberOfPages}
            handleDeleteDocument={(event) => {
              event.preventDefault();
              handleDeleteDocument(doc.id);
            }}
          />
        );
      })}
    </div>
  );

  useEffect(() => {
    if (documents.length <= 0) {
      setFormStep(0);
    } else {
      setFormStep(1);
    }
  }, [documents.length]);

  useEffect(() => {
    fetch("/api/get-ratings")
      .then((r) => r.json())
      .then((data) => {
        const d = data.ratings?.["LightenPDF"];
        if (d)
          setLiveRating({
            ratingValue: d.averageRating.toFixed(1),
            ratingCount: String(d.ratingCount),
          });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>{t("lighten-pdf:title")}</title>
        <meta
          name="description"
          content={t("lighten-pdf:meta_description")}
        />
        <meta name="Keywords" content={t("lighten-pdf:meta_Keywords")} />
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${LightenPDFTool.href}`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("lighten-pdf:title")}
        description={t("lighten-pdf:meta_description")}
        toolUrl="/lighten-pdf"
        toolName={t("lighten-pdf:page_header_title")}
        aggregateRating={liveRating}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("lighten-pdf:page_header_title")}</h1>
          <p className="description">{t("lighten-pdf:page_header_text")}</p>
          <StarRating toolKey="LightenPDF" />
        </header>

        <section className="page_section mt-0">
          <article className="container">
            <section className={pageStyles.tool_container_wrapper}>
              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={LightenPDFTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <EditFilesFormStep
                  acceptedMimeType={LightenPDFTool.acceptedInputMimeType}
                  files={documents}
                  enableAddingMoreFiles={true}
                  filesComponents={pagesComponentsArray}
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  isFilesSelectionActive={false}
                  isPanelTopSticky={false}
                  isPanelBottomSticky={false}
                  positionPanelBottomItems={styles.centered}
                  deleteFiles={handleResetInitialDocumentsState}
                  action={() => setFormStep(2)}
                  actionTitle={t("lighten-pdf:select_lighten_level")}
                />
              )}

              {formStep === 2 && (
                <SelectOptionFormStep
                  title={t("lighten-pdf:select_lighten_level_title")}
                  action={handleLightenFiles}
                  actionTitle={t("lighten-pdf:lighten_pdf")}
                >
                  <Option
                    onChange={() => setLightenLevel(1)}
                    isChecked={lightenLevel === 1}
                    value="light"
                  >
                    <span>{t("lighten-pdf:light_lighten")}</span>
                    <span className={`${styles.pdf_to_image_option_desc}`}>
                      {t("lighten-pdf:light_lighten_desc")}
                    </span>
                  </Option>

                  <Option
                    onChange={() => setLightenLevel(2)}
                    isChecked={lightenLevel === 2}
                    value="medium"
                  >
                    <span>
                      {t("lighten-pdf:medium_lighten")} (
                      {t("lighten-pdf:recommended")})
                    </span>
                    <span className={`${styles.pdf_to_image_option_desc}`}>
                      {t("lighten-pdf:medium_lighten_desc")}
                    </span>
                  </Option>

                  <Option
                    onChange={() => setLightenLevel(3)}
                    isChecked={lightenLevel === 3}
                    value="strong"
                  >
                    <span>{t("lighten-pdf:strong_lighten")}</span>
                    <span className={`${styles.pdf_to_image_option_desc}`}>
                      {t("lighten-pdf:strong_lighten_desc")}
                    </span>
                  </Option>
                </SelectOptionFormStep>
              )}

              {formStep === 3 && (
                <UploadingFilesFormStep
                  title={`${t(
                    "common:uploading_file"
                  )} ${currentUploadedFilesCounter} ${t("common:of")} ${
                    documents.length
                  }`}
                  uploadTimeLeft={uploadTimeLeft}
                  uploadSpeed={uploadSpeed}
                  totalUploadingProgress={totalUploadingProgress}
                  currentUploadingFileName={currentUploadingFile?.fileName}
                  currentUploadingFileSize={
                    currentUploadingFile?.inputBlob.size
                  }
                />
              )}

              {formStep === 4 && (
                <ProcessingFilesFormStep
                  progress={`${t(
                    "common:processing"
                  )} ${currentProcessedFilesCounter} ${t("common:of")} ${
                    documents.length
                  }`}
                />
              )}

              {formStep === 5 && (
                <DownloadFilesFormStep
                  title={
                    documents.length === 1
                      ? t("common:your_document_is_ready")
                      : documents.length > 1
                      ? t("common:your_documents_are_ready")
                      : ""
                  }
                  handleDownload={handleDownload}
                  handleResetInitialState={handleHandleResetInitialStates}
                >
                  {resultsInfoVisibility && (
                    <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
                      <Check2Circle size={130} color="#2a74ed" />
                    </div>
                  )}
                  {resultsErrors.length > 0 && (
                    <Alerts
                      message={t("common:files_error")}
                      filesData={resultsErrors}
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
          title={t("lighten-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("lighten-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("lighten-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("lighten-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("lighten-pdf:how_to_step_four"),
            },
          ]}
        />

        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("lighten-pdf:feature_one_title"),
              description: t("lighten-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("lighten-pdf:feature_two_title"),
              description: t("lighten-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("lighten-pdf:feature_three_title"),
              description: t("lighten-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("lighten-pdf:feature_four_title"),
              description: t("lighten-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("lighten-pdf:feature_five_title"),
              description: t("lighten-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("lighten-pdf:feature_six_title"),
              description: t("lighten-pdf:feature_six_text"),
              icon: <AwardFill />,
            },
          ]}
        />

        <section className="page_section">
          <article className={`container ${pageStyles.article_section}`}>
            <header className={pageStyles.article_header}>
              <h2 className={pageStyles.title_section}>
                {t("lighten-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("lighten-pdf:article_paragraph_01")}</p>
              <p>{t("lighten-pdf:article_paragraph_02")}</p>
              <p>{t("lighten-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
      </main>
    </>
  );
};
export default LightenPDFPage;
