import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import styles from "../styles/Footer.module.css";

const Footer = React.memo(function Footer() {
  const { t } = useTranslation();

  const mountedRef = useRef();
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <footer className={`${styles.page_footer}`}>
      <div className={`container text-center mb-0`}>
        <div className={`row ${styles.footer_bottom}`}>
          <div className="col-lg-6 col-md-6 col-12 d-flex flex-column align-items-start text-start mb-3">
            <picture>
              <source srcSet="/img/logo.webp" type="image/webp" />
              <img
                src="/img/logo.png"
                alt="e-pdf.bg"
                className="logo-light"
                style={{ maxWidth: "180px", marginBottom: "12px" }}
              />
            </picture>
            <picture>
              <source srcSet="/img/logo-dark.webp" type="image/webp" />
              <img
                src="/img/logo-dark.png"
                alt="e-pdf.bg"
                className="logo-dark"
                style={{ maxWidth: "180px", marginBottom: "12px" }}
              />
            </picture>
            <p className={styles.footer_info}>
              Създадено от{" "}
              <a href="https://www.anagami.bg/en/" target="_blank" rel="noopener noreferrer">
                <strong>Anagami Digital Accounting</strong>
              </a>
            </p>
            <p className={styles.footer_info}>
              &copy; 2026 e-pdf.bg &ndash; PDF Инструменти
            </p>
            <p className={styles.footer_info}>
              <a href="https://www.facebook.com/anagami.bg" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <span style={{ margin: "0 10px" }}>|</span>
              <a href="https://www.linkedin.com/company/anagami-bg/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <span style={{ margin: "0 10px" }}>|</span>
              <a href="https://www.instagram.com/anagami_bg/" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </p>
          </div>
          <div className="col-lg-6 col-md-6 col-12 d-flex flex-column align-items-end text-end mb-3">
            <p className={styles.footer_info}>
              Anagami е запазена марка на АААкаунтинг Плюс EООД, ЕИК: 204467213
              <br />
              гр. София 1000, бул. Цар Освободител 14, Landmark Centre
            </p>
            <p className={styles.footer_info}>
              <a href="https://www.anagami.bg/kontakti/" target="_blank" rel="noopener noreferrer">
                Контакти
              </a>
              <span style={{ margin: "0 10px" }}>|</span>
              <a href="https://e-pdf.bg/privacy-policy">
                Защита на личните данни
              </a>
            </p>
          </div>
        </div>
      </div>
      <div className={styles.network_bar}>
        <a href="https://e-fakturi.bg" target="_blank" rel="noopener noreferrer">e-fakturi.bg</a>
        <a href="https://e-pdf.bg" target="_blank" rel="noopener noreferrer">e-pdf.bg</a>
        <a href="https://e-kalkulator.bg" target="_blank" rel="noopener noreferrer">e-kalkulator.bg</a>
        <a href="https://e-dokumenti.bg" target="_blank" rel="noopener noreferrer">e-dokumenti.bg</a>
        <a href="https://generatorzaparoli.bg" target="_blank" rel="noopener noreferrer">generatorzaparoli.bg</a>
      </div>
    </footer>
  );
});

export default Footer;
