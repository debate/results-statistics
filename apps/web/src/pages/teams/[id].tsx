/* eslint-disable @next/next/no-html-link-for-pages */
import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { trpc } from "@src/utils/trpc";
import { TournamentHistoryTable } from "@src/components/tables/team";
import { NextSeo } from "next-seo";
import Overview from "@src/components/layout/Overview";
import Statistics from "@src/components/layout/Statistics";
import getEnumName from "@src/utils/get-enum-name";
import { appRouter } from "../../server/routers/_app";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetServerSideProps } from "next";
import { ParsedUrlQuery } from "querystring";
import { prisma } from "@shared/database";
import { omit } from "lodash";
import TeamCharts from "@src/components/charts/TeamCharts";
import TeamInfoTable from "@src/components/tables/team/TeamInfoTable";
import TeamDifferentialTable from "@src/components/tables/team/TeamDifferentialTable";
import CommandBar from "@src/components/features/CommandBar";
import { BiLinkExternal } from "react-icons/bi";
import TeamSummary from "@src/components/features/TeamSummary";
import NsdBadge from "@src/components/nsd-badge";
import _ from "lodash";
import getPercentile from "@src/utils/get-percentile";
import boundPct from "@src/utils/bound-pct";

const Team = () => {
  const { query, isReady, asPath, ...router } = useRouter();
  const { data } = trpc.team.summary.useQuery(
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
        data.ranking.targeted.otr.toFixed(1),
      ];
    } else if (data.ranking.aggregated) {
      let rawAvg = _.round(
        _.mean(data.ranking.aggregated.map((r) => r.otr)),
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

  const SEO_TITLE = `${data?.aliases[0]?.code || "--"}'s Profile — Debate Land`;
  const SEO_DESCRIPTION = `${
    data?.aliases[0].code || "--"
  }'s competitive statistics for ${
    data ? getEnumName(data.circuits[0].event) : "--"
  }, exclusively on Debate Land.`;

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
              url: `https://debate.land/api/og?title=${data?.aliases[0].code}&label=Team`,
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
          label="Team"
          heading={
            data ? (
              <>
                <button
                  onClick={() =>
                    router.push({
                      pathname: `/competitors/${data.competitors[0].id}`,
                      query: omit(query, "id"),
                    })
                  }
                  className="relative hover:opacity-80 active:opacity-100 mr-3 md:mr-4"
                >
                  <BiLinkExternal className="absolute text-xs p-px md:text-sm md:p-0 top-1 -right-3 md:-right-4" />
                  {data.competitors[0].name}
                </button>
                {data.competitors.length > 1 && (
                  <span>
                    {" & "}
                    <button
                      onClick={() =>
                        router.push({
                          pathname: `/competitors/${data.competitors[1].id}`,
                          query: omit(query, "id"),
                        })
                      }
                      className="relative hover:opacity-80 active:opacity-100 mr-3 md:mr-4"
                    >
                      <BiLinkExternal className="absolute text-xs p-px md:text-sm md:p-0 top-1 -right-3 md:-right-4" />
                      {data.competitors[1].name}
                    </button>
                  </span>
                )}
                {(data.metadata as any)?.nsdAlum && <NsdBadge size="large" />}
              </>
            ) : undefined
          }
          subtitle={
            data ? (
              <CommandBar
                topics={data ? data.filterData : []}
                subscriptionName={data?.aliases[0].code || ""}
                emailProps={{
                  teamId: data?.id,
                }}
              >
                {getEnumName(data.circuits[0].event)} | {data.circuits[0].name}{" "}
                | {data.seasons[0].id.toString()}
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
                        description: "Team Pctl. Rank",
                        tooltip:
                          "Team percentile ranking on circuit/season combination in view.",
                      }
                    : {
                        description: "Team Rank",
                        tooltip:
                          "Team ranking on circuit/season combination in view.",
                      }),
                },
                {
                  value: rankingData[1],
                  ...(data?.ranking?.aggregated
                    ? {
                        description: "Avg. OTR Z-Score",
                        tooltip: (
                          <>
                            The average number of std. deviations a team's OTR
                            score is from the circuit mean. To learn more, click{" "}
                            <a href="/methodology">here</a>.
                          </>
                        ),
                      }
                    : {
                        description: "OTR Score",
                        tooltip: (
                          <>
                            A total aggregate score of every round a team
                            debated on the circuit. To learn more, click{" "}
                            <a href="/methodology">here</a>.
                          </>
                        ),
                      }),
                },
                {
                  value: data ? data.statistics.bids || "--" : undefined,
                  description: `TOC Bid${
                    (data?.statistics.bids || 2) > 1 ? "s" : ""
                  }`,
                  tooltip:
                    "Number of TOC bids acquired. Ghost bids are counted and silver bids are worth half.",
                },
                {
                  value: data
                    ? data.statistics.avgSpeaks
                      ? Math.round(data.statistics.avgSpeaks * 10) / 10
                      : "--"
                    : undefined,
                  description: "Avg. Raw Spks.",
                  tooltip: "Average of team speaker points.",
                },
              ]}
              advanced={[
                {
                  value: data?.results.length,
                  description: "Tourns.",
                  tooltip: "Number of tournaments in view.",
                },
                {
                  value: data
                    ? data.statistics.stdDevSpeaks
                      ? Math.round(data.statistics.stdDevSpeaks * 100) / 100
                      : "--"
                    : undefined,
                  description: "Avg. σ Speaks",
                  tooltip:
                    "The average number of points a speaking result is from the average.",
                },
                {
                  value: data?.statistics.lastActive,
                  description: "Last Active",
                  tooltip: "Time since last recorded tournament.",
                },
                {
                  value: data ? data.statistics.inTop20Pct + "x" : undefined,
                  description: "Top 20% Seed",
                  tooltip:
                    "# of times being in at least the 80th pctl. of the prelim pool.",
                },
                {
                  value: data?.statistics.avgOpWpM,
                  isPercentage: true,
                  round: 1,
                  description: "Avg. OpWpM",
                  tooltip:
                    "The average prelim win percentage of all opponents faced. This indicates the strength of the teams faced.",
                },
                {
                  value: data?.statistics.pWp,
                  isPercentage: true,
                  round: 1,
                  description: "Prelim Win Pct.",
                  tooltip: "Percent of all prelim rounds won.",
                },
                {
                  value: data ? data.statistics.breakPct || "--" : undefined,
                  isPercentage: true,
                  round: 1,
                  description: "Break Pct.",
                  tooltip: "% of tourns. reaching elim rounds (when possible).",
                },
                {
                  value: data?.statistics.tWp,
                  isPercentage: true,
                  round: 1,
                  description: "True Win Pct.",
                  tooltip: (
                    <>
                      A weighted composite of the elim and prelim win
                      percentages. To learn more, click{" "}
                      <a href="/methodology">here</a>.
                    </>
                  ),
                },
              ]}
            />
          }
          subheading={data?.aliases[0]?.code}
        />
        <TeamSummary
          code={data?.aliases[0]?.code}
          rank={
            data?.ranking.targeted
              ? `is the ${rankingData[0]} team`
              : `places above ${rankingData[0]} of teams`
          }
          circuits={
            data
              ? (data.ranking.targeted && [
                  data.ranking.targeted.circuit.name,
                ]) ||
                (data.ranking.aggregated &&
                  data.ranking.aggregated.map((r) => r.circuit_name))
              : undefined
          }
          seasons={
            data
              ? (data.ranking.targeted && [data.ranking.targeted.seasonId]) ||
                (data.ranking.aggregated &&
                  _.uniq(data.ranking.aggregated.map((r) => r.season_id)))
              : undefined
          }
          event={data?.circuits[0].event}
          topics={data?.filter.topics}
          topicTags={data?.filter.topicTags}
          bids={data?.statistics.bids}
          numResults={data?.results.length}
          avgSpeaks={data?.statistics.avgSpeaks}
          tWp={data?.statistics.tWp}
        />
        <TournamentHistoryTable data={data?.results} />
        <TeamCharts
          results={
            data?.results.sort(
              (a, b) => a.tournament.start - b.tournament.start
            ) || []
          }
        />
        <TeamDifferentialTable data={data?.results || []} />
        <TeamInfoTable aliases={data?.aliases} schools={data?.schools} />
      </div>
    </>
  );
};

interface TeamParams extends ParsedUrlQuery {
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

  const { id, circuits, seasons, topics, topicTags } = ctx.query as TeamParams;

  await ssg.team.summary.prefetch({
    id,
    ...(circuits && { circuit: circuits.split(",").map(parseInt) }),
    ...(seasons && { season: seasons.split(",").map(parseInt) }),
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

export default Team;
