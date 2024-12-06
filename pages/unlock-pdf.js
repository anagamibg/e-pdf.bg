import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  Unlock,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import usePassword from "../hooks/usePassword";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import Steps from "../components/Steps";
import Features from "../components/Features";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import PasswordForm from "../components/PasswordForm.js";
import styles from "../styles/UploadContainer.module.css";
import {
  saveNewFiles,
  uploadFiles,
  downloadFiles,
  handleUnlockPDFFileSelection,
} from "../helpers/utils.js";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
import SeoSchema from "../components/SeoSchema";
import StarRating from "../components/StarRating";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "unlock-pdf"])),
    },
  };
}

const UnlockPDFPage = () => {
  const { UnlockPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  //loadedFilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const [liveRating, setLiveRating] = useState({ ratingValue: "5.0", ratingCount: "3" });
  const { t } = useTranslation();
  const {
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleUpdateResultsDisplay,
  } = useUploadStats();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const {
    password,
    confirmPassword,
    passwordsMatch,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleResetPassword,
  } = usePassword();

  const handleChange = (event) => {
    //Calling handleUnlockPDFFileSelection function to extract pdf pages and their data and insert them in an array
    handleUnlockPDFFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      UnlockPDFTool
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /**
     * Files compressing will be done on three steps:
     *** First step : uploading file to server and start processing it.
     *** Second step : sending periodic download requests to check if file is done processing and return the result.
     */

    //updating form step in UI
    setFormStep(2);

    //First step : Uploading Files & Start Files Processing
    // Storing password in data Array-like object
    const data = {
      password: password,
    };

    const { uploadResponsesArray, uploadResponsesUnsuccessfulRequests } =
      await uploadFiles({
        signal: requestSignal,
        documents: documents,
        uri: UnlockPDFTool.URI,
        data: data,
      });

    //in case error occurred while uploading file
    if (uploadResponsesUnsuccessfulRequests.length === 1) {
      handleUpdateResultsDisplay(false, uploadResponsesUnsuccessfulRequests);
      setFormStep(3);
      return;
    }

    //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnsuccessfulRequests } =
      await downloadFiles({
        responseMimeType: UnlockPDFTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
      });

    //check if document has been processed
    if (downloadResponsesArray.length === 1) {
      handleUpdateResultsDisplay(true, []);
      //updating form step in UI
      setFormStep(3);
    } else {
      //check if document has failed being processed
      //show error message and stop password trials only when the error is due to network or server error
      const errorCode = downloadResponsesUnsuccessfulRequests[0]?.errorCode;

      if (errorCode === "ERR_FAILED_PROCESSING") {
        // failed due to wrong password
        setShowErrorMessage(true);
        handleResetPassword();
        //updating form step in UI
        setFormStep(1);
      } else {
        // failed due du network or server error
        handleUpdateResultsDisplay(
          false,
          downloadResponsesUnsuccessfulRequests
        );
        //updating form step in UI
        setFormStep(3);
      }
    }
  };

  const handleHandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    setFormStep(0);
    handleResetPassword();
    setShowErrorMessage(false);
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
        const d = data.ratings?.["UnlockPDF"];
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
        {/* Anything you add here will be added to this page only */}
        <title>{t("unlock-pdf:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "unlock-pdf" page, edit the values of "meta_description" and "meta_keywords" in the `unlock-pdf.json` file inside each locale folder.   */}
        <meta name="description" content={t("unlock-pdf:meta_description")} />
        <meta name="Keywords" content={t("unlock-pdf:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${UnlockPDFTool.href}`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("unlock-pdf:title")}
        description={t("unlock-pdf:meta_description")}
        toolUrl="/unlock-pdf"
        toolName={t("unlock-pdf:page_header_title")}
        aggregateRating={liveRating}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("unlock-pdf:page_header_title")}</h1>
          <p className="description">{t("unlock-pdf:page_header_text")}</p>
          <StarRating toolKey="UnlockPDF" />
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
                  acceptedMimeType={UnlockPDFTool.acceptedInputMimeType}
                />
              )}
              {formStep === 1 && (
                <PasswordForm
                  password={password}
                  confirmPassword={confirmPassword}
                  passwordsMatch={passwordsMatch}
                  setPassword={handlePasswordChange}
                  setConfirmPassword={handleConfirmPasswordChange}
                  handleSubmit={handleSubmit}
                  actionTitle={t("unlock-pdf:unlock_pdf")}
                  showErrorMessage={showErrorMessage}
                />
              )}

              {formStep === 2 && (
                <ProcessingFilesFormStep
                  progress={t("unlock-pdf:unlocking_pdf")}
                />
              )}

              {formStep === 3 && (
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
          title={t("unlock-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("unlock-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("unlock-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("unlock-pdf:how_to_step_three"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("unlock-pdf:feature_one_title"),
              description: t("unlock-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("unlock-pdf:feature_two_title"),
              description: t("unlock-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("unlock-pdf:feature_three_title"),
              description: t("unlock-pdf:feature_three_text"),
              icon: <Unlock />,
            },
            {
              title: t("unlock-pdf:feature_four_title"),
              description: t("unlock-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("unlock-pdf:feature_five_title"),
              description: t("unlock-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("unlock-pdf:feature_six_title"),
              description: t("unlock-pdf:feature_six_text"),
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
                {t("unlock-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("unlock-pdf:article_paragraph_01")}</p>
              <p>{t("unlock-pdf:article_paragraph_02")}</p>
              <p>{t("unlock-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
      </main>
    </>
  );
};
export default UnlockPDFPage;
