import React from "react";
import Link from "next/link";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import styles from "../styles/index.module.css";
import useToolsData from "../hooks/useToolsData";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

const Home = () => {
  const toolsData = useToolsData();
  const { t } = useTranslation();

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>{t("common:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the index page, edit the values of "meta_description" and "meta_keywords" in the `common.json` file inside each locale folder.      */}
        <meta name="description" content={t("common:meta_description")} />
        <meta name="Keywords" content={t("common:meta_Keywords")} />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}`}
          hrefLang="en"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("common:page_header_title")}</h1>
          <p className="description">{t("common:page_header_text")}</p>
        </header>

        <section className="page_section mt-0">
          <article className="container">
            <section
              style={{
                marginBottom: "10px",
                marginTop: "10px",
              }}
            >
              <div className={styles.grid_container}>
                {Object.keys(toolsData).map((key) => (
                  <Link
                    key={key}
                    className={styles.grid_item}
                    href={toolsData[key].href}
                    prefetch={false}
                  >
                    <div className={styles.grid_content}>
                      <div className={styles.grid_item_header}>
                        <div className={styles.grid_item_icon}>
                          {toolsData[key].icon}
                        </div>
                        <h2 className={styles.grid_item_title}>
                          {toolsData[key].title}
                        </h2>
                      </div>
                      <p className={styles.grid_item_description}>
                        {toolsData[key].description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </article>
        </section>
      </main>
    </>
  );
};
export default Home;
