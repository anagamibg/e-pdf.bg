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
import Selecto from "react-selecto";
import { isMobile } from "react-device-detect";
import PagePreviewModal from "../components/PagePreviewModal";
import {
  handleMerge,
  handlePDFOperationsFileSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import DocumentPreviewSelectable from "../components/DocumentPreviewSelectable";
import Features from "../components/Features";
import EditFilesFormStep from "../components/EditFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import AvailableTools from "../components/AvailableTools";
import usePages from "../hooks/usePages";
import useToolsData from "../hooks/useToolsData";
import pageStyles from "../styles/Page.module.css";

import useSelectoSync from "../hooks/useSelectoSync";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "rotate-pdf-pages"])),
    },
  };
}

const RotatePDFPage = () => {
  const { RotatePDFTool } = useToolsData();
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const mountedRef = useRef(false);
  //loadedFilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);

  const [scrollOptions, setScrollOptions] = useState({});

  const [zoomedPage, setZoomedPage] = useState(null);
  const { t } = useTranslation();
  const {
    pages,
    handleAddPage,
    handleRotatePageRight,
    handleRotatePageLeft,
    handleRotateSelectedPagesToRight,
    rotateSelectedPagesToLeft,
    handleDeleteSelectedPages,
    handleRemovePageSelection,
    handleClearPageSelection,
    handlePageSelection,
    handlePagesSelection,
    handleDeletePage,
  } = usePages();

  const selectoRef = useRef(null);
  // Keep Selecto's elements selected via box (drag) selection in sync with elements selected by click
  useSelectoSync(pages, selectoRef);

  const handleChange = (event) => {
    //Calling handlePDFOperationsFileSelection function to extract pdf pages and their data and insert them in an array
    handlePDFOperationsFileSelection(
      event,
      setLoadedFilesCount,
      handleAddPage,
      t,
      mountedRef,
      RotatePDFTool
    );
    //To empty input value; to input same file many time in a row
    event.target.value = null;
  };

  useEffect(() => {
    if (zoomedPage) {
      //clear page selection
      handleClearPageSelection();

      // get zoomed Page index
      const zoomedPageIndex = pages.findIndex(
        (page) => page.id === zoomedPage.id
      );
      // set zoomed page as selected
      handlePageSelection(zoomedPageIndex);
    }
  }, [zoomedPage]);

  useEffect(() => {
    //set mountedRef to true
    mountedRef.current = true;

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
    <div
      className={`previewer_content ${styles.previewer_content} d-flex flex-wrap ${styles.previewer_content_scrollable} mb-0 mt-0`}
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
            zoomOnPage={(e) => {
              // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
              e.stopPropagation();
              setZoomedPage(page);
            }}
            //
            handleRotatePageRight={(e) => {
              // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
              e.stopPropagation();
              handleRotatePageRight(page.id);
            }}
            handleRotatePageLeft={(e) => {
              // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
              e.stopPropagation();
              handleRotatePageLeft(page.id);
            }}
            handleDeletePage={() => handleDeletePage(page.id)}
          />
        );
      })}
    </div>
  );
  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>{t("rotate-pdf-pages:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "rotate-pdf-pages" page, edit the values of "meta_description" and "meta_keywords" in the `rotate-pdf-pages.json` file inside each locale folder.   */}
        <meta
          name="description"
          content={t("rotate-pdf-pages:meta_description")}
        />
        <meta name="Keywords" content={t("rotate-pdf-pages:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${RotatePDFTool.href}`}
          hrefLang="en"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("rotate-pdf-pages:page_header_title")}</h1>
          <p className="description">
            {t("rotate-pdf-pages:page_header_text")}
          </p>
        </header>

        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {pages.length <= 0 ? (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={RotatePDFTool.acceptedInputMimeType}
                />
              ) : (
                <EditFilesFormStep
                  acceptedMimeType={RotatePDFTool.acceptedInputMimeType}
                  files={pages}
                  enableAddingMoreFiles={true}
                  filesComponents={pagesComponentsArray}
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  isFilesSelectionActive={true}
                  isPanelTopSticky={true}
                  isPanelBottomSticky={true}
                  positionPanelBottomItems={styles.spaced}
                  deleteFiles={handleDeleteSelectedPages}
                  rotateFilesToLeft={rotateSelectedPagesToLeft}
                  rotateFilesToRight={handleRotateSelectedPagesToRight}
                  action={() =>
                    handleMerge(pages, RotatePDFTool.newFileNameSuffix)
                  }
                  actionTitle={t("common:save_&_download")}
                />
              )}

              {/* Page Viewer Modal Start */}
              {zoomedPage !== null ? (
                <PagePreviewModal
                  pages={pages}
                  currentPage={zoomedPage}
                  setZoomedPage={setZoomedPage}
                  deletePage={handleDeletePage}
                  handleRotatePageRight={handleRotatePageRight}
                  handleRotatePageLeft={handleRotatePageLeft}
                />
              ) : null}
              {/* Page Viewer Modal Start */}

              {/* Container end */}
            </section>
          </article>
        </section>

        {/* steps Start */}
        <Steps
          title={t("rotate-pdf-pages:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("rotate-pdf-pages:how_to_step_one"),
            },
            {
              number: 2,
              description: t("rotate-pdf-pages:how_to_step_two"),
            },
            {
              number: 3,
              description: t("rotate-pdf-pages:how_to_step_three"),
            },
            {
              number: 4,
              description: t("rotate-pdf-pages:how_to_step_four"),
            },
            {
              number: 5,
              description: t("rotate-pdf-pages:how_to_step_five"),
            },
            {
              number: 6,
              description: t("rotate-pdf-pages:how_to_step_six"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("rotate-pdf-pages:feature_one_title"),
              description: t("rotate-pdf-pages:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("rotate-pdf-pages:feature_two_title"),
              description: t("rotate-pdf-pages:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("rotate-pdf-pages:feature_three_title"),
              description: t("rotate-pdf-pages:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("rotate-pdf-pages:feature_four_title"),
              description: t("rotate-pdf-pages:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("rotate-pdf-pages:feature_five_title"),
              description: t("rotate-pdf-pages:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("rotate-pdf-pages:feature_six_title"),
              description: t("rotate-pdf-pages:feature_six_text"),
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
                {t("rotate-pdf-pages:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("rotate-pdf-pages:article_paragraph_01")}</p>
              <p>{t("rotate-pdf-pages:article_paragraph_02")}</p>
              <p>{t("rotate-pdf-pages:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
        <AvailableTools />
      </main>
    </>
  );
};
export default RotatePDFPage;
