import { Card, Input, Label, Table, Text } from "@shared/components";
import {
  ColumnDef,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { Formik } from "formik";
import * as Yup from "yup";
import { trpc } from "@src/utils/trpc";
import { useRouter } from "next/router";

interface JudgeRanking {
  circuitRank: number;
  index: number;
  judgeId: string;
  name: string;
}

interface ExpandedJudgeRanking extends JudgeRanking {
  _avg: {
    numPrelimScrews: number | null;
    numSquirrels: number | null;
    stdDevPoints: number | null;
    avgRawPoints: number | null;
  };
  _sum: {
    numAff: number | null;
    numPro: number | null;
    numNeg: number | null;
    numCon: number | null;
  };
  _count: number;
}

interface StrikeTableProps {
  data: JudgeRanking[];
}

const StrikeTable = ({ data: baseStrikes }: StrikeTableProps) => {
  const column = createColumnHelper<ExpandedJudgeRanking>();
  const router = useRouter();
  const [data, setData] = useState<ExpandedJudgeRanking[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [highlightedRows, setHighlightedRows] = useState<number[]>([]);
  const { mutateAsync: getDetailedStrikes } =
    trpc.scraping.strikeDetails.useMutation();
  const updateData = useCallback(async () => {
    const detailedStrikes = await getDetailedStrikes({
      judges: baseStrikes
        .map((s) => s.judgeId)
        .slice(
          pagination.pageIndex * pagination.pageSize,
          (pagination.pageIndex + 1) * pagination.pageSize
        ),
    });
    setData(
      detailedStrikes?.map((s) => {
        const baseStrike = baseStrikes.find((_s) => _s.judgeId === s.judgeId)!;
        return { ...s, ...baseStrike };
      })
    );
  }, [pagination.pageIndex, pagination.pageSize]);
  useEffect(() => {
    updateData();
  }, [pagination.pageIndex]);

  const StrikeMenu = useCallback(
    () => (
      <Formik
        onSubmit={(values) => {
          if (!values.percent && !values.number) {
            setHighlightedRows([]);
            return;
          }

          let numHighlighted: number;
          if (values.percent) {
            numHighlighted = Math.ceil(
              (values.percent / 100) * (baseStrikes?.length || 1)
            );
          } else {
            numHighlighted = values.number || 1;
          }

          let indexes: number[] = [];
          for (let i = 0; i < numHighlighted; i++) {
            indexes.push(i);
          }
          setHighlightedRows(indexes);
        }}
        initialValues={{
          percent: null,
          number: null,
        }}
        validationSchema={Yup.object().shape({
          percent: Yup.number()
            .nullable()
            .min(1, "Minimum of 1%.")
            .max(99, "Maximum of 99%"),
          number: Yup.number()
            .nullable()
            .min(1, "Must strike at least 1 judge."),
        })}
      >
        {(props) => (
          <form
            onSubmit={props.handleSubmit}
            className="flex flex-row space-x-2 items-center w-fit"
          >
            <Text className="text-sm md:text-base">Strike</Text>
            <Input
              name="percent"
              value={props.values.percent}
              onChange={(e) => {
                props.handleChange(e);
                props.submitForm();
              }}
              className="w-16"
              placeholder="%"
              disabled={props.values.number !== 0 && !!props.values.number}
              type="number"
              min={1}
              max={99}
            />
            <Input
              name="number"
              value={props.values.number}
              onChange={(e) => {
                props.handleChange(e);
                props.handleSubmit();
              }}
              className="w-16"
              placeholder="#"
              disabled={!!props.values.percent}
              type="number"
              min={1}
              max={data?.length}
            />
          </form>
        )}
      </Formik>
    ),
    []
  );

  return (
    <Card
      icon={<IoMdCloseCircleOutline />}
      title="Strike Sheet"
      className="max-w-[800px] mx-auto my-4 md:my-8"
      actionBar={
        <div className="hidden md:block">
          <StrikeMenu />
        </div>
      }
    >
      <div className="md:hidden">
        <StrikeMenu />
      </div>
      <Table
        data={data}
        columnConfig={{
          core: [
            column.accessor("name", {
              header: "Judge",
              cell: (props) => props.cell.getValue(),
            }),
            column.accessor("circuitRank", {
              header: "Rank",
              cell: (props) => "#" + props.cell.getValue() || "--",
            }),
            column.accessor("index", {
              header: "Index",
              cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
            }),
          ] as ColumnDef<ExpandedJudgeRanking>[],
          md: [
            column.accessor("_count", {
              header: "Tourns.",
              cell: (props) => props.cell.getValue(),
            }),
            column.display({
              header: "Rounds",
              cell: (props) => {
                const { _sum } = props.row.original;
                return (
                  (_sum.numAff || 0) +
                  (_sum.numPro || 0) +
                  (_sum.numNeg || 0) +
                  (_sum.numCon || 0)
                );
              },
            }),
          ] as ColumnDef<ExpandedJudgeRanking>[],
          lg: [
            column.accessor("_avg.avgRawPoints", {
              header: "Avg. Pts.",
              cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
            }),
            column.accessor("_avg.numSquirrels", {
              header: "Avg. Squirrels.",
              cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
            }),
            column.accessor("_avg.numPrelimScrews", {
              header: "Avg. Screws",
              cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
            }),
            column.display({
              header: "% Pro/Aff",
              cell: (props) => {
                const { _sum } = props.row.original;
                return (
                  Math.round(
                    (((_sum.numAff || 0) + (_sum.numPro || 0)) /
                      ((_sum.numAff || 0) +
                        (_sum.numPro || 0) +
                        (_sum.numNeg || 0) +
                        (_sum.numCon || 0))) *
                      100
                  ) + "%"
                );
              },
            }),
            column.accessor("_avg.stdDevPoints", {
              header: "σ Pts.",
              cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
            }),
          ] as ColumnDef<ExpandedJudgeRanking>[],
        }}
        highlightedRows={highlightedRows}
        paginationConfig={{
          pagination,
          setPagination,
          totalPages: Math.ceil(
            (baseStrikes?.length || 1) / pagination.pageSize
          ),
        }}
        onRowClick={(judge) => router.push(`/judges/${judge.judgeId}`)}
      />
    </Card>
  );
};

export default StrikeTable;
