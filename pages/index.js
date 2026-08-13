import React, { useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { Search } from "react-bootstrap-icons";
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredToolKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return Object.keys(toolsData);
    return Object.keys(toolsData).filter((key) => {
      const tool = toolsData[key];
      return (
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        key.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, toolsData]);

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
      "priceCurrency": "EUR"
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
          <div className={styles.search_wrapper}>
            <Search className={styles.search_icon} />
            <input
              type="text"
              className={styles.search_input}
              placeholder={t("common:search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                {filteredToolKeys.length === 0 && (
                  <p className={styles.search_no_results}>
                    {t("common:search_no_results")}
                  </p>
                )}
                {filteredToolKeys.map((key) => (
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
                {!searchQuery.trim() && (
                  <a
                    className={styles.banner_card}
                    href={router.locale === "en" ? "https://www.anagami.bg/en/" : "https://www.anagami.bg/uslugi/schetovodno-obslujvane/"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={router.locale === "en" ? "/img/banner-anagami-en.gif" : "/img/anagami-banner.gif"}
                      alt={router.locale === "en" ? "Anagami — Accounting Services" : "Anagami — Счетоводно обслужване"}
                      className={styles.banner_img}
                      width={500}
                      height={600}
                      loading="lazy"
                    />
                  </a>
                )}
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
