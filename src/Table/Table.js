// Table.js
import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react"; // Added useCallback
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

function formatDuration(duration) {
  if (!duration) return '00:00';
  const seconds = parseInt(duration, 10);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

function Row({
  row,
  rowIndex,
  toggleRowExpanded,
  isExpanded,
  removeRow,
  isImageTable,
  isRenderTable,
  setImageFiles,
  setAudioFiles,
  ffmpegCommand,
  setErrors,
  errors
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
      prev.map((audio) => {
        if (audio.id === rowId) {
          const updatedAudio = { ...audio, [field]: formattedValue };
          if (field === 'length') {
            updatedAudio.startTime = isOverAnHour ? '00:00:00' : '00:00';
          }
          return updatedAudio;
        }
        return audio;
      })
    );
  };

  const calculateEndTime = (startTime, length, isOverAnHour) => {
    if (!length) return ''; 
    const [startHours, startMinutes, startSeconds] = isOverAnHour ? startTime.split(':').map(Number) : [0, ...startTime.split(':').map(Number)];
    const [lengthHours, lengthMinutes, lengthSeconds] = isOverAnHour ? length.split(':').map(Number) : [0, ...length.split(':').map(Number)];
    const totalStartSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
    const totalLengthSeconds = lengthHours * 3600 + lengthMinutes * 60 + lengthSeconds;
    const totalEndSeconds = totalStartSeconds + totalLengthSeconds;

    if (isNaN(totalEndSeconds)) return ''; 

    const endHours = Math.floor(totalEndSeconds / 3600);
    const endMinutes = Math.floor((totalEndSeconds % 3600) / 60);
    const endSeconds = totalEndSeconds % 60;
    return isOverAnHour
      ? `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`
      : `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
  };

  const isOverAnHour = row.original.duration && parseFloat(row.original.duration) >= 3600;


  const [selectedColor, setSelectedColor] = useState(null);
  const [colorPalette, setColorPalette] = useState({
    Vibrant: { hex: '#FFFFFF' },
    DarkVibrant: { hex: '#FFFFFF' },
    LightVibrant: { hex: '#FFFFFF' },
    Muted: { hex: '#FFFFFF' },
    DarkMuted: { hex: '#FFFFFF' },
    LightMuted: { hex: '#FFFFFF' }
  });

  useEffect(() => {
    if (isImageTable && row.original.filepath) { // Added check for filepath
      const savedPalette = localStorage.getItem(`color-palette-${row.original.filepath}`);
      if (savedPalette) {
        try {
          setColorPalette(JSON.parse(savedPalette));
        } catch (e) {
          console.error("Failed to parse color palette from localStorage", e);
        }
      } else {
        window.api.send('get-color-palette', row.original.filepath);
        const responseChannel = `color-palette-response-${row.original.filepath}`;
        const listener = (colors) => {
          setColorPalette((prevPalette) => {
            const newPalette = {
              Vibrant: colors.Vibrant || prevPalette.Vibrant,
              DarkVibrant: colors.DarkVibrant || prevPalette.DarkVibrant,
              LightVibrant: colors.LightVibrant || prevPalette.LightVibrant,
              Muted: colors.Muted || prevPalette.Muted,
              DarkMuted: colors.DarkMuted || prevPalette.DarkMuted,
              LightMuted: colors.LightMuted || prevPalette.LightMuted
            };
            localStorage.setItem(`color-palette-${row.original.filepath}`, JSON.stringify(newPalette));
            return newPalette;
          });
        };
        window.api.receive(responseChannel, listener);
        return () => {
          window.api.removeAllListeners(responseChannel);
        };
      }
    }
  }, [row.original.filepath, isImageTable]);

  const handleColorBoxClick = (color) => {
    const isValidHex = /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
    const validColor = isValidHex ? color : "#FFFFFF";
    setSelectedColor(validColor);
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === row.original.id
          ? { ...img, paddingColor: validColor, stretchImageToFit: false, useBlurBackground: false }
          : img
      )
    );
  };

  const validateHexColor = (color) => {
    const hexPattern = /^#([0-9A-Fa-f]{3}){1,2}$/;
    return hexPattern.test(color);
  };

  useEffect(() => {
    if (isImageTable) {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, useBlurBackground: true, stretchImageToFit: false, paddingColor: null }
            : img
        )
      );
      if (!isExpanded) { // Only toggle if not already expanded
          toggleRowExpanded(row.id); 
      }
    }
  }, [row.original.id, isImageTable]); //setImageFiles and toggleRowExpanded are stable (or should be)

  const handleStretchImageToFitChange = (e) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === row.original.id
          ? { ...img, stretchImageToFit: e.target.checked, useBlurBackground: !e.target.checked ? img.useBlurBackground : false, paddingColor: !e.target.checked ? img.paddingColor : null }
          : img
      )
    );
  };

  const handlePaddingColorChange = (e) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === row.original.id
          ? { ...img, paddingColor: e.target.value, stretchImageToFit: false, useBlurBackground: false }
          : img
      )
    );
  };
  
  const handlePaddingColorCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === row.original.id
          ? { ...img, paddingColor: isChecked ? (img.paddingColor && validateHexColor(img.paddingColor) ? img.paddingColor : "#FFFFFF") : null, stretchImageToFit: false, useBlurBackground: false }
          : img
      )
    );
  };

  const handleBlurBackgroundChange = (e) => {
    const isChecked = e.target.checked;
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === row.original.id
          ? { ...img, useBlurBackground: isChecked, stretchImageToFit: false, paddingColor: null }
          : img
      )
    );
  };


  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={styles.row}
        onClick={() => row.toggleSelected()} // Use table's built-in toggle
      >
        {row.getVisibleCells().map((cell) => {
          const columnDef = cell.column.columnDef;
          // Using accessorKey or id for header check
          const columnHeader = typeof columnDef.header === 'string' ? columnDef.header : (columnDef.accessorKey || columnDef.id);


          return (
            <td
              key={cell.id} // cell.id is unique
              className={styles.cell}
              data-tooltip={cell.getValue()}
            >
              {/* Render Drag handle */}
              {(columnHeader === "Drag" || columnDef.id === "drag") && (
                <DragHandle row={row} rowIndex={rowIndex} />
              )}

              {/* Render Expand Icon */}
              {(columnHeader === "Expand" || columnDef.id === "expand") && (
                <span
                  className={`${styles.expandIcon} ${
                    isExpanded ? styles.expanded : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row selection toggle
                    toggleRowExpanded(row.id);
                  }}
                  title="Expand/Collapse Row"
                >
                  {isExpanded ? "▽" : "▷"}
                </span>
              )}

              {/* Render Remove Button */}
              {(columnHeader === "Remove" || columnDef.id === "remove" ) && (
                <button
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row selection toggle
                    removeRow(row.original.id);
                  }}
                  title="Remove this file"
                >
                  ❌
                </button>
              )}
              
              {/* Render Copy Button - Specific to non-render tables */}
              {columnDef.id === "copy" && !isRenderTable && (
                 <button
                    className={styles.copyButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        // copyRow(row.original.id); // copyRow is defined in Table, not passed to Row
                        // This button should ideally be rendered by Table's columnDef directly
                        // For now, this specific button would need copyRow passed or handled by columnDef
                    }}
                    title="Copy this row"
                    >
                    📋
                </button>
              )}


              {/* Render other cells */}
              { columnDef.id !== "expand" &&
                columnDef.id !== "drag" &&
                columnDef.id !== "remove" &&
                columnDef.id !== "copy" && // Exclude copy as well if handled by id
                columnDef.accessorKey !== "duration" && // Handle duration separately
                flexRender(cell.column.columnDef.cell, cell.getContext())}

              {/* Render Duration cell */}
              {columnDef.accessorKey === "duration" && (
                <span>{formatDuration(cell.getValue())}</span>
              )}
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
                    const newEndTime = calculateEndTime(isOverAnHour ? '00:00:00' : '00:00', newLength, isOverAnHour);
                    setAudioFiles((prev) =>
                      prev.map((audio) =>
                        audio.id === row.original.id
                          ? { ...audio, length: newLength, endTime: newEndTime, startTime: isOverAnHour ? '00:00:00' : '00:00' }
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
                  checked={row.original.stretchImageToFit || false}
                  onChange={handleStretchImageToFitChange}
                />
                Stretch Image to Fit
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={row.original.paddingColor !== null && row.original.paddingColor !== undefined}
                  onChange={handlePaddingColorCheckboxChange}
                />
                Padding Color:
                <input
                  id='paddingColorInput'
                  type="text"
                  value={row.original.paddingColor || "#FFFFFF"} // Default to white if null/undefined
                  onChange={handlePaddingColorChange}
                  className={styles.paddingColorInput}
                  style={{
                    backgroundColor: validateHexColor(row.original.paddingColor) ? row.original.paddingColor : "#FFFFFF"
                  }}
                  disabled={!row.original.paddingColor && row.original.paddingColor !== null} // disable if paddingColor is not actively set
                />
                {errors && errors[row.original.id] && ( // Added check for errors object
                  <span className={styles.errorText}>{errors[row.original.id]}</span>
                )}
              </label>
              <div>
                {Object.entries(colorPalette).map(([name, color]) => ( // Use entries for key
                  color && color.hex && // Ensure color and hex exist
                  <div
                    key={name} // Use palette name for key
                    className={`${styles.colorBox} ${selectedColor === color.hex ? styles.selectedColorBox : ''}`}
                    style={{ background: validateHexColor(color.hex) ? color.hex : "#FFFFFF" }}
                    onClick={() => handleColorBoxClick(color.hex)}
                  />
                ))}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={row.original.useBlurBackground || false}
                  onChange={handleBlurBackgroundChange}
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
              <pre>{row.original.ffmpegCommand || ffmpegCommand}</pre> {/* Prefer row specific command */}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const Table = forwardRef(({ data, setData, columns, rowSelection, setRowSelection, isImageTable, isRenderTable, setImageFiles, setAudioFiles, ffmpegCommand, removeRender, globalFilter, setGlobalFilter }, ref) => {
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState(() => {
    const savedExpandedRows = localStorage.getItem('expandedRows');
    if (savedExpandedRows) {
      try {
        return JSON.parse(savedExpandedRows);
      } catch(e) {
        console.error("Failed to parse expandedRows from localStorage", e);
        return {};
      }
    }
    return {};
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [errors, setErrors] = useState({});

  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const toggleRowExpanded = useCallback((rowId) => {
    setExpandedRows((prev) => {
      const newExpandedRows = {
        ...prev,
        [rowId]: !prev[rowId],
      };
      localStorage.setItem('expandedRows', JSON.stringify(newExpandedRows));
      return newExpandedRows;
    });
  }, []);

  const removeRow = useCallback((rowId) => {
    if (isRenderTable) {
      if(removeRender) removeRender(rowId);
    } else {
      setData((prev) => {
        const updated = prev.filter((row) => row.id !== rowId);
        if (isImageTable) {
          if(setImageFiles) localStorage.setItem("imageFiles", JSON.stringify(updated));
        } else {
          if(setAudioFiles) localStorage.setItem("audioFiles", JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [isRenderTable, removeRender, setData, isImageTable, setImageFiles, setAudioFiles]);

  const copyRow = useCallback((rowId) => {
    setData((prev) => {
      const index = prev.findIndex((row) => row.id === rowId);
      if (index >= 0) {
        const newRow = { ...prev[index], id: generateUniqueId() };
        const updated = [...prev];
        updated.splice(index + 1, 0, newRow); 
        if (isImageTable) {
          localStorage.setItem("imageFiles", JSON.stringify(updated));
        } else {
          localStorage.setItem("audioFiles", JSON.stringify(updated));
        }
        return updated;
      }
      return prev;
    });
  }, [setData, isImageTable]);

  const tableColumns = React.useMemo(() => {
    const baseColumns = [
      {
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      },
      {
        id: "expand",
        header: "Expand", // This content won't be rendered due to cell: () => null
        cell: () => null, // Cell content is handled in Row component
      },
      {
        id: "drag",
        header: "Drag", // This content won't be rendered
        cell: () => null, // Cell content is handled in Row component
      },
      ...columns.map((column) => ({
        ...column,
        header: column.enableSorting === false || (column.id && ['openFolder', 'stop', 'openFile', 'deleteFile'].includes(column.id)) || (column.accessorKey && ['openFolder', 'stop', 'openFile', 'deleteFile'].includes(column.accessorKey)) 
        ? column.header 
        : ({ column: col }) => (
          <div
            className={styles.sortableHeader}
            onClick={col.getToggleSortingHandler()}
          >
            {typeof column.header === 'function' ? column.header() : column.header || ""}
            <span className={styles.sortIcon}>
              {col.getIsSorted() === 'desc' ? "🔽" : 
               col.getIsSorted() === 'asc' ? "🔼" : ""}
            </span>
          </div>
        ),
      })),
    ];

    if (!isRenderTable) {
      baseColumns.push(
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
          cell: () => null,
        }
      );
    }
    return baseColumns;
  }, [columns, isRenderTable, removeRow, copyRow]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, pagination, rowSelection, globalFilter },
    getRowId: (row) => row.id,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const value = String(row.getValue(columnId) || '').toLowerCase();
      return value.includes(String(filterValue).toLowerCase());
    },
    enableRowSelection: true,
    autoResetPageIndex: false,
    autoResetExpanded: false,
  });

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setData((currentData) => {
        // Get the current sorted order
        const sortedData = table.getSortedRowModel().rows.map((row) => row.original);

        // Find the indices of the dragged and dropped rows in the sorted data
        const oldIndex = sortedData.findIndex((item) => item.id === active.id);
        const newIndex = sortedData.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Apply the drag-and-drop change to the sorted data
          const newData = arrayMove([...sortedData], oldIndex, newIndex);

          // Save the new order as the manual row order
          if (isImageTable) {
            localStorage.setItem("imageFiles", JSON.stringify(newData));
          } else if (!isRenderTable) {
            localStorage.setItem("audioFiles", JSON.stringify(newData));
          }

          return newData;
        }

        return currentData; // Return the original data if indices are invalid
      });

      // Clear sorting to treat the new order as manual
      setSorting([]);
    }
  }, [setData, table, isImageTable, isRenderTable]);

  const clearTable = useCallback(() => {
    setData([]); 
    if (isRenderTable) {
      localStorage.setItem('renders', JSON.stringify([]));
    } else if (isImageTable) {
      if(setImageFiles) setImageFiles([]); 
      localStorage.removeItem('imageFiles');
    } else {
      if(setAudioFiles) setAudioFiles([]); 
      localStorage.removeItem('audioFiles');
    }
    setRowSelection({}); 
    setExpandedRows({}); 
    localStorage.removeItem('expandedRows');
  }, [setData, isRenderTable, isImageTable, setImageFiles, setAudioFiles, setRowSelection, setExpandedRows]);

  const parseDurationToSeconds = (duration) => {
    if (typeof duration !== 'string' || !duration.includes(':')) {
      const num = parseFloat(duration);
      return !isNaN(num) ? num : 0;
    }
    const parts = duration.split(':').map(Number);
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const totalSelectedDuration = React.useMemo(() => {
    if (!isImageTable && !isRenderTable) {
      let totalSeconds = 0;
      table.getSelectedRowModel().flatRows.forEach(row => {
        const durationStr = row.original.length || row.original.duration; 
        totalSeconds += parseDurationToSeconds(durationStr);
      });
      return formatDuration(totalSeconds);
    }
    return '00:00';
  }, [rowSelection, table, data, isImageTable, isRenderTable]);

  useImperativeHandle(ref, () => ({
    getOrderedSelectedRows: () => {
      const processedRows = table.getSortedRowModel().rows;
      return processedRows
        .filter(row => row.getIsSelected()) 
        .map(row => row.original);         
    }
  }), [table]); 

  return (
    <div>
      <input
        type="text"
        value={globalFilter ?? ''} 
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
                    <th key={header.id} className={styles.headerCell} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
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
                  key={row.id}
                  row={row}
                  rowIndex={rowIndex}
                  toggleRowExpanded={toggleRowExpanded}
                  isExpanded={!!expandedRows[row.id]}
                  removeRow={removeRow}
                  isImageTable={isImageTable}
                  isRenderTable={isRenderTable}
                  setImageFiles={setImageFiles}
                  setAudioFiles={setAudioFiles}
                  ffmpegCommand={isRenderTable && row.original.ffmpegCommand ? row.original.ffmpegCommand : ""}
                  setErrors={setErrors}
                  errors={errors}
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
            {table.getPageCount() > 0 ? table.getPageCount() : 1}
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
              max={table.getPageCount() > 0 ? table.getPageCount() : 1}
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page < 0 ? 0 : page);
              }}
              className={styles.pageInput}
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              const value = e.target.value;
              table.setPageSize(value === 'all' ? data.length : Number(value));
            }}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
            <option value="all">All ({data.length})</option>
          </select>
        </div>
      </DndContext>
      <div className={styles.footer}>
        <span>
          {table.getSelectedRowModel().flatRows.length} of {table.getCoreRowModel().rows.length} rows selected
        </span>
      </div>
      
      {!isImageTable && !isRenderTable && (
        <div className={styles.footer}>
          <span>Total selected duration: {totalSelectedDuration}</span>
        </div>
      )}
      
    </div>
  );
});

export default Table;