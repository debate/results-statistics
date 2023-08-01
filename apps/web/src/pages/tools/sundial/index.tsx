import { Radar } from "@src/components/features";
import Sundial from "@src/components/features/Sundial";
import FeaturePage from "@src/components/layout/ToolPage";
import React from "react";
import { GiSundial } from "react-icons/gi";

const Index = () => {
  return (
    <FeaturePage
      name="Sundial"
      description="Use it to keep track of TOC bid tournaments."
      feature={<Sundial />}
      instructions={["Select an event and season.", "Get your results!"]}
    />
  );
};

export default Index;
