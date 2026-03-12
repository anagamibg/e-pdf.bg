import React from "react";
import PropTypes from "prop-types";
import Image from "next/legacy/image";
const LanguageCountryFlag = React.memo(function LanguageCountryFlag({
  locale,
  hideLabel = false,
}) {
  const flagImg = {
    bg: { src: "/img/flags/bg.png", alt: "BG Flag", label: "Български" },
    en: { src: "/img/flags/en.png", alt: "EN Flag", label: "English" },
  };

  const flag = flagImg[locale] || flagImg["bg"];

  return (
    <>
      <Image
        src={flag.src}
        width={25}
        height={25}
        quality={100}
        loading="lazy"
        alt={flag.alt}
      />
      {!hideLabel && <span className="lang_label">{flag.label}</span>}
    </>
  );
});
export default LanguageCountryFlag;

LanguageCountryFlag.propTypes = {
  locale: PropTypes.string.isRequired,
  hideLabel: PropTypes.bool,
};
