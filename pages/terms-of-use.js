import React from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "terms"])),
    },
  };
}

const TermsOfUse = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>{t("terms:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "terms" page, edit the values of "meta_description" and "meta_keywords" in the `terms.json` file inside each locale folder.   */}
        <meta name="description" content={t("terms:meta_description")} />
        <meta name="Keywords" content={t("terms:meta_Keywords")} />
        <meta name="robots" content="noindex,nofollow" />
        {/* Anything you add here will be added this page only */}
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate here */}
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("common:terms")}</h1>
        </header>
        <section className="page_section mt-0">
          <article className="container">
            <section>
              <div className={pageStyles.paragraph_text}>
                <p className="get_app">
                  The source code of this application, available under licenses,
                  can be purchased at{" "}
                  <a href="https://codecanyon.net/item/pdf-tools-high-quality-pdf-tools-nextjs-react-web-application/44924651">
                    https://codecanyon.net/item/pdf-tools-high-quality-pdf-tools-nextjs-react-web-application/44924651
                  </a>
                </p>
                <h3>{t("terms:title_01")}</h3>
                <p>{t("terms:paragraph_01")}</p>
                <h3>{t("terms:title_02")}</h3>
                <p>{t("terms:paragraph_02")}</p>
                <h3>{t("terms:title_03")}</h3>
                <p>{t("terms:paragraph_03")}</p>
                <h3>{t("terms:title_04")}</h3>
                <p>{t("terms:paragraph_04")}</p>
                <h3>{t("terms:title_05")}</h3>
                <ul>
                  <li>{t("terms:section_list_item_01")}</li>
                  <li>{t("terms:section_list_item_02")}</li>
                  <li>{t("terms:section_list_item_03")}</li>
                </ul>
              </div>
            </section>
          </article>
        </section>
      </main>
    </>
  );
};

export default TermsOfUse;
