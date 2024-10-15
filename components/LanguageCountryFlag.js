import React from "react";
import PropTypes from "prop-types";
import Image from "next/legacy/image";
const LanguageCountryFlag = React.memo(function LanguageCountryFlag({
  locale,
}) {
  const flags = {
    bg: (
      <>
        <Image
          src="/img/flags/bg.png"
          width={22}
          height={22}
          loading="lazy"
          alt="BG Flag"
        />
        Български
      </>
    ),
    en: (
      <>
        <Image
          src="/img/flags/en.png"
          width={22}
          height={22}
          loading="lazy"
          alt="EN Flag"
        />
        English
      </>
    ),
  };

  return flags[locale] || flags["bg"];
});
export default LanguageCountryFlag;

LanguageCountryFlag.propTypes = {
  locale: PropTypes.string.isRequired,
};
