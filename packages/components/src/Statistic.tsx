import clsx from "clsx";
import React, { ReactNode, useState } from "react";
import Text from "./Text";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./Tooltip";
import { BsQuestionCircle, BsQuestionCircleFill } from "react-icons/bs";
import { Balancer } from "react-wrap-balancer";

export interface StatisticProps {
  value?: string | number;
  description: string;
  tooltip?: string | ReactNode;
  primary?: boolean;
  className?: {
    wrapper?: string;
    inner?: string;
    value?: string;
    description?: string;
  };
  round?: number;
  isPercentage?: boolean;
}

const Statistic = ({
  value,
  description,
  tooltip,
  primary,
  className,
  round,
  isPercentage,
}: StatisticProps) => {
  if (round && value !== undefined && typeof value !== "string") {
    value =
      Math.round(
        (value as number) * (isPercentage ? 100 : 0) * Math.pow(10, round)
      ) / Math.pow(10, round);
  }
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const TooltipTag = tooltip ? TooltipTrigger : "div";

  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTag {...(tooltip && { asChild: true })} className="relative">
          <div
            className={clsx("flex flex-col", className?.wrapper, {
              "h-full py-4 border-gray-300/40 md:border-r": primary,
            })}
          >
            <div
              className={clsx(
                "flex flex-col items-center justify-start min-w-full mx-auto my-auto !text-white",
                {
                  "h-[3rem] md:h-[4rem] md:py-1 border-gray-300/40 border-r md:border-r-0":
                    primary,
                  "h-[4.25rem] pt-[0.45rem]": !primary,
                },
                className?.inner
              )}
            >
              <Text
                className={clsx(
                  {
                    "font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-400":
                      primary && value !== undefined,
                    "bg-gray-300/40 dark:bg-gray-700/40 animate-pulse rounded":
                      value === undefined,
                    "w-16 min-h-[2rem]": primary && value === undefined,
                    "w-16 min-h-[1.5rem]": !primary && value === undefined,
                    "text-3xl md:text-4xl":
                      primary &&
                      (value === undefined || value.toString().length < 5),
                    "text-2xl mt-1 md:my-1":
                      primary && value && value.toString().length > 4,
                  },
                  className?.value
                )}
              >
                {value !== undefined ? value : ""}
                {value !== undefined &&
                typeof value !== "string" &&
                isPercentage
                  ? "%"
                  : ""}
              </Text>
              <Text
                size="xs"
                className={clsx(
                  "text-center px-2 flex items-center",
                  className?.description
                )}
              >
                <Balancer>{description}</Balancer>
              </Text>
            </div>
          </div>
        </TooltipTag>
        <TooltipContent>
          <p className="[&>a]:underline">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Statistic;
