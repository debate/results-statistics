import { Histogram } from "@shared/components";
import { trpc } from "@src/utils/trpc";
import React from "react";

const DemoOTRChart = () => {
  const { data } = trpc.landingPage.otrData.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return (
    <div className="absolute group-hover:translate-y-10 group-hover:scale-95 transition-all bottom-10 right-60 backdrop-blur-lg rounded-lg border border-gray-400/50 p-3">
      <Histogram data={data?.map((e) => e.otr) ?? []} dataType="OTR" primary />
    </div>
  );
};

export default DemoOTRChart;
