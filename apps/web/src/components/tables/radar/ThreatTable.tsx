import { Card, Table } from "@shared/components";
import {
  ColumnDef,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useState } from "react";
import { FaCrosshairs } from "react-icons/fa";
import _ from "lodash";
import SeasonSelect, {
  SeasonSelectProps,
} from "@src/components/features/SeasonSelect";
import { trpc } from "@src/utils/trpc";
import { useRouter } from "next/router";

interface TeamRanking {
  circuitRank: number;
  otr: number;
  teamId: string;
  code: string;
}

interface ExpandedTeamRanking extends TeamRanking {
  _sum: {
    prelimWins: number | null;
    prelimLosses: number | null;
    elimWins: number | null;
    elimLosses: number | null;
  };
  _avg: {
    opWpM: number | null;
    otrComp: number | null;
  };
  _count: number;
}

interface ThreatTableProps extends SeasonSelectProps {
  data: TeamRanking[];
}

const ThreatTable = ({ data: baseThreats, ...props }: ThreatTableProps) => {
  const column = createColumnHelper<ExpandedTeamRanking>();
  const router = useRouter();
  const [data, setData] = useState<ExpandedTeamRanking[]>([]);
  const { mutateAsync: getDetailedThreats } =
    trpc.scraping.threatDetails.useMutation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const updateData = useCallback(async () => {
    const detailedThreats = await getDetailedThreats({
      teams: baseThreats
        .map((t) => t.teamId)
        .slice(
          pagination.pageIndex * pagination.pageSize,
          (pagination.pageIndex + 1) * pagination.pageSize
        ),
    });
    setData(
      detailedThreats?.map((t) => {
        const baseThreat = baseThreats.find((_t) => _t.teamId === t.teamId)!;
        return { ...t, ...baseThreat };
      })
    );
  }, [pagination.pageIndex, pagination.pageSize]);
  useEffect(() => {
    updateData();
  }, [pagination.pageIndex]);

  return (
    <Card
      icon={<FaCrosshairs />}
      title="Threat Sheet"
      className="max-w-[800px] mx-auto my-4 md:my-8 relative"
    >
      <SeasonSelect {...props} />
      <Table
        data={data}
        columnConfig={{
          core: [
            column.accessor("code", {
              header: "Team",
              cell: (props) => props.cell.getValue(),
            }),
            column.accessor("circuitRank", {
              header: "Rank",
              cell: (props) => "#" + props.cell.getValue(),
            }),
            column.accessor("otr", {
              header: "OTR",
              cell: (props) => props.cell.getValue().toFixed(1),
            }),
          ] as ColumnDef<ExpandedTeamRanking>[],
          md: [
            column.accessor("_count", {
              header: "Tourns.",
              cell: (props) => props.cell.getValue(),
            }),
            column.accessor("_sum", {
              header: "Rounds",
              cell: (props) => {
                const { prelimWins, elimWins, prelimLosses, elimLosses } =
                  props.cell.getValue();
                return (
                  (prelimWins || 0) +
                  (elimWins || 0) +
                  (prelimLosses || 0) +
                  (elimLosses || 0)
                );
              },
            }),
          ] as ColumnDef<ExpandedTeamRanking>[],
          lg: [
            column.accessor("_sum", {
              header: "Prelim. Win %",
              cell: (props) => {
                const { prelimWins, prelimLosses } = props.cell.getValue();
                if (!prelimWins && !prelimLosses) return "--";
                return (
                  Math.floor(
                    ((prelimWins || 0) /
                      ((prelimWins || 0) + (prelimLosses || 0))) *
                      1000
                  ) /
                    10 +
                  "%"
                );
              },
            }),
            column.accessor("_sum", {
              header: "Elim. Win %",
              cell: (props) => {
                const { elimWins, elimLosses } = props.cell.getValue();
                if (!elimWins && !elimLosses) return "--";
                return (
                  Math.floor(
                    ((elimWins || 0) / ((elimWins || 0) + (elimLosses || 0))) *
                      1000
                  ) /
                    10 +
                  "%"
                );
              },
            }),
            column.accessor("_sum", {
              header: "True Win %",
              cell: (props) => {
                const { prelimWins, elimWins, prelimLosses, elimLosses } =
                  props.cell.getValue();
                const numPrelims = (prelimWins || 0) + (prelimLosses || 0);
                const numElims = (elimWins || 0) + (elimLosses || 0);
                return (
                  Math.round(
                    (((prelimWins || 0) + (elimWins || 0)) /
                      (numPrelims + numElims) +
                      0.1 * ((elimWins || 0) / (numElims || 1))) *
                      1000
                  ) /
                    10 +
                  "%"
                );
              },
            }),
            column.accessor("_avg.opWpM", {
              header: "Avg. OpWpM",
              cell: (props) =>
                Math.round(props.cell.getValue()! * 1000) / 10 + "%",
            }),
            column.accessor("_avg.otrComp", {
              header: "Avg. OTR Comp",
              cell: (props) => props.cell.getValue()?.toFixed(1),
            }),
          ] as ColumnDef<ExpandedTeamRanking>[],
        }}
        paginationConfig={{
          pagination,
          setPagination,
          totalPages: Math.ceil(baseThreats.length / pagination.pageSize),
        }}
        onRowClick={(team) => router.push(`/teams/${team.teamId}`)}
      />
    </Card>
  );
};

export default ThreatTable;
