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
          src={
            "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/1x1/bg.svg"
          }
          width={20}
          height={20}
          loading="lazy"
          alt="BG Flag"
        />
        Български
      </>
    ),
    en: (
      <>
        <Image
          src={
            "https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/4.1.4/flags/1x1/us.svg"
          }
          width={20}
          height={20}
          loading="lazy"
          alt="US Flag"
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
