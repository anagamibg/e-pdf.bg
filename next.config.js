const { i18n } = require("./next-i18next.config");

module.exports = {
  reactStrictMode: true,
  i18n,
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdnjs.cloudflare.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_GA_ID: "G-C4D38EX2MD",
    /**
     * Timeout out to stop sending download requests. In case
     * there's no response back after one hour from sending the first download request
     */
    NEXT_PUBLIC_DOWNLOAD_TIMEOUT: "3600000", // 1 hour in milliseconds  //1 h = 3600000 ms
    // Timeout to delete saved files from server, if their last edited date has exceeded one hour
    NEXT_PUBLIC_DELETION_TIMEOUT: "3600000", // 1 hour in milliseconds  //1 h = 3600000 ms
    // 1.01 hour is time duration to start checking if files last edited date has exceeded one hour
    NEXT_PUBLIC_DELETION_INTERVAL_DURATION: "3636000", //1.01 hour in milliseconds //1.01 h = 3636000 ms
    //delay between two download requests // sending download request every 5s
    NEXT_PUBLIC_DOWNLOAD_REQUEST_DELAY: "5000", // 5 seconds in milliseconds  // 5s = 5000
    //
    NEXT_PUBLIC_APP_URL: "https://e-pdf.bg", // Change this to match your app URL (Without / at the end)
    NEXT_PUBLIC_APP_URL_WWW: "https://www.e-pdf.bg", // Add your app URL with www (Without / at the end) or leave empty if not used
  },
};
