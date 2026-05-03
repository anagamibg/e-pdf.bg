import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ToolsList from "./ToolsList";
import { useTranslation } from "next-i18next";
import LanguageCountryFlag from "./LanguageCountryFlag";
import styles from "../styles/MegaMenu.module.css";
import { List, ChevronDown, X, ChevronUp } from "react-bootstrap-icons";
import useToolsData from "../hooks/useToolsData";

const Nav = React.memo(function Nav() {
  const router = useRouter();
  const toolsData = useToolsData();
  const { t } = useTranslation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [navToggleShow, setNavToggleShow] = useState(false);
  const navMenuRef = useRef(null);
  const langDropdownRef = useRef(null);

  const handleRouteChange = () => {
    setNavToggleShow(false);
    setShowLangDropdown(false);
  };

  const handleClickOutside = (event) => {
    if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
      setNavToggleShow(false);
    }
    if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
      setShowLangDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div>
        <nav className={`${styles.navigation}`}>
          <Link href="/" className={`${styles.logo}`}>
            <img
              src="/img/logo.png"
              alt="e-pdf.bg"
              className={styles.logo_img}
            />
          </Link>
          <ul
            ref={navMenuRef}
            className={`${styles.nav_menu} ${
              navToggleShow ? styles.active : ""
            }`}
          >
            <li className={`${styles.nav_list} ${styles.remove_in_mobile}`}>
              <Link
                href={toolsData["EditPDFTool"].href}
                className={`${styles.nav_link}`}
                prefetch={false}
              >
                <span>{toolsData["EditPDFTool"].title}</span>
              </Link>
            </li>

            <li className={`${styles.nav_list} ${styles.remove_in_mobile}`}>
              <Link
                href={toolsData["MergePDFTool"].href}
                className={`${styles.nav_link}`}
                prefetch={false}
              >
                <span>{toolsData["MergePDFTool"].title}</span>
              </Link>
            </li>

            <li className={`${styles.nav_list} ${styles.remove_in_mobile}`}>
              <Link
                href={toolsData["CompressPDFTool"].href}
                className={`${styles.nav_link}`}
                prefetch={false}
              >
                <span>{toolsData["CompressPDFTool"].title}</span>
              </Link>
            </li>

            <li
              className={`${styles.nav_list} ${
                navToggleShow ? styles.nav_list_menu : ""
              }`}
            >
              <div
                className={`${styles.nav_link} ${styles.remove_in_mobile}`}
                onClick={() => {
                  setNavToggleShow(!navToggleShow);
                }}
              >
                <span>{t("common:all_pdf_tools")}</span>
                {navToggleShow ? <ChevronUp /> : <ChevronDown />}
              </div>
              <div className={`${styles.dropdown}`}>
                <div className={`${styles.dropdown_inner}`}>
                  {navToggleShow && <ToolsList />}
                </div>
              </div>
            </li>
          </ul>
          <div className={`${styles.nav_action}`}>
            <a
              href="https://www.anagami.bg/uslugi/schetovodno-obslujvane/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.cta_button}`}
            >
              Счетоводни услуги
            </a>
            <div
              ref={langDropdownRef}
              className={`${styles.lang_dropdown} ${showLangDropdown ? styles.lang_dropdown_open : ""}`}
            >
              <div
                className={`${styles.btn_primary}`}
                onClick={() => setShowLangDropdown(!showLangDropdown)}
              >
                <LanguageCountryFlag locale={router.locale} />
                <ChevronDown className={styles.lang_chevron} size={12} />
              </div>
              <ul className={styles.lang_dropdown_menu}>
                {router.locales.map((locale) => (
                  <li key={locale}>
                    <Link
                      href=""
                      locale={locale}
                      className={`${styles.lang_dropdown_item} ${router.locale === locale ? styles.lang_dropdown_item_active : ""}`}
                      prefetch={false}
                      onClick={() => setShowLangDropdown(false)}
                    >
                      <LanguageCountryFlag locale={locale} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className={`${styles.nav_toggle}`}
              onClick={() => setNavToggleShow(!navToggleShow)}
            >
              {navToggleShow ? <X size={30} /> : <List size={30} />}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
});

export default Nav;
