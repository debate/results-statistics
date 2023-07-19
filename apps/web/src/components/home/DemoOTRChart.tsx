import { Histogram } from "@shared/components";
import { trpc } from "@src/utils/trpc";
import React from "react";

const DemoOTRChart = () => {
  const { data } = trpc.landingPage.otrData.useQuery();

  return (
    <div className="absolute group-hover:translate-y-10 group-hover:scale-95 transition-all top-1/2 right-5 backdrop-blur-lg rounded-lg border border-gray-400/50 p-3">
      <Histogram data={data?.map((e) => e.otr) ?? []} dataType="OTR" primary />
    </div>
  );
};

export default DemoOTRChart;
