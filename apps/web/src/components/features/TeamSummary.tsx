import { Card, Loader } from "@shared/components";
import getEnumName from "@src/utils/get-enum-name";
import getStringFromList from "@src/utils/get-string-from-list";
import { data } from "cheerio/lib/api/attributes";
import React from "react";
import { HiOutlineLightBulb } from "react-icons/hi";
import { Event, Topic, TopicTag } from "@shared/database";
import { Balancer } from "react-wrap-balancer";

interface TeamSummaryProps {
  code?: string;
  rank?: string;
  circuits?: string[];
  seasons?: number[];
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
      className="relative max-w-[800px] mx-auto my-4 md:my-8"
    >
      <p className="mx-auto text-center">
        <Balancer>
          {props.code || <Loader width={22} height={6} />}{" "}
          {props.rank ?? <Loader width={8} height={6} />} on the{" "}
          {props.circuits ? (
            getStringFromList(props.circuits.map((n) => n.toLowerCase()))
          ) : (
            <Loader width={14} height={6} />
          )}{" "}
          circuit{(props.circuits?.length || 1) > 1 ? "s" : ""} for{" "}
          {props.event ? (
            getEnumName(props.event)
          ) : (
            <Loader width={14} height={6} />
          )}{" "}
          debate during the{" "}
          {props.seasons ? (
            getStringFromList(props.seasons.map((n) => n.toString()))
          ) : (
            <Loader width={14} height={6} />
          )}{" "}
          season{(props.seasons?.length || 1) > 1 ? "s" : ""}. After further
          filtering by{" "}
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
          {props.avgSpeaks?.toFixed(1) || <Loader width={8} height={6} />}{" "}
          speaker points on a true win percentage of{" "}
          {props.tWp ? (
            (props.tWp * 100).toFixed(1) + "%"
          ) : (
            <Loader width={8} height={6} />
          )}
          , with additional details below.
        </Balancer>
      </p>
    </Card>
  );
};

export default TeamSummary;
