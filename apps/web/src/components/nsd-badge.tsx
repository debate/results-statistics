import React from "react";
import NSDLogo from "../../public/assets/img/nsd-color.png";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/components";
import clsx from "clsx";

interface NsdBadgeProps {
  size: "small" | "large";
  muted?: boolean;
}

const NsdBadge = ({ size, muted }: NsdBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href="https://link.debate.land/nsd"
            target="_blank"
            className="-mb-2 md:mb-0 inline-block ml-2"
          >
            <Image
              src={NSDLogo}
              alt="NSD Logo"
              width={size === "small" ? 22 : 32}
              className={clsx({ "dark:opacity-80": muted })}
            />
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
