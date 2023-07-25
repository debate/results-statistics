import { Card, Input, Label, Table, Text } from "@shared/components";
import {
  Bid,
  Judge,
  JudgeRanking,
  JudgeTournamentResult,
  Team,
  TeamRanking,
  TeamTournamentResult,
  TournamentSpeakerResult,
} from "@shared/database";
import {
  ColumnDef,
  PaginationState,
  createColumnHelper,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useState } from "react";
import _ from "lodash";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { Formik } from "formik";
import * as Yup from "yup";

// interface ExpandedJudge extends Judge {
//   results: (JudgeTournamentResult & {
//     // speaking: TournamentSpeakerResult[] | null;
//     // bid: Bid | null
//   })[];
//   rank: (JudgeRanking & { circuitRank: number }) | null;
// }

interface ExpandedJudge {
  circuitRank: number;
  index: number;
  judge_id: number;
  name: string;
}

interface UnknownJudge {
  name: string;
}

interface StrikeTableProps {
  data: ExpandedJudge[];
}

const StrikeTable = ({ data }: StrikeTableProps) => {
  const knownJudgeColumn = createColumnHelper<ExpandedJudge>();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [highlightedRows, setHighlightedRows] = useState<number[]>([
    0, 1, 2, 3, 4,
  ]);

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
            numHighlighted = Math.ceil((values.percent / 100) * data?.length);
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
          number: 5,
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
        data={data.slice(
          pagination.pageIndex * pagination.pageSize,
          (pagination.pageIndex + 1) * pagination.pageSize
        )}
        columnConfig={{
          core: [
            knownJudgeColumn.accessor("name", {
              header: "Judge",
              cell: (props) => props.cell.getValue(),
            }),
            knownJudgeColumn.accessor("circuitRank", {
              header: "Rank",
              cell: (props) => "#" + props.cell.getValue() || "--",
            }),
            knownJudgeColumn.accessor("index", {
              header: "Index",
              cell: (props) => props.cell.getValue()?.toFixed(1) || "--",
            }),
          ] as ColumnDef<ExpandedJudge>[],
          // lg: [
          //   knownJudgeColumn.accessor("results", {
          //     header: "# Tourns.",
          //     cell: (props) => props.cell.getValue().length,
          //   }),
          //   knownJudgeColumn.accessor("results", {
          //     header: "Pro/Aff %",
          //     cell: (props) => {
          //       const results = props.cell.getValue();
          //       let pro = 0;
          //       let con = 0;
          //       results.forEach((result) => {
          //         pro += (result.numAff || 0) + (result.numPro || 0);
          //         con += (result.numNeg || 0) + (result.numCon || 0);
          //       });

          //       return Math.floor((pro / (pro + con)) * 1000) / 10 + "%";
          //     },
          //   }),
          //   knownJudgeColumn.accessor("results", {
          //     header: "Avg. Spks.",
          //     cell: (props) => {
          //       const results = props.cell.getValue();
          //       let speaks: number[] = [];
          //       results.forEach((result) => {
          //         result.avgRawPoints && speaks.push(result.avgRawPoints);
          //       });
          //       return speaks.length
          //         ? (
          //             speaks.reduce((a, b) => a + b, 0) / speaks.length
          //           ).toFixed(1)
          //         : "--";
          //     },
          //   }),
          // ] as ColumnDef<ExpandedJudge>[],
        }}
        highlightedRows={highlightedRows}
        paginationConfig={{
          pagination,
          setPagination,
          totalPages: Math.ceil(data.length / pagination.pageSize),
        }}
      />
    </Card>
  );
};

export default StrikeTable;
