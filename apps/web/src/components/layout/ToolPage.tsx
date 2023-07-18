import { Card, Text } from "@shared/components";
import React, { ReactNode } from "react";
import { Balancer } from "react-wrap-balancer";
import ToolbarNavigation from "../features/ToolbarNavigation";

interface ToolPageProps {
  name: string;
  description: string;
  instructions: (string | string[])[];
  feature: ReactNode;
}

const ToolPage = ({
  feature,
  name,
  description,
  instructions,
}: ToolPageProps) => {
  return (
    <div className="w-full min-h-screen lg:min-h-full flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full lg:h-[800px] place-items-start p-4 lg:p-8 max-w-[1500px] mx-auto">
        <div className="grid place-items-center mx-auto">
          <div className="space-y-4 w-fit mx-auto">
            <h1 className="text-4xl lg:text-6xl xl:text-8xl font-mono w-fit lg:max-w-3xl mx-auto">
              Welcome to{" "}
              <span className="bg-gradient-to-r font-black from-sky-400 via-purple-500 to-red-400 text-transparent bg-clip-text">
                {name}
              </span>
              .
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg lg:text-xl lg:ml-2">
              {description}
            </p>
            <div className="lg:hidden py-8">{feature}</div>
            <p className="text-gray-600 dark:text-gray-400 lg:text-lg lg:ml-2">
              <Balancer>
                Here's what you do:
                <ul className="list-decimal ml-8 lg:max-w-md space-y-2 mt-2">
                  {instructions.map((node, idx) =>
                    Array.isArray(node) ? (
                      <li key={`feature-${name}-instructions-${idx}`}>
                        {node[0]}
                        <ul className="list-disc ml-4 space-y-1">
                          {node.slice(1).map((child, childIdx) => (
                            <li
                              key={`feature-${name}-instructions-${idx}-${childIdx}`}
                            >
                              {child}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ) : (
                      <li key={`feature-${name}-instructions-${idx}`}>
                        {node}
                      </li>
                    )
                  )}
                </ul>
              </Balancer>
            </p>
          </div>
        </div>
        <div className="hidden lg:flex space-y-10 flex-col justify-start w-full h-full">
          {feature}
          <ToolbarNavigation />
        </div>
      </div>
      <div className="flex w-full justify-start lg:hidden mt-8">
        <ToolbarNavigation />
      </div>
    </div>
  );
};

export default ToolPage;
