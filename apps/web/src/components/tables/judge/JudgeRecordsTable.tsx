import React from "react";
import { Table, Text } from "@shared/components";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ExpandedJudgeTournamentResult } from "./JudgingHistoryTable";
import {
  JudgeRecord,
  Round,
  RoundSpeakerResult,
  Competitor,
  Team,
  Side,
} from "@shared/database";
import { trpc } from "@src/utils/trpc";
import JudgeRecordTable from "./JudgeRecordTable";
import JudgeSpeakingTable from "./JudgeSpeakingTable";
import JudgePanelTable from "./JudgePanelTable";
import Link from "next/link";

export type ExpandedJudgeRecord = JudgeRecord & {
  rounds: (Round & {
    speaking: (RoundSpeakerResult & {
      competitor: Competitor;
    })[];
    records: {
      judge: {
        name: string;
        id: string;
      };
      decision: Side;
      winner: {
        aliases: {
          code: string;
        }[];
        id: true;
      };
    }[];
    result: {
      team: Team & {
        aliases: {
          code: string;
        }[];
      };
    };
  })[];
};

export interface JudgeRecordsTableProps {
  data: ExpandedJudgeTournamentResult;
}

const JudgeRecordsTable = ({
  data: { id, ...result },
}: JudgeRecordsTableProps) => {
  const { data } = trpc.judge.records.useQuery(
    {
      id,
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
    }
  );
  const column = createColumnHelper<ExpandedJudgeRecord>();

  return (
    <Table
      data={data && (data as ExpandedJudgeRecord[])}
      numLoadingRows={5}
      columnConfig={{
        core: [
          column.display({
            header: "Round",
            cell: (props) => props.row.original.rounds[0].nameStd,
          }),
          column.accessor("decision", {
            header: "Dec.",
            cell: (props) => props.cell.getValue(),
          }),
        ] as ColumnDef<ExpandedJudgeRecord>[],
        lg: [
          column.accessor("wasSquirrel", {
            header: "Squirrel",
            cell: (props) =>
              props.cell.getValue() !== null
                ? props.cell.getValue()
                  ? "Yes"
                  : "No"
                : "--",
          }),
          column.accessor("avgSpeakerPoints", {
            header: "Avg. Speaks",
            cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
          }),
        ] as ColumnDef<ExpandedJudgeRecord>[],
      }}
      child={({ row: parent }) => (
        <div className="space-y-2">
          <JudgeRecordTable data={parent} />
          <JudgeSpeakingTable data={parent} />
          <JudgePanelTable data={parent} />
          {parent.rounds.length == 2 && (
            <div className="w-full flex justify-center p-3">
              <Text>
                Want more? See our{" "}
                <Link
                  target="_blank"
                  href={{
                    pathname: "/x-ray/head-to-head",
                    query: {
                      circuit: result.tournament.circuits[0].id,
                      event: result.tournament.event,
                      season: result.tournament.seasonId,
                      team1: parent.rounds[0].result.team.id,
                      team2: parent.rounds[1].result.team.id,
                      judges: parent.rounds[0].records
                        .map((r) => r.judge.id)
                        .join(","),
                    },
                  }}
                  className="text-blue-400 underline hover:opacity-80 active:opacity-100"
                >
                  round prediction
                </Link>
                .
              </Text>
            </div>
          )}
        </div>
      )}
      nestingLevel={1}
      sortable
    />
  );
};

export default JudgeRecordsTable;
