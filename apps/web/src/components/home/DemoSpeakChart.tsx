import { data } from "cheerio/lib/api/attributes";
import { format } from "mysql2";
import React, { useMemo } from "react";
import * as d3 from "d3-array";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Label } from "recharts";
import { trpc } from "@src/utils/trpc";

const DemoSpeakChart = () => {
  const { data } = trpc.landingPage.speakingData.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    const filteredData: {
      count: number;
      range: string;
    }[] = [];
    const mean = d3.mean(data)!;
    const stdDev = d3.deviation(data)!;

    const bins = d3.bin()(
      data.filter((d) => Math.abs((d - mean) / stdDev) <= 4)
    );
    bins.map((bin) => {
      bin.x0 &&
        bin.x1 &&
        filteredData.push({
          count: bin.length,
          range: bin.x0.toFixed(1),
        });
    });
    return filteredData;
  }, [data]);

  return (
    <div className="absolute group-hover:-translate-y-10 group-hover:scale-105 transition-all top-24 right-1/2 backdrop-blur-lg rounded-lg border border-gray-400/50 p-3">
      <p className="w-full text-center text-indigo-500 dark:text-indigo-400 font-semibold mb-2">
        Speaking Distribution
      </p>
      <AreaChart
        width={300}
        height={200}
        data={filteredData}
        margin={{ top: 10, right: 40, left: 10, bottom: 25 }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="range" tickMargin={8}>
          <Label
            position="centerBottom"
            value="Points"
            dy={30}
            transform="10"
          />
        </XAxis>
        <YAxis>
          <Label
            position="centerTop"
            value="Frequency"
            offset={20}
            dx={-30}
            angle={270}
          />
        </YAxis>
        <Area
          type="monotone"
          dataKey="count"
          stroke="#67e8f9"
          fillOpacity={1}
          fill="url(#colorUv)"
        />
      </AreaChart>
    </div>
  );
};

export default DemoSpeakChart;
