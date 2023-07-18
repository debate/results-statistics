import clsx from "clsx";
import { StaticImageData } from "next/image";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { IconType } from "react-icons";

interface FeatureGridItemProps {
  name: string;
  theme: string;
  Icon: IconType;
  src: StaticImageData;
  description: string;
  slug: string;
  priority?: boolean;
}

const FeatureGridItem = ({
  name,
  Icon,
  theme,
  src,
  description,
  slug,
  priority,
}: FeatureGridItemProps) => {
  return (
    <Link
      href={`/tools/${slug}`}
      className={clsx(
        "h-72 group relative w-full bg-slate-500 dark:bg-slate-800 flex flex-col justify-between rounded-lg overflow-hidden hover:shadow-2xl",
        {
          "md:col-span-2": priority,
        }
      )}
    >
      <div className="w-full relative grid place-content-center rounded overflow-hidden border-none">
        <Image
          src={src}
          alt="Sample Dataset"
          className="group-hover:scale-105 group-active:scale-100 rounded-lg mx-auto transition-all"
          placeholder="blur"
          loading="eager"
          quality={1}
        />
        <div className="absolute bottom-0 bg-slate-500 dark:bg-slate-800 h-10 w-full"></div>
        <div className="absolute bottom-10 w-full h-full bg-gradient-to-t from-slate-500 dark:from-slate-800 via-slate-500/70 dark:via-slate-800/70 to-slate-500/90 dark:to-slate-800/90" />
      </div>
      <div className="absolute bottom-0 p-4 w-full space-y-1">
        <div className="h-24">
          <p className={`${theme} font-semibold flex items-center`}>
            <Icon
              className={clsx(
                "rounded-full mr-1 group-hover:-rotate-12 group-active:rotate-0 transition-all",
                theme
              )}
            />
            {name}
          </p>
          <p
            className={clsx("text-gray-200", {
              "w-1/2": priority,
            })}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default FeatureGridItem;
