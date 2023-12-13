import React from "react";
import Link from "next/link";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
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
  const router = useRouter();

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "e-pdf.bg",
    "url": "https://e-pdf.bg",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BGN"
    },
    "description": t("common:meta_description"),
    "inLanguage": router.locale === "bg" ? "bg-BG" : "en"
  };

  return (
    <>
      <Head>
        <title>{t("common:title")}</title>
        <meta name="description" content={t("common:meta_description")} />
        <meta name="Keywords" content={t("common:meta_Keywords")} />
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_APP_URL}/bg`}
          hrefLang="bg"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
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

        {/* SEO Content Sections */}
        <section className="page_section">
          <article className={`container ${styles.seo_content}`}>
            <div className={styles.seo_section}>
              <h2>{t("common:seo_section_1_title")}</h2>
              <p>{t("common:seo_section_1_text")}</p>
            </div>
            <div className={styles.seo_section}>
              <h2>{t("common:seo_section_2_title")}</h2>
              <p>{t("common:seo_section_2_text")}</p>
            </div>
            <div className={styles.seo_section}>
              <h2>{t("common:seo_section_3_title")}</h2>
              <p>{t("common:seo_section_3_text")}</p>
            </div>
          </article>
        </section>
      </main>
    </>
  );
};
export default Home;
