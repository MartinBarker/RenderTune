// Table.js
import React, { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./Table.module.css";

// Indeterminate Checkbox Component
function IndeterminateCheckbox({ indeterminate, className = "", ...rest }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={`${styles.checkbox} ${className}`}
      {...rest}
    />
  );
}

function DragHandle({ row, rowIndex }) {
  const { attributes, listeners } = useSortable({ id: row.original.id });

  return (
    <div className={styles.dragHandleWrapper}>
      <button
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        title="Drag to reorder"
      >
        ☰
      </button>
      <span className={styles.rowNumber}>{rowIndex + 1}</span>
    </div>
  );
}

function Row({
  row,
  rowIndex,
  toggleRowExpanded,
  isExpanded,
  toggleRowSelected,
  removeRow,
  isImageTable,
  isRenderTable,
  setImageFiles,
  setAudioFiles,
  ffmpegCommand,
  deleteRender
}) {
  const { setNodeRef, transform, transition } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatTimeInput = (value, isOverAnHour) => {
    const cleanValue = value.replace(/[^0-9:]/g, '');
    if (isOverAnHour) {
      if (cleanValue.length > 4 && !cleanValue.includes(':')) {
        return `${cleanValue.slice(0, 2)}:${cleanValue.slice(2, 4)}:${cleanValue.slice(4, 6)}`;
      }
    } else {
      if (cleanValue.length > 2 && !cleanValue.includes(':')) {
        return `${cleanValue.slice(0, 2)}:${cleanValue.slice(2, 4)}`;
      }
    }
    return cleanValue;
  };

  const handleTimeInputChange = (e, field, rowId, isOverAnHour) => {
    const formattedValue = formatTimeInput(e.target.value, isOverAnHour);
    setAudioFiles((prev) =>
      prev.map((audio) =>
        audio.id === rowId
          ? { ...audio, [field]: formattedValue }
          : audio
      )
    );
  };

  const calculateEndTime = (startTime, length, isOverAnHour) => {
    const [startHours, startMinutes, startSeconds] = isOverAnHour ? startTime.split(':').map(Number) : [0, ...startTime.split(':').map(Number)];
    const [lengthHours, lengthMinutes, lengthSeconds] = isOverAnHour ? length.split(':').map(Number) : [0, ...length.split(':').map(Number)];
    const totalStartSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
    const totalLengthSeconds = lengthHours * 3600 + lengthMinutes * 60 + lengthSeconds;
    const totalEndSeconds = totalStartSeconds + totalLengthSeconds;
    const endHours = Math.floor(totalEndSeconds / 3600);
    const endMinutes = Math.floor((totalEndSeconds % 3600) / 60);
    const endSeconds = totalEndSeconds % 60;
    return isOverAnHour
      ? `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`
      : `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
  };

  const isOverAnHour = row.original.duration && row.original.duration >= 3600;

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={styles.row}
        onClick={() => toggleRowSelected(row.id)}
      >
        {row.getVisibleCells().map((cell) => {
          const columnHeader = cell.column.columnDef.header;

          return (
            <td
              key={`${cell.id}_${columnHeader}`}
              className={styles.cell}
              data-tooltip={cell.getValue()}
            >
              {/* Render Drag handle */}
              {columnHeader === "Drag" && (
                <DragHandle row={row} rowIndex={rowIndex} />
              )}

              {/* Render Expand Icon */}
              {columnHeader === "Expand" && (
                <span
                  className={`${styles.expandIcon} ${
                    isExpanded ? styles.expanded : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpanded(row.id);
                  }}
                  title="Expand/Collapse Row"
                >
                  {isExpanded ? "▽" : "▷"}
                </span>
              )}

              {/* Render Remove Button */}
              {columnHeader === "Remove" && (
                <button
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(row.id);
                  }}
                  title="Remove this file"
                >
                  ❌
                </button>
              )}

              {columnHeader === "Delete" && (
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this render?")) {
                      deleteRender(row.original.id);
                    }
                  }}
                  title="Delete this render"
                >
                  🗑️
                </button>
              )}

              {/* Render other cells */}
              {columnHeader !== "Expand" &&
                columnHeader !== "Drag" &&
                columnHeader !== "Remove" &&
                columnHeader !== "Delete" &&
                flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
      {isExpanded && !isImageTable && !isRenderTable && (
        <tr className={styles.expandedRow}>
          <td colSpan={row.getVisibleCells().length}>
            <div className={styles.expandedContent}>
              <label>
                Start Time:
                <input
                  type="text"
                  placeholder={isOverAnHour ? "00:00:00" : "00:00"}
                  value={row.original.startTime || ''}
                  onChange={(e) => handleTimeInputChange(e, 'startTime', row.original.id, isOverAnHour)}
                />
              </label>
              <label>
                Length:
                <input
                  type="text"
                  placeholder={isOverAnHour ? "00:00:00" : "00:00"}
                  value={row.original.length || ''}
                  onChange={(e) => {
                    const newLength = formatTimeInput(e.target.value, isOverAnHour);
                    const newEndTime = calculateEndTime(row.original.startTime || (isOverAnHour ? '00:00:00' : '00:00'), newLength, isOverAnHour);
                    setAudioFiles((prev) =>
                      prev.map((audio) =>
                        audio.id === row.original.id
                          ? { ...audio, length: newLength, endTime: newEndTime }
                          : audio
                      )
                    );
                  }}
                />
              </label>
              <label>
                End Time:
                <input
                  type="text"
                  placeholder={isOverAnHour ? "00:00:00" : "00:00"}
                  value={row.original.endTime || ''}
                  onChange={(e) => handleTimeInputChange(e, 'endTime', row.original.id, isOverAnHour)}
                />
              </label>
            </div>
          </td>
        </tr>
      )}
      {isExpanded && isImageTable && (
        <tr className={styles.expandedRow}>
          <td colSpan={row.getVisibleCells().length}>
            <div className={styles.expandedContent}>
              <label>
                <input
                  type="checkbox"
                  checked={row.original.stretchImageToFit !== undefined ? row.original.stretchImageToFit : true}
                  onChange={(e) =>
                    setImageFiles((prev) =>
                      prev.map((img) =>
                        img.id === row.original.id
                          ? { ...img, stretchImageToFit: e.target.checked }
                          : img
                      )
                    )
                  }
                />
                Stretch Image to Fit
              </label>
              <label>
                Padding Color:
                <input
                  type="text"
                  value={row.original.paddingColor || "#FFFFFF"}
                  onChange={(e) =>
                    setImageFiles((prev) =>
                      prev.map((img) =>
                        img.id === row.original.id
                          ? { ...img, paddingColor: e.target.value }
                          : img
                      )
                    )
                  }
                  disabled={row.original.stretchImageToFit !== undefined ? row.original.stretchImageToFit : true} // Disable when stretchImageToFit is checked
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={row.original.useBlurBackground !== undefined ? row.original.useBlurBackground : false}
                  onChange={(e) =>
                    setImageFiles((prev) =>
                      prev.map((img) =>
                        img.id === row.original.id
                          ? { ...img, useBlurBackground: e.target.checked }
                          : img
                      )
                    )
                  }
                />
                Use Blur Background Image
              </label>
            </div>
          </td>
        </tr>
      )}
      {isExpanded && isRenderTable && (
        <tr className={styles.expandedRow}>
          <td colSpan={row.getVisibleCells().length}>
            <div className={styles.expandedContent}>
              <pre>
                Start: {row.original.startDateTime} | End: {row.original.endDateTime} | Duration: {row.original.duration} | Status: {row.original.status} | Command: {row.original.ffmpegCommand}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Table({ data, setData, columns, rowSelection, setRowSelection, isImageTable, isRenderTable, setImageFiles, setAudioFiles, ffmpegCommand, removeRender, stopRender, pauseRender, resumeRender, deleteRender }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const toggleRowSelected = (rowId) => {
    setRowSelection((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const toggleRowExpanded = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const toggleAllRowsSelected = () => {
    const allRowsSelected = data.length === Object.keys(rowSelection).length;
    setRowSelection(
      allRowsSelected
        ? {}
        : data.reduce((acc, row) => ({ ...acc, [row.id]: true }), {})
    );
  };

  const removeRow = (rowId) => {
    if (isRenderTable) {
      removeRender(rowId);
    } else {
      setData((prev) => {
        const updated = prev.filter((row) => row.id !== rowId);
        localStorage.setItem("audioFiles", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearTable = () => {
    if (isRenderTable) {
      setData([]);
    } else {
      setData([]);
      if (isImageTable) {
        setImageFiles([]);
      } else {
        setAudioFiles([]);
      }
    }
  };

  const copyRow = (rowId) => {
    setData((prev) => {
      const index = prev.findIndex((row) => row.id === rowId);
      if (index >= 0) {
        const newRow = { ...prev[index], id: generateUniqueId() };
        const updated = [...prev];
        updated.splice(index + 1, 0, newRow);
        return updated;
      }
      return prev;
    });
  };

  const tableColumns = React.useMemo(() => [
    {
      id: "select",
      header: () => {
        const allRowsSelected = data.length === Object.keys(rowSelection).length;
        return (
          <IndeterminateCheckbox
            checked={allRowsSelected}
            indeterminate={Object.keys(rowSelection).length > 0 && !allRowsSelected}
            onChange={toggleAllRowsSelected}
          />
        );
      },
      cell: ({ row }) => (
        <div className="px-1">
          <IndeterminateCheckbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler(),
            }}
          />
        </div>
      ),
    },
    {
      id: "expand",
      header: "Expand",
      cell: () => null,
    },
    {
      id: "drag",
      header: "Drag",
      cell: () => null,
    },
    ...columns.map((column) => ({
      ...column,
      header: column.id === 'openFolder' ? column.header : () => (
        <div
          className={styles.sortableHeader}
          onClick={() => {
            const isSorted = sorting.find((sort) => sort.id === column.accessorKey);
            const direction = isSorted ? (isSorted.desc ? 'asc' : 'desc') : 'asc';
            setSorting([{ id: column.accessorKey, desc: direction === 'desc' }]);
          }}
        >
          {column.header || ""}
          <span className={styles.sortIcon}>
            {sorting.find((sort) => sort.id === column.accessorKey)?.desc ? "🔽" : "🔼"
            }
          </span>
        </div>
      ),
    })),
    {
      id: "copy",
      header: "Copy",
      cell: ({ row }) => (
        <button
          className={styles.copyButton}
          onClick={(e) => {
            e.stopPropagation();
            copyRow(row.original.id);
          }}
          title="Copy this row"
        >
          📋
        </button>
      ),
    },
    {
      id: "remove",
      header: "Remove",
      cell: ({ row }) => (
        <button
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            removeRow(row.original.id);
          }}
          title="Remove this file"
        >
          ❌
        </button>
      ),
    },
    {
      id: "stop",
      header: "Stop",
      cell: ({ row }) => (
        <button
          className={styles.stopButton}
          onClick={(e) => {
            e.stopPropagation();
            stopRender(row.original.id);
          }}
          title="Stop this render"
        >
          🛑
        </button>
      ),
    },
    {
      id: "pause",
      header: "Pause",
      cell: ({ row }) => (
        <button
          className={styles.pauseButton}
          onClick={(e) => {
            e.stopPropagation();
            pauseRender(row.original.id);
          }}
          title="Pause this render"
        >
          ⏸️
        </button>
      ),
    },
    {
      id: "resume",
      header: "Resume",
      cell: ({ row }) => (
        <button
          className={styles.resumeButton}
          onClick={(e) => {
            e.stopPropagation();
            resumeRender(row.original.id);
          }}
          title="Resume this render"
        >
          ▶️
        </button>
      ),
    },
    {
      id: "delete",
      header: "Delete",
      cell: ({ row }) => (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to delete this render?")) {
              deleteRender(row.original.id);
            }
          }}
          title="Delete this render"
        >
          🗑️
        </button>
      ),
    },
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, pagination, rowSelection },
    getRowId: (row) => row.id,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = arrayMove([...data], oldIndex, newIndex);
        setData(newData);
        localStorage.setItem("audioFiles", JSON.stringify(newData));
      }
    }
  };

  const totalSelectedDuration = React.useMemo(() => {
    if (!isImageTable && !isRenderTable) {
      return Object.keys(rowSelection).reduce((total, rowId) => {
        const selectedRow = data.find((row) => row.id === rowId);
        if (selectedRow) {
          const duration = selectedRow.duration || '0';
          return total + parseFloat(duration);
        }
        return total;
      }, 0);
    }
    return 0;
  }, [rowSelection, data, isImageTable, isRenderTable]);

  return (
    <div>
      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search..."
        className={styles.search}
      />
      <button onClick={clearTable} className={styles.clearButton}>
        Clear Table
      </button>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={data.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={styles.headerRow}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className={styles.headerCell}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <Row
                  key={row.original.id}
                  row={row}
                  rowIndex={rowIndex}
                  toggleRowSelected={toggleRowSelected}
                  toggleRowExpanded={toggleRowExpanded}
                  isExpanded={!!expandedRows[row.id]}
                  removeRow={removeRow}
                  isImageTable={isImageTable}
                  isRenderTable={isRenderTable}
                  setImageFiles={setImageFiles}
                  setAudioFiles={setAudioFiles}
                  ffmpegCommand={ffmpegCommand}
                  deleteRender={deleteRender}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
        <div className={styles.pagination}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
          <span>
            | Go to page: 
            <input
              type="number"
              min="1"
              max={table.getPageCount()}
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className={styles.pageInput}
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </DndContext>
      <div className={styles.footer}>
        <span>
          {Object.keys(rowSelection).length} of {data.length} rows selected
        </span>
      </div>
      {!isImageTable && !isRenderTable && (
        <div className={styles.footer}>
          <span>Total selected duration: {totalSelectedDuration.toFixed(2)} seconds</span>
        </div>
      )}
    </div>
  );
}

export default Table;
