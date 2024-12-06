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
      ...(await serverSideTranslations(locale, [
        "common",
        "extract-pdf-pages",
      ])),
    },
  };
}

const ExtractPagesPage = () => {
  const { ExtractPagesTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  //loadedFilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const [scrollOptions, setScrollOptions] = useState({});
  const [liveRating, setLiveRating] = useState({ ratingValue: "5.0", ratingCount: "3" });
  const [extractionOption, setExtractionOption] = useState(
    "EXTRACT_SELECTED_PAGES"
  );
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
  // Keep Selecto's elements selected via box (drag) selection in sync with elements selected by click
  useSelectoSync(pages, selectoRef);

  const handleHandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    handleResetInitialPagesState();
    setFormStep(0);
    setExtractionOption("EXTRACT_EVEN_PAGES");
  };

  const handleChange = (event) => {
    //Calling handleExtractPagesFileSelection function to extract pdf pages and their data and insert them in an array
    handleExtractPagesFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      handleAddPage,
      t,
      mountedRef,
      ExtractPagesTool
    );
  };

  const extractPages = async (
    signal,
    documents,
    setFormStep,
    extractionOption,
    selectedIndexesArray
  ) => {
    /**
     * Files compressing will be done on three steps:
     *** First step : uploading files one by one to server
     *** Second step : sending requests to server to Start Files Processing, sending individual request for each file
     *** Second step : sending periodic download requests to check if files are done compressing and return the result, sending individual download requests for each file.
     */

    // //updating form step in UI
    setFormStep(3);
    //First step : Uploading Files & Start Files Processing

    // Array-like object
    const data = {
      selectedIndexesArray: selectedIndexesArray,
      extractionOption: extractionOption,
    };

    const { uploadResponsesArray, uploadResponsesUnsuccessfulRequests } =
      await uploadFiles({
        signal: signal,
        documents: documents,
        handleUpdateCurrentUploadingStatus: handleUpdateCurrentUploadingStatus,
        uri: ExtractPagesTool.URI,
        data: data,
      });

    setFormStep(4);

    // //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnsuccessfulRequests } =
      await downloadFiles({
        responseMimeType: ExtractPagesTool.outputFileMimeType,
        signal: signal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
      });

    //Storing all failed documents from each step in an array
    const failedFiles = [
      ...uploadResponsesUnsuccessfulRequests,
      ...downloadResponsesUnsuccessfulRequests,
    ];

    //check if all documents have been processed, no failed documents
    if (downloadResponsesArray.length === 1) {
      handleUpdateResultsDisplay(true, []);
    } else {
      //check if all documents have failed being processed
      handleUpdateResultsDisplay(false, failedFiles);
    }
    //updating form step in UI
    setFormStep(5);
  };

  const handlePagesExtraction = () => {
    //reset upload status
    handleResetCurrentUploadingStatus();

    //Check if extraction option is "EXTRACT_EVEN_PAGES" and even pages doesn't exist
    if (extractionOption === "EXTRACT_EVEN_PAGES" && pages.length === 1) {
      notify(
        "warning",
        "No matching pages found. Correct your input and try again."
      );
      return;
    }

    //extract selected Pages indexes
    const selectedIndexesArray = [];

    pages.map((page, i) => {
      if (page.selected === true) {
        selectedIndexesArray.push(i + 1);
      }
    });

    //Check if extraction option is 3 === (select specific pages) and no page is selected
    if (
      extractionOption === "EXTRACT_SELECTED_PAGES" &&
      selectedIndexesArray.length === 0
    ) {
      notify(
        "warning",
        "No selected pages found. Please select at least one page."
      );
      return;
    }

    extractPages(
      requestSignal,
      documents,
      setFormStep,
      extractionOption,
      selectedIndexesArray
    );
  };

  const handleDownload = () => {
    saveNewFiles(documents);
  };

  useEffect(() => {
    //set mountedRef to true
    mountedRef.current = true;

    //Axios AbortController to abort requests
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

    //cleanup function
    return () => {
      // cancel all the requests
      controller.abort();
      //set mountedRef to false
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // if loadedFilesCount (count of file currently being loaded) is greater than zero than show spinner
    if (loadedFilesCount > 0) {
      //show spinner
      if (mountedRef.current) {
        setIsSpinnerActive(true);
      }
    } else {
      //after all files are loaded, hide spinner
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
        const d = data.ratings?.["ExtractPages"];
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
        {/* Anything you add here will be added to this page only */}
        <title>{t("extract-pdf-pages:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "extract-pdf-pages" page, edit the values of "meta_description" and "meta_keywords" in the `extract-pdf-pages.json` file inside each locale folder.   */}
        <meta
          name="description"
          content={t("extract-pdf-pages:meta_description")}
        />
        <meta name="Keywords" content={t("extract-pdf-pages:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${ExtractPagesTool.href}`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("extract-pdf-pages:title")}
        description={t("extract-pdf-pages:meta_description")}
        toolUrl="/extract-pdf-pages"
        toolName={t("extract-pdf-pages:page_header_title")}
        aggregateRating={liveRating}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("extract-pdf-pages:page_header_title")}</h1>
          <p className="description">
            {t("extract-pdf-pages:page_header_text")}
          </p>
          <StarRating toolKey="ExtractPages" />
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
                  acceptedMimeType={ExtractPagesTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <SelectOptionFormStep
                  title={t("extract-pdf-pages:select_pages_extraction_option")}
                  action={() => {
                    //CONVERT ENTIRE PAGES
                    if (
                      extractionOption === "EXTRACT_ODD_PAGES" ||
                      extractionOption === "EXTRACT_EVEN_PAGES"
                    ) {
                      handlePagesExtraction();
                    } else if (extractionOption === "EXTRACT_SELECTED_PAGES") {
                      //Next Step select images to extract
                      setFormStep(2);
                    }
                  }}
                  /* Start Images Extraction or Select Images to be extracted */
                  actionTitle={
                    extractionOption === "EXTRACT_ODD_PAGES" ||
                    extractionOption === "EXTRACT_EVEN_PAGES"
                      ? t("extract-pdf-pages:start_pages_extraction")
                      : t("extract-pdf-pages:select_pages_to_extract")
                  }
                >
                  <Option
                    onChange={() => setExtractionOption("EXTRACT_ODD_PAGES")}
                    isChecked={extractionOption === "EXTRACT_ODD_PAGES"}
                    value="1"
                  >
                    <span>
                      {t("extract-pdf-pages:extract_odd_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t("extract-pdf-pages:extract_odd_pages_description")}
                      </span>
                    </span>
                  </Option>

                  <Option
                    onChange={() => setExtractionOption("EXTRACT_EVEN_PAGES")}
                    isChecked={extractionOption === "EXTRACT_EVEN_PAGES"}
                    value="2"
                  >
                    <span>
                      {t("extract-pdf-pages:extract_even_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t("extract-pdf-pages:extract_even_pages_description")}
                      </span>
                    </span>
                  </Option>

                  <Option
                    onChange={() =>
                      setExtractionOption("EXTRACT_SELECTED_PAGES")
                    }
                    isChecked={extractionOption === "EXTRACT_SELECTED_PAGES"}
                    value="3"
                  >
                    <span>
                      {t("extract-pdf-pages:extract_selected_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t(
                          "extract-pdf-pages:extract_selected_pages_description"
                        )}
                      </span>
                    </span>
                  </Option>
                </SelectOptionFormStep>
              )}

              {formStep === 2 &&
                extractionOption === "EXTRACT_SELECTED_PAGES" && (
                  <EditFilesFormStep
                    showTitle={t("extract-pdf-pages:select_pages_to_extract")}
                    acceptedMimeType={ExtractPagesTool.acceptedInputMimeType}
                    files={pages}
                    enableAddingMoreFiles={false}
                    filesComponents={pagesComponentsArray}
                    handleChange={handleChange}
                    isSpinnerActive={isSpinnerActive}
                    isMultipleInput={false}
                    isFilesSelectionActive={true}
                    isPanelTopSticky={false}
                    isPanelBottomSticky={true}
                    positionPanelBottomItems={styles.spaced}
                    action={handlePagesExtraction}
                    actionTitle={
                      formStep === 0
                        ? t("extract-pdf-pages:select_pages_extraction_option")
                        : t("extract-pdf-pages:start_pages_extraction")
                    }
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
                  progress={t("extract-pdf-pages:extracting_pages")}
                />
              )}

              {formStep === 5 && (
                <DownloadFilesFormStep
                  title={t("extract-pdf-pages:pages_extraction_is_complete")}
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
              {/* Container end */}
            </section>
          </article>
        </section>

        {/* steps Start */}
        <Steps
          title={t("extract-pdf-pages:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("extract-pdf-pages:how_to_step_one"),
            },
            {
              number: 2,
              description: t("extract-pdf-pages:how_to_step_two"),
            },
            {
              number: 3,
              description: t("extract-pdf-pages:how_to_step_three"),
            },
            {
              number: 4,
              description: t("extract-pdf-pages:how_to_step_four"),
            },
            {
              number: 5,
              description: t("extract-pdf-pages:how_to_step_five"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("extract-pdf-pages:feature_one_title"),
              description: t("extract-pdf-pages:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("extract-pdf-pages:feature_two_title"),
              description: t("extract-pdf-pages:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("extract-pdf-pages:feature_three_title"),
              description: t("extract-pdf-pages:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("extract-pdf-pages:feature_four_title"),
              description: t("extract-pdf-pages:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("extract-pdf-pages:feature_five_title"),
              description: t("extract-pdf-pages:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("extract-pdf-pages:feature_six_title"),
              description: t("extract-pdf-pages:feature_six_text"),
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
                {t("extract-pdf-pages:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("extract-pdf-pages:article_paragraph_01")}</p>
              <p>{t("extract-pdf-pages:article_paragraph_02")}</p>
              <p>{t("extract-pdf-pages:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
      </main>
    </>
  );
};
export default ExtractPagesPage;
