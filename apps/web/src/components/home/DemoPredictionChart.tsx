import { PercentageTick } from "@shared/components";
import { useTheme } from "next-themes";
import React from "react";
import { BarChart, XAxis, YAxis, Bar, LabelList, Cell } from "recharts";

const DemoPredictionChart = () => {
  const { theme } = useTheme();
  const chartData = [
    {
      pct: 72.9,
      label: "BCC GT",
    },
    {
      pct: 27.1,
      label: "Durham WS",
    },
  ];

  return (
    <div className="absolute group-hover:-translate-y-10 group-hover:translate-x-10 transition-all bottom-0 left-0 backdrop-blur-lg rounded-lg border border-gray-400/50 p-3">
      <p className="w-full text-center text-indigo-500 dark:text-indigo-400 font-semibold">
        Round Prediction
      </p>
      <BarChart width={300} height={200} data={chartData} className="mr-5">
        <XAxis dataKey="label" />
        <YAxis tick={PercentageTick} ticks={[0, 25, 50, 75, 100]} />
        <Bar
          dataKey="pct"
          fill="#8884d8"
          opacity={theme === "dark" ? 1 : 0.75}
          radius={5}
        >
          <LabelList
            dataKey="pct"
            formatter={(v: number) => Math.floor(v * 10) / 10 + "%"}
            position="insideBottom"
            angle={0}
            offset={5}
            fill={!theme || theme === "dark" ? "white" : "black"}
            fontWeight="600"
          />
          <Cell fill="rgb(56 189 248)" />
          <Cell fill="rgb(167 139 250)" />
        </Bar>
      </BarChart>
    </div>
  );
};

export default DemoPredictionChart;
