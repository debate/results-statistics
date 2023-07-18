import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { IconType } from "react-icons";
import { BiRadar } from "react-icons/bi";
import { FaRegCompass } from "react-icons/fa";
import { RiBodyScanLine } from "react-icons/ri";

const ToolbarNavigation = () => {
  const router = useRouter();

  const items: {
    Icon: IconType;
    slug: string;
    color: string;
    hover: string;
    active: string;
  }[] = [
    {
      Icon: FaRegCompass,
      slug: "compass",
      color: "text-sky-400",
      hover: "hover:text-sky-400/50",
      active: "active:text-sky-400",
    },
    {
      Icon: RiBodyScanLine,
      slug: "x-ray",
      color: "text-violet-400",
      hover: "hover:text-violet-400/50",
      active: "active:text-violet-400",
    },
    {
      Icon: BiRadar,
      slug: "radar",
      color: "text-red-400",
      hover: "hover:text-red-400/50",
      active: "active:text-red-400",
    },
  ];

  return (
    <div className="mx-auto mb-4 flex space-x-2">
      {items.map(({ Icon, slug, color, hover, active }, idx) => (
        <Link
          href={`/tools/${slug}`}
          key={`toolbar-nav-${idx}`}
          className={clsx(`text-3xl lg:text-4xl transition-all`, {
            [`text-gray-400 ${hover} ${active}`]: !router.pathname.startsWith(
              `/tools/${slug}`
            ),
            [color]: router.pathname.startsWith(`/tools/${slug}`),
          })}
        >
          <Icon />
        </Link>
      ))}
    </div>
  );
};

export default ToolbarNavigation;
