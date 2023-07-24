import { Card, Loader } from "@shared/components";
import getEnumName from "@src/utils/get-enum-name";
import getStringFromList from "@src/utils/get-string-from-list";
import { data } from "cheerio/lib/api/attributes";
import React from "react";
import { HiOutlineLightBulb } from "react-icons/hi";
import { Event, Topic, TopicTag } from "@shared/database";
import { Balancer } from "react-wrap-balancer";

interface DatasetSummaryProps {
  event?: Event;
  season?: number;
  circuit?: string;
  numTourns?: number;
  numTeams?: number;
  numSchools?: number;
  numBids?: number;
  avgSpeaks?: number;
  avgStdSpeaks?: number;
  avgOtr?: number;
  avgIndex?: number;
}

const DatasetSummary = (props: DatasetSummaryProps) => {
  return (
    <Card
      icon={<HiOutlineLightBulb />}
      title="Summary"
      className="relative max-w-[800px] mx-auto my-4 md:my-8"
    >
      <p className="text-center w-full">
        <Balancer>
          Our {props.season} {props.circuit} circuit {getEnumName(props.event)}{" "}
          dataset features {props.numTeams} teams from {props.numSchools}{" "}
          schools competing in {props.numTourns} tournaments
          {["PublicForum", "LincolnDouglas", "Policy"].includes(
            props.event || ""
          ) && ` and amassing ${props.numBids} TOC bids.`}{" "}
          Teams achieved an average OTR (ranking metric) of{" "}
          {props.avgOtr?.toFixed(2)} while judges recieved an average index of{" "}
          {props.avgIndex?.toFixed(1)}, where 10 is a perfect track record. The
          average speaker points for the dataset is{" "}
          {props.avgSpeaks?.toFixed(1)}, with a standard deviation of{" "}
          {props.avgStdSpeaks?.toFixed(1)}. Check out all of our data below!
        </Balancer>
      </p>
    </Card>
  );
};

export default DatasetSummary;
