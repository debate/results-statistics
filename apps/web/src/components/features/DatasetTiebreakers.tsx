import { Card } from "@shared/components";
import React from "react";
import { Balancer } from "react-wrap-balancer";
import { AiOutlineInfoCircle } from "react-icons/ai";

const DatasetTiebreakers = () => {
  return (
    <Card
      icon={<AiOutlineInfoCircle />}
      title="Tiebreakers"
      className="max-w-[800px] mx-auto my-4 md:my-8"
      collapsible
    >
      <p className="w-full text-center text-sm text-gray-600 dark:text-gray-400">
        <Balancer>
          All tournaments used in this dataset can be found in the "Tournaments"
          section. The team leaderboard ranks by OTR (higher is better), with no
          tiebreakers. The judge leaderboard ranks by Index (higher is better,
          with 10.0 being the maximum) with the number of rounds as a
          tiebreaker. The school leaderboard ranks by the number of entries at
          tournaments, with the number of unique teams and the number of unique
          tournaments attended as tiebreakers (higher is better for all 3
          metrics). All ranking metrics are specific to this dataset (event,
          circuit, and season).
        </Balancer>
      </p>
    </Card>
  );
};

export default DatasetTiebreakers;
