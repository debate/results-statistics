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

  const items: { Icon: IconType; slug: string; color: string }[] = [
    {
      Icon: FaRegCompass,
      slug: "compass",
      color: "text-sky-400",
    },
    {
      Icon: RiBodyScanLine,
      slug: "x-ray",
      color: "text-violet-400",
    },
    {
      Icon: BiRadar,
      slug: "radar",
      color: "text-red-400",
    },
  ];

  return (
    <div className="mx-auto mb-4 flex space-x-2">
      {items.map(({ Icon, slug, color }, idx) => (
        <Link
          href={`/tools/${slug}`}
          key={`toolbar-nav-${idx}`}
          className={clsx(
            `text-3xl lg:text-4xl hover:opacity-70 active:opacity-100 transition-all ${color}`,
            {
              "opacity-50": !router.pathname.startsWith(`/tools/${slug}`),
              [color]: !router.pathname.startsWith(`/tools/${slug}`),
            }
          )}
        >
          <Icon />
        </Link>
      ))}
    </div>
  );
};

export default ToolbarNavigation;
