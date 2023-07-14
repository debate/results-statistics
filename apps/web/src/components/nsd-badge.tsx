import React from "react";
import NSDLogo from "../../public/assets/img/nsd-color.png";
import Image from "next/image";

const NsdBadge = () => {
  return (
    <a
      href="https://www.nsdebatecamp.com/"
      target="_blank"
      className="w-8 h-auto inline-block ml-2"
    >
      <Image src={NSDLogo} alt="NSD Logo" width={32} />
    </a>
  );
};

export default NsdBadge;
