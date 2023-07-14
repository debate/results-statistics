import React from "react";
import NSDLogo from "../../public/assets/img/nsd-color.png";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/components";

const NsdBadge = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href="https://www.nsdebatecamp.com/"
            target="_blank"
            className="-mb-2 md:mb-0 inline-block ml-2"
          >
            <Image src={NSDLogo} alt="NSD Logo" width={32} />
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>This team is an NSD alum</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NsdBadge;
