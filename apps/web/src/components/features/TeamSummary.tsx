import { Card, Loader } from "@shared/components";
import getEnumName from "@src/utils/get-enum-name";
import getStringFromList from "@src/utils/get-string-from-list";
import { data } from "cheerio/lib/api/attributes";
import React from "react";
import { HiOutlineLightBulb } from "react-icons/hi";
import { Event, Topic, TopicTag } from "@shared/database";

interface TeamSummaryProps {
  code?: string;
  rank?: number;
  circuitName?: string;
  event?: Event;
  topics?: Topic[];
  topicTags?: TopicTag[];
  bids?: number;
  numResults?: number;
  avgSpeaks?: number;
  tWp?: number;
}

const TeamSummary = (props: TeamSummaryProps) => {
  return (
    <Card
      icon={<HiOutlineLightBulb />}
      title="Summary"
      className="relative max-w-[800px] mx-auto my-16 grid place-items-start"
    >
      <p className="flex flex-wrap space-x-1 text-center">
        {props.code || <Loader width={22} height={6} />} is the{" "}
        {props.rank ? "#" + props.rank : <Loader width={8} height={6} />} team
        on the{" "}
        {props.circuitName?.toLowerCase() || <Loader width={14} height={6} />}{" "}
        circuit for{" "}
        {props.event ? (
          getEnumName(props.event)
        ) : (
          <Loader width={14} height={6} />
        )}{" "}
        debate. After filtering by{" "}
        {props.topics ? (
          props.topics.length ? (
            `the following topics: ${getStringFromList(
              props.topics.map((t) => t.nickname)
            )}`
          ) : (
            "all topics"
          )
        ) : (
          <Loader width={8} height={6} />
        )}
        {" and "}
        {props.topicTags ? (
          props.topicTags.length ? (
            `the following topic types: ${getStringFromList(
              props.topicTags.map((t) => t.tag)
            )}`
          ) : (
            "all topic types"
          )
        ) : (
          <Loader width={8} height={6} />
        )}
        , they have{" "}
        {props.bids !== undefined ? (
          props.bids
        ) : (
          <Loader width={8} height={6} />
        )}{" "}
        bid
        {(props.bids || 2) > 1 ? "s" : ""} across{" "}
        {props.numResults || <Loader width={8} height={6} />} tournament
        {(props.numResults || 1) > 1 ? "s" : ""}, averaging{" "}
        {props.avgSpeaks?.toFixed(1) || <Loader width={8} height={6} />} speaker
        points on a true win percentage of{" "}
        {props.tWp ? (
          (props.tWp * 100).toFixed(1) + "%"
        ) : (
          <Loader width={8} height={6} />
        )}
        , with additional details below.
      </p>
    </Card>
  );
};

export default TeamSummary;
