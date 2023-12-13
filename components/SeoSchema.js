import Head from "next/head";
import { useRouter } from "next/router";

const SeoSchema = ({ title, description, toolUrl, toolName }) => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e-pdf.bg";
  const currentUrl = `${baseUrl}${toolUrl || router.asPath}`;
  const lang = router.locale === "bg" ? "bg-BG" : "en";

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": toolName || title,
    "url": currentUrl,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BGN"
    },
    "description": description,
    "inLanguage": lang,
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "provider": {
      "@type": "Organization",
      "name": "e-pdf.bg",
      "url": "https://e-pdf.bg"
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </Head>
  );
};

export default SeoSchema;
