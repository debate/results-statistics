import { Card } from "@shared/components";
import React from "react";
import { Balancer } from "react-wrap-balancer";
import { AiOutlineInfoCircle } from "react-icons/ai";

const DatasetTiebreakers = () => {
  return (
    <Card
      icon={<AiOutlineInfoCircle />}
      title="Tiebreakers"
      className="max-w-[800px] mx-auto my-4 md:my-8 text-sm text-gray-600 dark:text-gray-400"
      collapsible
    >
      <p className="px-4 md:px-0 w-full">
        <Balancer>
          The tournaments comprising this dataset can be found in the
          "tournaments" section. The following tiebreakers are used (note that
          all metrics are specific to the event, circuit, and season of the
          dataset).
        </Balancer>
      </p>
      <ul className="mx-auto list-disc px-4 md:px-0">
        <li>
          <p>Team Leaderboard</p>
          <ul className="ml-4 list-decimal">
            <li>OTR (higher is better)</li>
          </ul>
        </li>
        <li>
          <p>Judge Leaderboard</p>
          <ul className="ml-4 list-decimal">
            <li>Index (higher is better, max of 10.0)</li>
            <li>Number of rounds</li>
          </ul>
        </li>
        <li>
          <p>School Leaderboard (2+ teams required)</p>
          <ul className="ml-4 list-decimal">
            <li>Average of team OTRs</li>
            <li>Number of entries at tournaments</li>
            <li>Number of unique teams</li>
            <li>Number of unique tournaments</li>
          </ul>
        </li>
      </ul>
    </Card>
  );
};

export default DatasetTiebreakers;
