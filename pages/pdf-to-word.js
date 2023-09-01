import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  GearFill,
  HeartFill,
  ShieldFillCheck,
  AwardFill,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import DocumentPreview from "../components/DocumentPreview";
import {
  handleFileSelection,
  uploadFiles,
  downloadFiles,
  saveNewFiles,
} from "../helpers/utils.js";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";

import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "pdf-to-word"])),
    },
  };
}

const PDFToWordPage = () => {
  const { PDFToWORDTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  //loadedFilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const { t } = useTranslation();

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

  const handleChange = (event) => {
    //Calling handleFileSelection function to extract pdf pages and their data and insert them in an array
    handleFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      PDFToWORDTool
    );
  };

  const handleConvertPDFToWord = async () => {
    //reset upload status
    handleResetCurrentUploadingStatus();
    handleResetCurrentProcessingStatus();
    //convert Files
    /**
     **  Files compressing will be done on three steps:
     *** First step : uploading files one by one to server and start processing the files
     *** Second step : sending periodic download requests to check if files are done compressing and return the result, sending individual download requests for each file.
     */

    //updating form step in UI
    setFormStep(2);
    //First step : Uploading Files & Start Files Processing
    const { uploadResponsesArray, uploadResponsesUnsuccessfulRequests } =
      await uploadFiles({
        signal: requestSignal,
        documents,
        handleUpdateCurrentUploadingStatus,
        uri: PDFToWORDTool.URI,
      });

    //updating form step in UI
    setFormStep(3);

    //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnsuccessfulRequests } =
      await downloadFiles({
        responseMimeType: PDFToWORDTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray,
        handleUpdateDocument,
        handleUpdateCurrentProcessingStatus,
      });

    //Storing all failed documents from each step in an array
    const failedFiles = [
      ...uploadResponsesUnsuccessfulRequests,
      ...downloadResponsesUnsuccessfulRequests,
    ];

    //check if all documents have been processed, no failed documents
    if (downloadResponsesArray.length === documents.length) {
      handleUpdateResultsDisplay(true, []);
    } else {
      //check if all documents have failed being processed
      if (failedFiles.length === documents.length) {
        handleUpdateResultsDisplay(false, failedFiles);
      } else {
        //If some documents have being successfully processed and some documents have failed being processed
        handleUpdateResultsDisplay(true, failedFiles);
      }
    }
    //updating form step in UI
    setFormStep(4);
  };

  const handleHandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    setFormStep(0);
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

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>{t("pdf-to-word:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "pdf-to-word" page, edit the values of "meta_description" and "meta_keywords" in the `pdf-to-word.json` file inside each locale folder.   */}
        <meta name="description" content={t("pdf-to-word:meta_description")} />
        <meta name="Keywords" content={t("pdf-to-word:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${PDFToWORDTool.href}`}
          hrefLang="en"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("pdf-to-word:page_header_title")}</h1>
          <p className="description">{t("pdf-to-word:page_header_text")}</p>
        </header>

        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}
              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={PDFToWORDTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <EditFilesFormStep
                  acceptedMimeType={PDFToWORDTool.acceptedInputMimeType}
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
                  action={() => handleConvertPDFToWord()}
                  actionTitle={t("pdf-to-word:convert_to_word")}
                />
              )}

              {formStep === 2 && (
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

              {formStep === 3 && (
                <ProcessingFilesFormStep
                  progress={`${t(
                    "common:processing"
                  )} ${currentProcessedFilesCounter} ${t("common:of")} ${
                    documents.length
                  }`}
                />
              )}

              {formStep === 4 && (
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
              {/* Container end */}
            </section>
          </article>
        </section>

        {/* steps Start */}
        <Steps
          title={t("pdf-to-word:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("pdf-to-word:how_to_step_one"),
            },
            {
              number: 2,
              description: t("pdf-to-word:how_to_step_two"),
            },
            {
              number: 3,
              description: t("pdf-to-word:how_to_step_three"),
            },
            {
              number: 4,
              description: t("pdf-to-word:how_to_step_four"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("pdf-to-word:feature_one_title"),
              description: t("pdf-to-word:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("pdf-to-word:feature_two_title"),
              description: t("pdf-to-word:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("pdf-to-word:feature_three_title"),
              description: t("pdf-to-word:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("pdf-to-word:feature_four_title"),
              description: t("pdf-to-word:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("pdf-to-word:feature_five_title"),
              description: t("pdf-to-word:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("pdf-to-word:feature_six_title"),
              description: t("pdf-to-word:feature_six_text"),
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
                {t("pdf-to-word:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("pdf-to-word:article_paragraph_01")}</p>
              <p>{t("pdf-to-word:article_paragraph_02")}</p>
              <p>{t("pdf-to-word:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
        <AvailableTools />
      </main>
    </>
  );
};
export default PDFToWordPage;
