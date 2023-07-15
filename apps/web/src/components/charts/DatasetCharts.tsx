import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Chart, Histogram, Text } from "@shared/components";
import { AiOutlineLineChart } from "react-icons/ai";

interface ChartData {
  speaking: {
    stdDevPoints: number;
    rawAvgPoints: number;
  }[];
  judge: {
    numPrelimScrews: number | null;
    numSquirrels: number | null;
    numAff: number | null;
    numPro: number | null;
    numNeg: number | null;
    numCon: number | null;
  }[];
  otr: { otr: number }[];
  index: { index: number }[];
}

interface DatasetChartsProps {
  data?: ChartData;
}

const DatasetCharts = ({ data }: DatasetChartsProps) => {
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <Card
      icon={<AiOutlineLineChart />}
      title="Analytics"
      className="relative max-w-[800px] mx-auto my-4 md:my-8"
      collapsible
    >
      <div className="w-full mx-auto grid sm:grid-cols-2 gap-4">
        {ready && (
          <>
            <Histogram
              data={data?.otr.map((e) => e.otr) || []}
              dataType="OTR"
            />
            <Histogram
              data={data?.index.map((e) => e.index) || []}
              dataType="Index"
            />
            <Histogram
              data={data?.speaking.map((e) => e.rawAvgPoints) || []}
              dataType="Raw Speaking"
              visibleDeviations={4}
            />
            <Histogram
              data={data?.speaking.map((e) => e.stdDevPoints) || []}
              dataType="Std. Speaks"
              visibleDeviations={4}
            />
            <Histogram
              data={
                data?.judge.map(
                  (e) => (e.numPrelimScrews || 0) + (e.numSquirrels || 0)
                ) || []
              }
              dataType="Screw/Squirrel"
            />
            <Histogram
              data={
                data?.judge.map(
                  (e) =>
                    ((e.numAff || 0) + (e.numPro || 0)) /
                    ((e.numAff || 0) +
                      (e.numPro || 0) +
                      (e.numNeg || 0) +
                      (e.numCon || 0))
                ) || []
              }
              dataType="% Pro/Aff"
              isPercentage
            />
          </>
        )}
      </div>
    </Card>
  );
};

export default DatasetCharts;
