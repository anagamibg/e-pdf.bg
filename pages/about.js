import React from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import pageStyles from "../styles/Page.module.css";

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "about"])),
    },
  };
}

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        {/* Anything you add here will be added this page only */}
        <title>{t("about:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "about" page, edit the values of "meta_description" and "meta_keywords" in the `about.json` file inside each locale folder.   */}
        <meta name="description" content={t("about:meta_description")} />
        <meta name="Keywords" content={t("about:meta_Keywords")} />
        <meta name="robots" content="noindex,nofollow" />
        {/* You can add your canonical link here to override the one in _app.js */}
        {/* You can add your alternate here */}
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("common:about")}</h1>
        </header>
        <section className="page_section mt-0">
          <article className="container">
            <section>
              <div className={pageStyles.paragraph_text}>
                <p>{t("about:paragraph_01")}</p>

                <p>{t("about:paragraph_02")}</p>

                <p>{t("about:paragraph_03")}</p>

                <p>{t("about:paragraph_04")}</p>
              </div>
            </section>
          </article>
        </section>

      </main>
    </>
  );
};

export default About;
