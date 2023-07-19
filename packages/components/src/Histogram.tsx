import React, { useMemo } from "react";
import * as d3 from "d3-array";
import {
  XAxis,
  YAxis,
  Bar,
  ComposedChart,
  Line,
  Label,
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import clsx from "clsx";

interface HistogramProps {
  data: number[];
  dataType: string;
  visibleDeviations?: number;
  isPercentage?: boolean;
  primary?: boolean;
}

const Histogram = ({
  data,
  dataType,
  visibleDeviations,
  isPercentage,
  primary,
}: HistogramProps) => {
  const { theme } = useTheme();
  const { mean, stdDev, filteredData } = useMemo(() => {
    const filteredData: {
      count: number;
      x0: number;
      x1: number;
      range: string;
    }[] = [];
    const mean = d3.mean(data)!;
    const stdDev = d3.deviation(data)!;

    const bins = d3.bin()(
      visibleDeviations
        ? data.filter((d) => Math.abs((d - mean) / stdDev) <= visibleDeviations)
        : data
    );
    bins.map((bin) => {
      bin.x0 &&
        bin.x1 &&
        filteredData.push({
          count: bin.length,
          x0: bin.x0,
          x1: bin.x1,
          range: `${bin.x0}-${bin.x1}`,
        });
    });
    return { mean, stdDev, filteredData };
  }, [data, visibleDeviations]);

  return (
    <div className="w-full mx-auto pr-8 flex flex-col items-center">
      <h3
        className={clsx("ml-6 mb-2", {
          "text-indigo-500 dark:text-indigo-400 font-semibold": primary,
          "text-gray-600 dark:text-gray-500": !primary,
        })}
      >
        {dataType} Distribution
        {visibleDeviations && ` ± ${visibleDeviations} σ`}
      </h3>
      <p className="text-gray-600 dark:text-gray-500 text-sm text-center">
        μ: {isPercentage ? (mean * 100)?.toFixed(1) + "%" : mean?.toFixed(1)}
        &nbsp; σ:{" "}
        {isPercentage ? (stdDev * 100)?.toFixed(1) + "%" : stdDev?.toFixed(1)}
      </p>
      <ComposedChart
        width={300}
        height={200}
        data={filteredData}
        barCategoryGap={1}
        margin={{ top: 10, bottom: 25, right: 30, left: 10 }}
      >
        <XAxis dataKey="range" hide />
        <XAxis
          dataKey="x0"
          xAxisId="values"
          tickMargin={8}
          tickFormatter={
            isPercentage ? (v: number) => (v * 100).toFixed(0) + "%" : undefined
          }
        >
          <Label
            position="centerBottom"
            value={dataType}
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
        <Bar
          dataKey="count"
          fill="#8884d8"
          opacity={theme === "dark" ? 1 : 0.75}
          radius={5}
        />
        <Line
          type="monotone"
          dataKey="count"
          strokeWidth={2}
          z={5}
          stroke="#67e8f9"
          opacity={theme === "dark" ? 1 : 0.75}
        />
      </ComposedChart>
    </div>
  );
};

export default Histogram;
