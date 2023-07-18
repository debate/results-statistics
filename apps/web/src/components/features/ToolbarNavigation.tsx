import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { ReactNode } from "react";
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
      color: "text-sky-500",
    },
    {
      Icon: BiRadar,
      slug: "radar",
      color: "text-red-400",
    },
    {
      Icon: RiBodyScanLine,
      slug: "x-ray",
      color: "text-blue-400",
    },
  ];

  return (
    <div className="mx-auto mb-4 flex space-x-2">
      {items.map(({ Icon, slug, color }, idx) => (
        <Link href={`/tools/${slug}`} key={`toolbar-nav-${idx}`}>
          <Icon
            className={clsx(
              `text-3xl lg:text-4xl hover:!${color} hover:opacity-50 active:opacity-100 transition-all`,
              {
                "text-gray-400 dark:text-gray-600": !router.pathname.startsWith(
                  `/tools/${slug}`
                ),
                [color]: router.pathname.startsWith(`/tools/${slug}`),
              }
            )}
          />
        </Link>
      ))}
    </div>
  );
};

export default ToolbarNavigation;
