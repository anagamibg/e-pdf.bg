import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
const ToastAlert = dynamic(() => import("./ToastAlert"), {
  ssr: false,
});
const BackToTopButton = dynamic(() => import("./BackToTopButton"), {
  ssr: false,
});
import Nav from "./Nav";
import Footer from "./Footer";
import { rtlLanguages } from "../helpers/utils";
import { Open_Sans } from "next/font/google";

// Google Font
const openSans = Open_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const Layout = ({ children }) => {
  const router = useRouter();
  const direction = rtlLanguages.includes(router.locale) ? "rtl" : "ltr";
  const langStyle = {
    direction: direction,
  };
  useEffect(() => {
    //Function to scroll to the top of the page when route change
    const handleScroll = () => {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };
    router.events.on("routeChangeComplete", handleScroll);
    return () => {
      router.events.off("routeChangeComplete", handleScroll);
    };
  });

  return (
    <div style={langStyle} className={openSans.className}>
      <ToastAlert />
      <BackToTopButton />

      <Nav />
      <div className="main">{children}</div>
      <Footer />
    </div>
  );
};

export default Layout;
