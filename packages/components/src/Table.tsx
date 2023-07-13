import {
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React, {
  Fragment,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useMemo,
} from "react";
import clsx from "clsx";
import { BiLinkExternal } from "react-icons/bi";
import { useWindowSize } from "./hooks";

type NestingLevel = 0 | 1 | 2 | 3;

const getPositionColumn = <T,>(
  pagination: PaginationState = { pageIndex: 0, pageSize: 0 }
) => ({
  id: "position",
  header: "Pos.",
  cell: ({ row }: { row: Row<T> }) =>
    pagination.pageIndex * pagination.pageSize + row.index + 1,
});

const getExpandingColumn = <T,>() =>
  ({
    id: "expander",
    header: "More",
    cell: ({ row }: { row: Row<T> }) =>
      row.getCanExpand() ? (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="w-full flex flex-row items-center justify-start"
        >
          <div className="p-1 bg-gray-50/30 dark:bg-transparent rounded-full">
            {row.getIsExpanded() ? (
              <FaChevronUp className="text-red-400" />
            ) : (
              <FaChevronDown className="text-red-400" />
            )}
          </div>
        </button>
      ) : (
        <>--</>
      ),
  } as ColumnDef<T>);

const getOnClickColumn = <T,>() =>
  ({
    id: "onClick",
    header: () => <p className="mx-auto text-center">Details</p>,
    cell: () => (
      <div className="mx-auto rounded-full w-6 h-6 flex justify-center items-center">
        <BiLinkExternal className="text-red-400" />
      </div>
    ),
  } as ColumnDef<T>);

const sizes = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  max: Infinity,
};

("border-gray-400 border-gray-400/90 border-gray-400/80 border-gray-400/70 border-gray-400/60 border-gray-400/50 border-gray-400/40 border-gray-400/30 border-gray-400/20 border-gray-400/10");

const NestingLevelBorderLookup: {
  [k in NestingLevel]: string;
} = {
  0: "dark:border-gray-200/20",
  1: "border-sky-200 dark:border-sky-700/50",
  2: "border-purple-200 dark:border-purple-400/30",
  3: "border-red-200 dark:border-red-400/30",
};

const getClassNames = (nestingLevel: NestingLevel) => ({
  wrapper: `rounded-md border ${NestingLevelBorderLookup[nestingLevel]}`,
  table: "table-auto sm:table-fixed md:table-auto mx-auto w-full text-sm",
  td: "py-3 px-2",
  header: {
    th: "py-3 px-2 text-left",
    tr: `dark:text-gray-300 text-gray-700 border-b ${NestingLevelBorderLookup[nestingLevel]}`,
  },
  tr: `dark:text-gray-300 text-gray-700 border-t ${NestingLevelBorderLookup[nestingLevel]}`,
});

interface TableProps<T> {
  data: T[] | undefined;
  columnConfig: {
    core: ColumnDef<T>[];
    sm?: ColumnDef<T>[];
    md?: ColumnDef<T>[];
    lg?: ColumnDef<T>[];
    xl?: ColumnDef<T>[];
  };
  paginationConfig?: {
    pagination: PaginationState;
    setPagination: Dispatch<SetStateAction<PaginationState>>;
    totalPages?: number;
  };
  nestingLevel?: NestingLevel;
  numLoadingRows?: number;
  sortable?: boolean;
  child?: (props: { row: T }) => JSX.Element;
  showPosition?: boolean;
  onRowClick?: (row: T) => void;
}

// TODO: Add page limit selection (10, 20, 50) after seeing how performance is impacted
// TODO: Add initial state to expand first row (only if pageIndex == 0 or undefined)
// TODO: Add footer aggregations?
const Table = <T,>({
  data,
  columnConfig,
  paginationConfig,
  child: ExpandedRow,
  nestingLevel = 0,
  sortable,
  numLoadingRows,
  onRowClick,
  showPosition,
}: TableProps<T>) => {
  const { width } = useWindowSize();
  const [columns, setColumns] = useState<ColumnDef<T>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortingConfig = sortable ? { sorting, setSorting } : undefined;

  useEffect(() => {
    let size = null;
    for (const [breakpoint, cutoff] of Object.entries(sizes)) {
      if ((width as number) <= cutoff) {
        size = breakpoint;
        break;
      }
    }
    let newColumns: ColumnDef<T>[] = [...columnConfig?.core];

    if (size && Object.keys(sizes).indexOf(size) > 0) {
      for (const [breakpoint, columns] of Object.entries(columnConfig)) {
        if (breakpoint === "core") continue;
        if (
          Object.keys(sizes).indexOf(breakpoint) <=
          Object.keys(sizes).indexOf(size)
        ) {
          newColumns = [...newColumns, ...columns];
        }
      }
    }

    if (showPosition)
      newColumns = [
        getPositionColumn(paginationConfig?.pagination),
        ...newColumns,
      ];
    if (ExpandedRow) newColumns = [...newColumns, getExpandingColumn()];
    if (onRowClick) newColumns = [getOnClickColumn(), ...newColumns];

    setColumns(newColumns);
  }, [
    width,
    columnConfig,
    showPosition,
    paginationConfig?.pagination,
    ExpandedRow,
    onRowClick,
  ]);

  const classNames = useMemo(() => getClassNames(nestingLevel), [nestingLevel]);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      ...(paginationConfig && { pagination: paginationConfig.pagination }),
      ...(sortingConfig && { sorting: sortingConfig.sorting }),
    },
    ...(paginationConfig && {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: paginationConfig.setPagination,
      manualPagination: true,
      pageCount: paginationConfig.totalPages || -1,
    }),
    ...(sortingConfig && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: sortingConfig.setSorting,
    }),
  });

  const currentPage = table.getState().pagination.pageIndex;
  const tableIsSortable = sortingConfig !== undefined;
  const tableIsPaginateable = paginationConfig !== undefined;

  useEffect(() => {
    table.resetExpanded(false);
  }, [table, currentPage]);

  return (
    <div>
      <div className={classNames.wrapper}>
        <table className={classNames.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className={classNames.header.tr}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={
                      tableIsSortable && header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={classNames.header.th}
                  >
                    <span className="flex items-center mr-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {tableIsSortable && header.column.getCanSort()
                        ? {
                            asc: <FaSortUp className="ml-1" />,
                            desc: <FaSortDown className="ml-1" />,
                          }[header.column.getIsSorted() as string] ?? (
                            <FaSort className="ml-1" />
                          )
                        : null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {data
              ? table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    {/* Actual table row */}
                    <tr
                      className={clsx(classNames.tr, {
                        "hover:bg-luka-200/10 dark:hover:bg-luka-200/50 cursor-pointer":
                          onRowClick,
                      })}
                      onClick={
                        onRowClick ? () => onRowClick(row.original) : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={classNames.td}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {/* Expanded data housed in additional row, if available */}
                    {row.getIsExpanded() && ExpandedRow && (
                      <tr>
                        <td
                          colSpan={row.getVisibleCells().length}
                          className="px-2 md:px-4 pt-4 pb-2 border-t border-gray-300 dark:border-gray-700 border-dashed"
                        >
                          <ExpandedRow row={row.original} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              : Array.apply(null, Array(numLoadingRows || 0)).map((_, idx) => (
                  <tr key={idx} className={clsx(classNames.tr, "h-[2rem]")}>
                    <td
                      colSpan={table.getHeaderGroups()[0].headers.length}
                      className="bg-gray-300/40 dark:bg-gray-700/40 animate-pulse py-6"
                    />
                  </tr>
                ))}
          </tbody>
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      {tableIsPaginateable && (
        <div className="flex flex-row justify-between mx-auto pl-1 mt-4 w-full">
          <div className="flex items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mr-1">
              Page {currentPage + 1} of
            </p>
            <button
              onClick={() => {
                table.setPageIndex(table.getPageCount());
              }}
              title="Go to end"
            >
              <p className="text-luka-200/70 dark:text-blue-500 text-sm">
                {table.getPageCount()}
              </p>
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-400">.</p>
            {paginationConfig.pagination.pageIndex !== 0 && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  &nbsp;Go to&nbsp;
                </p>
                <button
                  onClick={() => {
                    table.setPageIndex(0);
                  }}
                  title="Go to start"
                >
                  <p className="text-luka-200/70 dark:text-blue-500 text-sm">
                    start
                  </p>
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400">.</p>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={table.previousPage}
              disabled={currentPage == 0}
              title="Go back a page"
              className="disabled:opacity-50 disabled:pointer-events-none"
            >
              <p className="cursor-pointer text-sm hover:bg-luka-200/10 text-gray-600 dark:text-gray-400 border dark:border-gray-200/20 rounded-md px-2 py-1">
                Previous
              </p>
            </button>
            <button
              onClick={table.nextPage}
              disabled={currentPage + 1 == table.getPageCount()}
              title="Go forward a page"
              className="disabled:opacity-50 disabled:pointer-events-none"
            >
              <p className="cursor-pointer text-sm hover:bg-luka-200/10 text-gray-600 dark:text-gray-400 border dark:border-gray-200/20 rounded-md px-2 py-1">
                Next
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
