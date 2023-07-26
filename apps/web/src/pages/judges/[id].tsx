/* eslint-disable @next/next/no-html-link-for-pages */
import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { trpc } from "@src/utils/trpc";
import { NextSeo } from "next-seo";
import Overview from "@src/components/layout/Overview";
import Statistics from "@src/components/layout/Statistics";
import _ from "lodash";
import { JudgingHistoryTable } from "@src/components/tables/judge";
import getEnumName from "@src/utils/get-enum-name";
import { ParsedUrlQuery } from "querystring";
import { prisma } from "@shared/database";
import { appRouter } from "@src/server/routers/_app";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetServerSideProps } from "next";
import JudgeCharts from "@src/components/charts/JudgeCharts";
import FilterButton from "@src/components/features/FilterButton";
import FilterModal from "@src/components/features/FilterModal";
import Paradigm from "@src/components/features/Paradigm";
import JudgeDifferentialTable from "@src/components/tables/judge/JudgeDifferentialTable";
import CommandBar from "@src/components/features/CommandBar";
import JudgeSummary from "@src/components/features/JudgeSummary";
import boundPct from "@src/utils/bound-pct";
import getPercentile from "@src/utils/get-percentile";
import getFilterSummary from "@src/utils/get-filter-summary";
import getStringFromList from "@src/utils/get-string-from-list";

const Judge = () => {
  const { query, isReady, asPath } = useRouter();
  const { data } = trpc.judge.summary.useQuery(
    {
      id: query.id as string,
      ...(query.circuits && {
        circuits: (query.circuits as unknown as string)
          .split(",")
          .map((c) => parseInt(c)),
      }),
      ...(query.seasons && {
        seasons: (query.seasons as unknown as string)
          .split(",")
          .map((c) => parseInt(c)),
      }),
      ...(query.topics && {
        topics: (query.topics as string).split(",").map((t) => parseInt(t)),
      }),
      ...(query.topicTags && {
        topicTags: (query.topicTags as string)
          .split(",")
          .map((t) => parseInt(t)),
      }),
    },
    {
      enabled: isReady,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
    }
  );
  const rankingData: [undefined | string, undefined | string] = useMemo(() => {
    if (!data || (!data.ranking.targeted && !data.ranking.aggregated))
      return [undefined, undefined];
    if (data.ranking.targeted) {
      return [
        "#" + data.ranking.targeted.circuitRank,
        data.ranking.targeted.index.toFixed(1),
      ];
    } else if (data.ranking.aggregated) {
      let rawAvg = _.round(
        _.mean(data.ranking.aggregated.map((r) => r.z_score)),
        1
      );
      let avg = `${rawAvg >= 0 ? "+" : "-"}${rawAvg}`;
      const pctl =
        boundPct(
          _.round(
            getPercentile(
              _.mean(data.ranking.aggregated.map((r) => r.z_score))
            ) * 100
          )
        ) + "%";
      return [pctl, avg];
    }
    return [undefined, undefined];
  }, [data]);

  const numRounds = data?.results
    ?.map(
      (r) =>
        (r.numAff || 0) + (r.numNeg || 0) + (r.numPro || 0) + (r.numCon || 0)
    )
    .reduce((a, b) => a + b, 0);
  const avgSpeaks = (
    data
      ? _.mean(
          data.results
            .filter((r) => r.avgRawPoints)
            .map((r) => r.avgRawPoints) || [0]
        ).toFixed(1)
      : NaN
  ) as number;

  const avgStdSpeaks = (
    data
      ? _.mean(
          data.results
            .filter((r) => r.stdDevPoints)
            .map((r) => r.stdDevPoints) || [0]
        ).toFixed(1)
      : NaN
  ) as number;

  const SEO_TITLE = `${data?.name || "--"}'s Profile — Debate Land`;
  const SEO_DESCRIPTION = `${
    data?.name || "--"
  }'s judge statistics for ${getEnumName(
    data?.rankings[0].circuit.event
  )}, exclusively on Debate Land.`;

  return (
    <>
      <NextSeo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        openGraph={{
          title: SEO_TITLE,
          description: SEO_DESCRIPTION,
          type: "website",
          url: `https://debate.land${asPath}`,
          images: [
            {
              url: `https://debate.land/api/og?title=${data?.name}&label=Judge`,
            },
          ],
        }}
        additionalLinkTags={[
          {
            rel: "icon",
            href: "/favicon.ico",
          },
        ]}
        noindex
      />
      <div className="min-h-screen">
        <Overview
          label="Judge"
          heading={data ? data.name : undefined}
          subtitle={
            data ? (
              <CommandBar
                topics={data ? data.filterData : []}
                subscriptionName={data?.name}
                emailProps={{
                  judgeId: data?.id,
                }}
              >
                {getFilterSummary(
                  data.rankings.map((r) => r.circuit.event),
                  data.rankings.map((r) => r.circuit.name),
                  !!query.seasons
                    ? (query.seasons as string)
                        .split(",")
                        .map((s) => parseInt(s))
                    : undefined
                )}
              </CommandBar>
            ) : undefined
          }
          underview={
            <Statistics
              primary={[
                {
                  value: rankingData[0],
                  ...(data?.ranking?.aggregated
                    ? {
                        description: "Judge Pctl. Rank",
                        tooltip:
                          "Judge percentile ranking on circuit/season combination in view.",
                      }
                    : {
                        description: "Judge Rank",
                        tooltip:
                          "Judge ranking on circuit/season combination in view.",
                      }),
                },
                {
                  value: rankingData[1],
                  ...(data?.ranking?.aggregated
                    ? {
                        description: "Avg. Index Z-Score",
                        tooltip: (
                          <>
                            The average number of std. deviations a judge's
                            Index score is from the circuit mean. To learn more,
                            click <a href="/methodology">here</a>.
                          </>
                        ),
                      }
                    : {
                        description: "Index Score",
                        tooltip: (
                          <>
                            A total aggregate score of how close to expected win
                            percentages a judge's ballots were. To learn more,
                            click <a href="/methodology">here</a>.
                          </>
                        ),
                      }),
                },
                {
                  value: data ? numRounds : undefined,
                  description: "Rounds",
                  tooltip: "Number of rounds judged on the circuit.",
                },
                {
                  value: !isNaN(avgSpeaks) ? avgSpeaks : "--",
                  description: "Avg. Speaks",
                  tooltip: "Average speaker points awarded on the circuit.",
                },
              ]}
            />
          }
        />
        <JudgeSummary
          name={data?.name}
          rank={
            data?.ranking.targeted
              ? `is the ${rankingData[0]} judge`
              : `places above ${rankingData[0]} of judges (by index)`
          }
          circuits={
            data
              ? (data.ranking.targeted && [data.rankings[0].circuit.name]) ||
                (data.ranking.aggregated &&
                  _.uniq(data.ranking.aggregated.map((r) => r.circuit_name)))
              : undefined
          }
          seasons={
            data
              ? (data.ranking.targeted && [data.rankings[0].seasonId]) ||
                (data.ranking.aggregated &&
                  _.uniq(data.ranking.aggregated.map((r) => r.season_id)))
              : undefined
          }
          events={_.uniq(data?.rankings.map((r) => r.circuit.event))}
          topics={data?.filter.topics}
          topicTags={data?.filter.topicTags}
          numRounds={numRounds}
          avgSpeaks={avgSpeaks}
          avgStdSpeaks={avgStdSpeaks}
        />
        <JudgingHistoryTable data={data?.results || []} />
        <JudgeCharts results={data?.results || []} />
        <JudgeDifferentialTable data={data?.results || []} />
        <Paradigm data={data?.paradigms || []} />
      </div>
    </>
  );
};

interface JudgeParams extends ParsedUrlQuery {
  id: string;
  circuits?: string;
  seasons?: string;
  topics?: string;
  topicTags?: string;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: {
      prisma,
    },
  });

  const { id, circuits, seasons, topics, topicTags } = ctx.query as JudgeParams;

  await ssg.judge.summary.prefetch({
    id,
    ...(circuits && { circuits: circuits.split(",").map(parseInt) }),
    ...(seasons && { seasons: seasons.split(",").map(parseInt) }),
    ...(topics && { topics: topics?.split(",").map(parseInt) }),
    ...(topicTags && {
      topicTags: topicTags?.split(",").map(parseInt),
    }),
  });

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  };
};

export default Judge;
