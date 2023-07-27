import React, { ReactNode, useState } from "react";
import clsx from "clsx";
import Text from "./Text";
import { RiExpandUpDownFill, RiContractUpDownFill } from "react-icons/ri";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

export interface CardProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  collapsible?: boolean;
  actionBar?: ReactNode;
  className?: string;
  theme?: string;
  [key: string]: any;
}

const Card = ({
  title,
  icon,
  children,
  collapsible,
  actionBar: ActionBar,
  className,
  theme,
  ...props
}: CardProps) => {
  const [open, setOpen] = useState(false);
  const HeaderTag = collapsible ? "button" : "div";

  return (
    <div
      className={clsx(
        className,
        "rounded-md md:border border-gray-400/50 backdrop-blur-3xl"
      )}
      {...props}
    >
      <div className="p-1 md:p-3">
        <Collapsible
          open={collapsible ? open : true}
          onOpenChange={collapsible ? setOpen : undefined}
        >
          <CollapsibleTrigger asChild>
            <HeaderTag
              className={clsx(
                "w-full flex justify-between items-center p-1 group",
                {
                  "cursor-pointer rounded-lg": collapsible,
                  "hover:bg-gray-400/10 active:bg-gray-400/20 dark:active:bg-gray-400/20 dark:hover:bg-gray-400/10":
                    collapsible && !open,
                }
              )}
            >
              <Text
                as="h3"
                className={clsx(
                  theme || "text-luka-200 dark:text-blue-600",
                  "font-semibold flex items-center text-2xl sm:text-3xl"
                )}
              >
                {icon}
                {icon && <span className="mx-1" />}
                {title}
              </Text>
              <div className="flex items-center mx-2 space-x-2">
                <div onClick={(e) => e.stopPropagation()}>
                  {collapsible ? (open ? ActionBar : undefined) : ActionBar}
                </div>
                {collapsible && (
                  <div className="bg-blue-200 rounded-full p-1 h-fit hover:opacity-75 active:opacity-100">
                    {open ? (
                      <RiContractUpDownFill className="text-luka-200 dark:text-blue-600 w-3.5 h-3.5" />
                    ) : (
                      <RiExpandUpDownFill className="text-luka-200 dark:text-blue-600 w-3.5 h-3.5" />
                    )}
                  </div>
                )}
              </div>
            </HeaderTag>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-col justify-between space-y-3 mt-2">
              {children}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default Card;
