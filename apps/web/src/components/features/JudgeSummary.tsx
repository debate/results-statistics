import { Card, Loader } from "@shared/components";
import getEnumName from "@src/utils/get-enum-name";
import getStringFromList from "@src/utils/get-string-from-list";
import React from "react";
import { HiOutlineLightBulb } from "react-icons/hi";
import { Event, Topic, TopicTag } from "@shared/database";

interface JudgeSummaryProps {
  name?: string;
  index?: number;
  circuitName?: string;
  event?: Event;
  topics?: Topic[];
  topicTags?: TopicTag[];
  numRounds?: number;
  avgSpeaks?: number;
  avgStdSpeaks?: number;
}

const JudgeSummary = (props: JudgeSummaryProps) => {
  return (
    <Card
      icon={<HiOutlineLightBulb />}
      title="Summary"
      className="relative max-w-[800px] mx-auto my-4 md:my-8 grid place-items-start"
    >
      <p className="flex flex-wrap space-x-1 text-center">
        {props.name || <Loader width={22} height={6} />} has a judge index of{" "}
        {props.index ? props.index.toFixed(1) : <Loader width={8} height={6} />}{" "}
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
        , they give an average of{" "}
        {props.avgSpeaks !== undefined ? (
          props.avgSpeaks
        ) : (
          <Loader width={8} height={6} />
        )}{" "}
        speaker point
        {(props.avgSpeaks || 2) > 1 ? "s" : ""} with an average standard
        deviation of {props.avgStdSpeaks || <Loader width={8} height={6} />}{" "}
        points through {props.numRounds || <Loader width={8} height={6} />}{" "}
        round
        {(props.numRounds || 1) > 1 ? "s" : ""}, with additional details below.
      </p>
    </Card>
  );
};

export default JudgeSummary;
