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
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import PagePreviewModal from "../components/PagePreviewModal";
import PageDragLayer from "../components/PageDragLayer";
import DocumentPreviewDraggable from "../components/DocumentPreviewDraggable";
import {
  handleMerge,
  handlePDFOperationsFileSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import Features from "../components/Features";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import usePages from "../hooks/usePages";
import useToolsData from "../hooks/useToolsData";
import pageStyles from "../styles/Page.module.css";
import useSelectoSync from "../hooks/useSelectoSync";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "merge-pdf"])),
    },
  };
}

const MergePDFPage = () => {
  const { MergePDFTool } = useToolsData();
  const {
    pages,
    hoverIndex,
    insertIndex,
    handleAddPage,
    handleRotatePageRight,
    handleRotatePageLeft,
    handleRotateSelectedPagesToRight,
    rotateSelectedPagesToLeft,
    handleDeleteSelectedPages,
    handleSetInsertIndex,
    handleRemovePageSelection,
    handleClearPageSelection,
    handlePageSelection,
    handlePagesSelection,
    handleRearrangePages,
    handleDeletePage,
  } = usePages();

  const { t } = useTranslation();

  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const mountedRef = useRef(false);
  //loadedFilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedFilesCount, setLoadedFilesCount] = useState(0);

  const [scrollOptions, setScrollOptions] = useState({});
  const opts = {
    scrollAngleRanges: [
      { start: 30, end: 150 },
      { start: 210, end: 330 },
    ],
  };
  const [zoomedPage, setZoomedPage] = useState(null);

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
      MergePDFTool
    );
    //To empty input value; to input same file many time in a row
    event.target.value = null;
  };

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
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? opts : null}
    >
      <div
        className={`previewer_content ${styles.previewer_content} d-flex flex-wrap ${styles.previewer_content_scrollable}`}
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
        <PageDragLayer />
        {pages.map((page, i) => {
          const insertLineOnLeft = hoverIndex === i && insertIndex === i;
          const insertLineOnRight = hoverIndex === i && insertIndex === i + 1;
          return (
            <DocumentPreviewDraggable
              key={"page-" + page.id}
              id={page.id}
              index={i}
              order={page.order}
              degree={page.degree}
              height={page.height}
              width={page.width}
              blob={page.outputBlob}
              selectedPages={pages.filter((page) => page.selected === true)}
              handleRearrangePages={handleRearrangePages}
              handleSetInsertIndex={handleSetInsertIndex}
              onSelectionChange={handlePagesSelection}
              handleClearPageSelection={handleClearPageSelection}
              insertLineOnLeft={insertLineOnLeft}
              insertLineOnRight={insertLineOnRight}
              isSelected={page.selected}
              zoomOnPage={(e) => {
                // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
                e.stopPropagation();
                setZoomedPage(page);
              }}
              handleDeletePage={() => handleDeletePage(page.id)}
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
            />
          );
        })}
      </div>
    </DndProvider>
  );

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>{t("merge-pdf:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "Merge PDF" page, edit the values of "meta_description" and "meta_keywords" in the `merge-pdf.json` file inside each locale folder.   */}
        <meta name="description" content={t("merge-pdf:meta_description")} />
        <meta name="Keywords" content={t("merge-pdf:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}${MergePDFTool.href}`}
          hrefLang="en"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("merge-pdf:page_header_title")}</h1>
          <p className="description">{t("merge-pdf:page_header_text")}</p>
        </header>

        <section className="page_section mt-0">
          <article className="container">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {pages.length <= 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={MergePDFTool.acceptedInputMimeType}
                />
              )}

              {pages.length > 0 && (
                <EditFilesFormStep
                  acceptedMimeType={MergePDFTool.acceptedInputMimeType}
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
                    handleMerge(pages, MergePDFTool.newFileNameSuffix)
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
          title={t("merge-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("merge-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("merge-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("merge-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("merge-pdf:how_to_step_four"),
            },
            {
              number: 5,
              description: t("merge-pdf:how_to_step_five"),
            },
          ]}
        />
        {/* steps end */}

        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: "Fast",
              description: t("merge-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("merge-pdf:feature_two_title"),
              description: t("merge-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("merge-pdf:feature_three_title"),
              description: t("merge-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("merge-pdf:feature_four_title"),
              description: t("merge-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("merge-pdf:feature_five_title"),
              description: t("merge-pdf:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("merge-pdf:feature_six_title"),
              description: t("merge-pdf:feature_six_text"),
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
                {t("merge-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p className="get_app">
                The source code of this application, available under licenses,
                can be purchased at{" "}
                <a href="https://codecanyon.net/item/pdf-tools-high-quality-pdf-tools-nextjs-react-web-application/44924651">
                  https://codecanyon.net/item/pdf-tools-high-quality-pdf-tools-nextjs-react-web-application/44924651
                </a>
              </p>
              <p>{t("merge-pdf:article_paragraph_01")}</p>
              <p>{t("merge-pdf:article_paragraph_02")}</p>
              <p>{t("merge-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
        <AvailableTools />
      </main>
    </>
  );
};
export default MergePDFPage;
