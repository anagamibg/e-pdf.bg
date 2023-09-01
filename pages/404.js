import React from "react";
import Link from "next/link";
import Head from "next/head";
import styles from "../styles/errorPage.module.css";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "page404"])),
    },
  };
}

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        {/* Anything you add here will be added this page only */}
        <title>{t("page404:title")}</title>
        {/* IMPORTANT: Customize the meta tags below for better SEO. 
            - "keywords" should include relevant terms users might search for (e.g., PDF tools, merge PDF, compress PDF). 
            - "description" should be a brief, compelling summary of your site (e.g., "A powerful online tool for managing PDFs – merge, compress, convert, and more!"). 
            - Avoid duplicate content across multiple websites.
            - The "description" and "keywords" values can be modified in the respective JSON files for each page.  
            - You can find these files in the `public/locales` folder.  
            - For example, to update the meta tags for the "404" page, edit the values of "meta_description" and "meta_keywords" in the `page404.json` file inside each locale folder.   */}
        <meta name="description" content={t("page404:meta_description")} />
        <meta name="Keywords" content={t("page404:meta_Keywords")} />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main>
        <section className="page_section">
          <article>
            <div className={`${styles.notfound_wrapper}`}>
              <div className={`${styles.notfound}`}>
                <div className={`${styles.notfound_404}`}>
                  <h1>404</h1>
                </div>
                <h2>{t("page404:oops")}</h2>
                <div>
                  {t("page404:we_are_sorry")}
                  <Link href="/">{t("page404:go_back_to")}</Link>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
};

export default NotFound;
