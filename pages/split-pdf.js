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
import { isMobile } from "react-device-detect";
import { useTranslation } from "next-i18next";
import Selecto from "react-selecto";
import DocumentPreviewSelectable from "../components/DocumentPreviewSelectable";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import {
  notify,
  uploadFiles,
  saveNewFiles,
  downloadFiles,
  handleExtractPagesFileSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import Features from "../components/Features";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import usePages from "../hooks/usePages";
import useToolsData from "../hooks/useToolsData";
import Option from "../components/Option";
import SelectOptionFormStep from "../components/SelectOptionFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";

import useSelectoSync from "../hooks/useSelectoSync";
import SeoSchema from "../components/SeoSchema";
import StarRating from "../components/StarRating";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "split-pdf"])),
    },
  };
}

const SplitPDFPage = () => {
  const { SplitPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const [scrollOptions, setScrollOptions] = useState({});
  const [liveRating, setLiveRating] = useState({
    ratingValue: "5.0",
    ratingCount: "3",
  });
  const [splitOption, setSplitOption] = useState("SPLIT_ALL_PAGES");
  const [pageRanges, setPageRanges] = useState("");
  const { t } = useTranslation();

  const {
    currentUploadingFile,
    totalUploadingProgress,
    uploadSpeed,
    uploadTimeLeft,
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateCurrentUploadingStatus,
    handleUpdateResultsDisplay,
  } = useUploadStats();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const {
    pages,
    handleAddPage,
    handleRemovePageSelection,
    handleClearPageSelection,
    handlePageSelection,
    handlePagesSelection,
    handleResetInitialPagesState,
  } = usePages();

  const selectoRef = useRef(null);
  useSelectoSync(pages, selectoRef);

  const handleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    handleResetInitialPagesState();
    setFormStep(0);
    setSplitOption("SPLIT_ALL_PAGES");
    setPageRanges("");
  };

  const handleChange = (event) => {
    handleExtractPagesFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      handleAddPage,
      t,
      mountedRef,
      SplitPDFTool
    );
  };

  const splitPages = async (signal, documents, setFormStep) => {
    setFormStep(3);

    const data = {
      splitOption: splitOption,
      pageRanges: pageRanges,
    };

    const { uploadResponsesArray, uploadResponsesUnsuccessfulRequests } =
      await uploadFiles({
        signal: signal,
        documents: documents,
        handleUpdateCurrentUploadingStatus: handleUpdateCurrentUploadingStatus,
        uri: SplitPDFTool.URI,
        data: data,
      });

    setFormStep(4);

    const { downloadResponsesArray, downloadResponsesUnsuccessfulRequests } =
      await downloadFiles({
        responseMimeType: SplitPDFTool.outputFileMimeType,
        signal: signal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
      });

    const failedFiles = [
      ...uploadResponsesUnsuccessfulRequests,
      ...downloadResponsesUnsuccessfulRequests,
    ];

    if (downloadResponsesArray.length === 1) {
      handleUpdateResultsDisplay(true, []);
    } else {
      handleUpdateResultsDisplay(false, failedFiles);
    }

    setFormStep(5);
  };

  const handleSplitPages = () => {
    handleResetCurrentUploadingStatus();

    if (splitOption === "SPLIT_BY_RANGES") {
      if (!pageRanges || pageRanges.trim() === "") {
        notify(
          "warning",
          "Please enter page ranges. Example: 1-3, 4-6, 7-10"
        );
        return;
      }
      // Validate ranges format
      const ranges = pageRanges
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r !== "");
      const rangePattern = /^\d+(-\d+)?$/;
      for (const range of ranges) {
        if (!rangePattern.test(range)) {
          notify(
            "warning",
            `Invalid page range format: "${range}". Use format like "1-3" or "5".`
          );
          return;
        }
      }
    }

    splitPages(requestSignal, documents, setFormStep);
  };

  const handleDownload = () => {
    saveNewFiles(documents);
  };

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const signal = controller.signal;
    setRequestSignal(signal);

    setScrollOptions({
      container: document.body,
      getScrollPosition: () => [
        document.body.scrollLeft,
        document.body.scrollTop,
      ],
      throttleTime: 0,
      threshold: 0,
    });

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
        const d = data.ratings?.["SplitPDF"];
        if (d)
          setLiveRating({
            ratingValue: d.averageRating.toFixed(1),
            ratingCount: String(d.ratingCount),
          });
      })
      .catch(() => {});
  }, []);

  const pagesComponentsArray = (
    <div
      className={`previewer_content ${styles.previewer_content} d-flex flex-wrap ${styles.previewer_content_scrollable} mb-0`}
    >
      {!isMobile && (
        <Selecto
          ref={selectoRef}
          dragContainer={".previewer_content"}
          selectableTargets={[".preview"]}
          selectByClick={false}
          selectFromInside={false}
          toggleContinueSelect={[["ctrl"], ["meta"]]}
          boundContainer={false}
          hitRate={0}
          ratio={0}
          onSelectStart={(e) => {
            if (
              pages.filter((page) => page.selected === true).length > 0 &&
              !e.inputEvent.ctrlKey &&
              !e.inputEvent.metaKey
            ) {
              handleClearPageSelection();
            }
          }}
          onSelect={(e) => {
            e.added.forEach((el) => {
              const index = parseInt(el.getAttribute("data-index"));
              handlePageSelection(index);
            });
            e.removed.forEach((el) => {
              const removedIndex = parseInt(el.getAttribute("data-index"));
              if (e.selected.length === 0) {
                handleClearPageSelection();
              } else {
                handleRemovePageSelection(removedIndex);
              }
            });
          }}
          scrollOptions={scrollOptions}
          onScroll={(e) => {
            document.body.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
          }}
        />
      )}

      {pages.map((page, i) => {
        return (
          <DocumentPreviewSelectable
            key={"page-" + page.id}
            page={page}
            index={i}
            onSelectionChange={handlePagesSelection}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <Head>
        <title>{t("split-pdf:title")}</title>
        <meta
          name="description"
          content={t("split-pdf:meta_description")}
        />
        <meta name="Keywords" content={t("split-pdf:meta_Keywords")} />
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${SplitPDFTool.href}`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("split-pdf:title")}
        description={t("split-pdf:meta_description")}
        toolUrl="/split-pdf"
        toolName={t("split-pdf:page_header_title")}
        aggregateRating={liveRating}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("split-pdf:page_header_title")}</h1>
          <p className="description">
            {t("split-pdf:page_header_text")}
          </p>
          <StarRating toolKey="SplitPDF" />
        </header>

        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={false}
                  acceptedMimeType={SplitPDFTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <SelectOptionFormStep
                  title={t("split-pdf:select_split_option")}
                  action={() => {
                    if (splitOption === "SPLIT_ALL_PAGES") {
                      handleSplitPages();
                    } else if (splitOption === "SPLIT_BY_RANGES") {
                      setFormStep(2);
                    }
                  }}
                  actionTitle={
                    splitOption === "SPLIT_ALL_PAGES"
                      ? t("split-pdf:start_splitting")
                      : t("split-pdf:enter_page_ranges")
                  }
                >
                  <Option
                    onChange={() => setSplitOption("SPLIT_ALL_PAGES")}
                    isChecked={splitOption === "SPLIT_ALL_PAGES"}
                    value="1"
                  >
                    <span>
                      {t("split-pdf:split_all_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t("split-pdf:split_all_pages_description")}
                      </span>
                    </span>
                  </Option>

                  <Option
                    onChange={() => setSplitOption("SPLIT_BY_RANGES")}
                    isChecked={splitOption === "SPLIT_BY_RANGES"}
                    value="2"
                  >
                    <span>
                      {t("split-pdf:split_by_ranges")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t("split-pdf:split_by_ranges_description")}
                      </span>
                    </span>
                  </Option>
                </SelectOptionFormStep>
              )}

              {formStep === 2 && splitOption === "SPLIT_BY_RANGES" && (
                <EditFilesFormStep
                  showTitle={t("split-pdf:enter_page_ranges")}
                  acceptedMimeType={SplitPDFTool.acceptedInputMimeType}
                  files={pages}
                  enableAddingMoreFiles={false}
                  filesComponents={
                    <>
                      <div
                        className="w-100 d-flex justify-content-center mb-4"
                        style={{ padding: "0 15px" }}
                      >
                        <div style={{ maxWidth: "500px", width: "100%" }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={t("split-pdf:page_ranges_placeholder")}
                            value={pageRanges}
                            onChange={(e) => setPageRanges(e.target.value)}
                            style={{
                              fontSize: "16px",
                              padding: "12px 16px",
                              borderRadius: "8px",
                              border: "1px solid #dee2e6",
                            }}
                          />
                          <small
                            className="text-muted d-block mt-2 text-center"
                          >
                            {t("split-pdf:page_ranges_help")}
                          </small>
                        </div>
                      </div>
                      {pagesComponentsArray}
                    </>
                  }
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={false}
                  isFilesSelectionActive={false}
                  isPanelTopSticky={false}
                  isPanelBottomSticky={true}
                  positionPanelBottomItems={styles.spaced}
                  action={handleSplitPages}
                  actionTitle={t("split-pdf:start_splitting")}
                />
              )}

              {formStep === 3 && (
                <UploadingFilesFormStep
                  title={t("common:uploading_file")}
                  uploadTimeLeft={uploadTimeLeft}
                  uploadSpeed={uploadSpeed}
                  totalUploadingProgress={totalUploadingProgress}
                  currentUploadingFileName={currentUploadingFile?.fileName}
                  currentUploadingFileSize={currentUploadingFile?.fileSize}
                />
              )}

              {formStep === 4 && (
                <ProcessingFilesFormStep
                  progress={t("split-pdf:splitting_pages")}
                />
              )}

              {formStep === 5 && (
                <DownloadFilesFormStep
                  title={t("split-pdf:split_is_complete")}
                  handleDownload={handleDownload}
                  handleResetInitialState={handleResetInitialStates}
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
              {/* Container end */}
            </section>
          </article>
        </section>

        {/* steps Start */}
        <Steps
          title={t("split-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("split-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("split-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("split-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("split-pdf:how_to_step_four"),
            },
            {
              number: 5,
              description: t("split-pdf:how_to_step_five"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("split-pdf:feature_one_title"),
              description: t("split-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("split-pdf:feature_two_title"),
              description: t("split-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("split-pdf:feature_three_title"),
              description: t("split-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("split-pdf:feature_four_title"),
              description: t("split-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("split-pdf:feature_five_title"),
              description: t("split-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("split-pdf:feature_six_title"),
              description: t("split-pdf:feature_six_text"),
              icon: <AwardFill />,
            },
          ]}
        />
        {/* features end */}
        {/* Article Start */}
        <section className="page_section">
          <article className={`container ${pageStyles.article_section}`}>
            <header className={pageStyles.article_header}>
              <h2 className={pageStyles.title_section}>
                {t("split-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("split-pdf:article_paragraph_01")}</p>
              <p>{t("split-pdf:article_paragraph_02")}</p>
              <p>{t("split-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
      </main>
    </>
  );
};
export default SplitPDFPage;
