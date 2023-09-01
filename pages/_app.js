import Head from "next/head";
import { useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import * as gtag from "../helpers/gtag";
import { appWithTranslation } from "next-i18next";
import Layout from "../components/Layout";
import "../styles/global.css";

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  const getCanonicalUrl = () => {
    if (router.asPath === `/`) {
      return router.locale === router.defaultLocale ? "" : `/${router.locale}`;
    }
    return router.locale === router.defaultLocale
      ? router.asPath
      : `/${router.locale}${router.asPath}`;
  };

  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL}${getCanonicalUrl()}`;

  return (
    <>
      <Head>
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <meta name="author" content="" />
        <meta name="theme-color" content="#2d3748" />
        <link rel="icon" href="/img/favicon.png" />
        <link rel="apple-touch-icon" href="/img/favicon.png" />
        <meta
          name="google-site-verification"
          content="add-your-google-site-verification-code"
        />
        {/* Canonical link */}
        <link rel="canonical" href={canonicalUrl} key="canonical" />
      </Head>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtag.GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
};

export default appWithTranslation(MyApp);
