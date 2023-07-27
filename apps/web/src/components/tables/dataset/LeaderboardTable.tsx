import React, { useMemo, useState } from "react";
import { Card, Table } from "@shared/components";
import { Alias } from "@shared/database";
import { BsTrophy } from "react-icons/bs";
import { useRouter } from "next/router";
import { trpc } from "@src/utils/trpc";
import { Prisma } from "@shared/database";
import {
  ColumnDef,
  createColumnHelper,
  PaginationState,
} from "@tanstack/react-table";
import NsdBadge from "@src/components/nsd-badge";
import clsx from "clsx";

type LeaderboardRow = {
  team: {
    id: string;
    aliases: Alias[];
    metadata: Prisma.JsonValue | null;
  };
  otr: number;
  statistics: {
    pWp: number;
    tWp: number;
    avgRawSpeaks: number;
    avgOpWpM: number;
  };
};

interface LeaderboardTableProps {
  count: number;
  demo?: {
    season: number;
    circuit: number;
  };
}

const LeaderboardTable = ({ count, demo }: LeaderboardTableProps) => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { query, isReady, ...router } = useRouter();
  const { data } = trpc.dataset.leaderboard.useQuery(
    {
      season:
        demo?.season ??
        parseInt((query.seasons as unknown as string).split(",")[0]),
      circuit:
        demo?.circuit ??
        parseInt((query.circuits as unknown as string).split(",")[0]),
      limit: pagination.pageSize,
      page: pagination.pageIndex,
    },
    {
      enabled: isReady,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
    }
  );
  const column = createColumnHelper<LeaderboardRow>();

  return (
    <Card
      icon={<BsTrophy />}
      title="Teams"
      className={clsx({
        "max-w-[800px] mx-auto my-4 md:my-8": !demo,
        "w-[1000px] relative pointer-events-none": !!demo,
      })}
      {...(demo && {
        theme: "text-indigo-500 dark:text-indigo-400",
      })}
      collapsible={!demo}
    >
      <Table
        data={data as LeaderboardRow[] | undefined}
        numLoadingRows={10}
        columnConfig={{
          core: [
            column.accessor("otr", {
              header: "OTR",
              cell: (props) => props.getValue().toFixed(3),
            }),
            column.accessor("team.aliases", {
              header: "Team",
              cell: (props) => (
                <p className="flex items-center">
                  {props.getValue()[0].code}
                  {(props.row.original.team.metadata as any)?.nsdAlum && (
                    <NsdBadge size="small" muted />
                  )}
                </p>
              ),
            }),
          ] as ColumnDef<LeaderboardRow>[],
          sm: [
            column.accessor("statistics.pWp", {
              header: "Prelim Win %",
              cell: (props) => (props.cell.getValue() * 100).toFixed(1) + "%",
            }),
            column.accessor("statistics.tWp", {
              header: "True Win %",
              cell: (props) => (props.cell.getValue() * 100).toFixed(1) + "%",
            }),
          ] as ColumnDef<LeaderboardRow>[],
          lg: [
            column.accessor("statistics.avgOpWpM", {
              header: "Avg. OpWpM",
              cell: (props) => (props.cell.getValue() * 100).toFixed(1) + "%",
            }),
            column.accessor("statistics.avgRawSpeaks", {
              header: "Avg. Spks.",
              cell: (props) =>
                props.cell.getValue() != 0
                  ? props.cell.getValue().toFixed(1)
                  : "--",
            }),
          ] as ColumnDef<LeaderboardRow>[],
        }}
        paginationConfig={{
          pagination,
          setPagination,
          totalPages: Math.ceil(count / pagination.pageSize),
        }}
        onRowClick={(row) =>
          router.push({
            pathname: `/teams/${row.team.id}`,
            query,
          })
        }
        showPosition
      />
    </Card>
  );
};

export default LeaderboardTable;
