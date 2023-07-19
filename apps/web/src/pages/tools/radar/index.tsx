import { Radar } from "@src/components/features";
import FeaturePage from "@src/components/layout/ToolPage";
import React from "react";

const Index = () => {
  return (
    <FeaturePage
      name="Radar"
      description="Use it to analyze tournament entries and judges."
      feature={<Radar />}
      instructions={[
        ["Find your tournament.", "This pulls from Tabroom's search directly."],
        [
          "Define your event by selecting...",
          "the judge pool you want a Strike Sheet for.",
          "the entry field you want a Threat Sheet for.",
        ],
        'Get your results by selecting "Threat Sheet" (teams) or "Strike Sheet" (judges).',
      ]}
    />
  );
};

export default Index;
