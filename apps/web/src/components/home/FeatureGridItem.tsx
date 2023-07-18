import clsx from "clsx";
import { StaticImageData } from "next/image";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { IconType } from "react-icons";
import { Balancer } from "react-wrap-balancer";
import { BiLinkExternal } from "react-icons/bi";

interface FeatureGridItemProps {
  name: string;
  theme: string;
  Icon: IconType;
  src: StaticImageData;
  description: string;
  slug?: string;
  wide?: boolean;
  tall?: boolean;
  preview?: boolean;
  onPreviewClick?: () => void;
}

const FeatureGridItem = ({
  name,
  Icon,
  theme,
  src,
  description,
  slug,
  wide,
  tall,
  preview,
  onPreviewClick,
}: FeatureGridItemProps) => {
  const Tag = slug ? Link : "button";
  return (
    <Tag
      href={`/tools/${slug}`}
      {...(preview && {
        onClick: onPreviewClick,
      })}
      className={clsx(
        "h-72 group relative w-full bg-slate-500 dark:bg-slate-800 flex flex-col justify-between rounded-lg overflow-hidden md:hover:shadow-2xl row-span-1",
        {
          "md:col-span-2": wide,
          "md:row-span-2 md:h-auto": tall,
        }
      )}
    >
      <div className="w-full relative grid place-content-center rounded overflow-hidden border-none h-full">
        <Image
          src={src}
          alt={`${name} Demo`}
          className="md:group-hover:scale-[102%] md:group-active:scale-100 rounded-lg mx-auto transition-all object-cover"
          fill
          placeholder="blur"
          loading="eager"
        />
        {preview && (
          <div className="w-full h-full grid place-content-center z-30">
            <div
              className={clsx(
                "font-semibold flex items-center space-x-1 md:group-active:opacity-80 pb-10",
                theme
              )}
            >
              <p>Coming soon</p>
              <BiLinkExternal className="md:group-hover:-translate-y-0.5 md:group-hover:translate-x-0.5 md:group-active:translate-x-0 md:group-active:translate-y-0 transition-all" />
            </div>
          </div>
        )}
        <div className="absolute bottom-0 bg-slate-500 dark:bg-slate-800 h-10 w-full" />
        <div
          className={clsx(
            "absolute bottom-10  w-full h-full bg-gradient-to-t from-slate-500 dark:from-slate-800 via-slate-500/70 dark:via-slate-800/70 to-slate-500/90 dark:to-slate-800/90",
            {
              "md:backdrop-blur-[1px] md:group-hover:backdrop-blur-none":
                !preview,
              "backdrop-blur": preview,
            }
          )}
        />
      </div>
      <div className="absolute bottom-0 p-4 w-full space-y-1">
        <div className="h-18 md:h-24">
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
            className={clsx("text-gray-200 text-start", {
              "md:w-1/2": wide,
            })}
          >
            <Balancer>{description}</Balancer>
          </p>
        </div>
      </div>
    </Tag>
  );
};

export default FeatureGridItem;
