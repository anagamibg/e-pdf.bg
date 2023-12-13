import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  GearFill,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
} from "react-bootstrap-icons";

import { useTranslation } from "next-i18next";
import DocumentPreview from "../components/DocumentPreview";

import { ZipFiles, handlePDFToZIPFileSelection } from "../helpers/utils.js";

import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import EditFilesFormStep from "../components/EditFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import pageStyles from "../styles/Page.module.css";
import SeoSchema from "../components/SeoSchema";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "pdf-to-zip"])),
    },
  };
}

const PDFToZipPage = () => {
  const { PDFToZIPTool } = useToolsData();

  const {
    documents,
    handleAddDocument,
    handleDeleteDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const { t } = useTranslation();

  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  //loadedFilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);

  const handleChange = (event) => {
    //Calling handlePDFToZIPFileSelection function to extract pdf pages and their data and insert them in an array
    handlePDFToZIPFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      PDFToZIPTool
    );
  };

  const handleDownload = () => {
    ZipFiles(documents);
  };

  useEffect(() => {
    //set mountedRef to true
    mountedRef.current = true;

    //cleanup function
    return () => {
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
            blob={doc.inputBlob}
            fileName={doc.fileName}
            width={doc.width}
            height={doc.height}
            numberOfPages={doc.numberOfPages}
            degree={doc.previewRotation}
            rotationsCounter={doc.rotationsCounter}
            handleDeleteDocument={(event) => {
              event.preventDefault();
              handleDeleteDocument(doc.id);
            }}
          />
        );
      })}
    </div>
  );
  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>{t("pdf-to-zip:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "pdf-to-zip" page, edit the values of "meta_description" and "meta_keywords" in the `pdf-to-zip.json` file inside each locale folder.   */}
        <meta name="description" content={t("pdf-to-zip:meta_description")} />
        <meta name="Keywords" content={t("pdf-to-zip:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${PDFToZIPTool.href}`}
          hrefLang="en"
        />
      </Head>

      <SeoSchema
        title={t("pdf-to-zip:title")}
        description={t("pdf-to-zip:meta_description")}
        toolUrl="/pdf-to-zip"
        toolName={t("pdf-to-zip:page_header_title")}
      />

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("pdf-to-zip:page_header_title")}</h1>
          <p className="description">{t("pdf-to-zip:page_header_text")}</p>
        </header>

        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {documents.length <= 0 ? (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={PDFToZIPTool.acceptedInputMimeType}
                />
              ) : (
                <EditFilesFormStep
                  acceptedMimeType={PDFToZIPTool.acceptedInputMimeType}
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
                  action={() => handleDownload()}
                  actionTitle={t("pdf-to-zip:create_zip")}
                />
              )}

              {/* Container end */}
            </section>
          </article>
        </section>

        {/* steps Start */}
        <Steps
          title={t("pdf-to-zip:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("pdf-to-zip:how_to_step_one"),
            },
            {
              number: 2,
              description: t("pdf-to-zip:how_to_step_two"),
            },
            {
              number: 3,
              description: t("pdf-to-zip:how_to_step_three"),
            },
            {
              number: 4,
              description: t("pdf-to-zip:how_to_step_four"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("pdf-to-zip:feature_one_title"),
              description: t("pdf-to-zip:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("pdf-to-zip:feature_two_title"),
              description: t("pdf-to-zip:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("pdf-to-zip:feature_three_title"),
              description: t("pdf-to-zip:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("pdf-to-zip:feature_four_title"),
              description: t("pdf-to-zip:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("pdf-to-zip:feature_five_title"),
              description: t("pdf-to-zip:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("pdf-to-zip:feature_six_title"),
              description: t("pdf-to-zip:feature_six_text"),
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
                {t("pdf-to-zip:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("pdf-to-zip:article_paragraph_01")}</p>
              <p>{t("pdf-to-zip:article_paragraph_02")}</p>
              <p>{t("pdf-to-zip:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
      </main>
    </>
  );
};
export default PDFToZipPage;
