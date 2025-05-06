// Table.js
import React, { useState, useEffect, useMemo } from "react";
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
    if (ref.current) {
        ref.current.indeterminate = !!indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={`${styles.checkbox} ${className}`} // Ensure styles.checkbox is defined
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
  const secondsValue = parseInt(String(duration), 10);
  if (isNaN(secondsValue)) return '00:00';

  const hours = Math.floor(secondsValue / 3600);
  const minutes = Math.floor((secondsValue % 3600) / 60);
  const secs = secondsValue % 60;
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
  toggleRowSelected,
  removeRow,
  isImageTable,
  isRenderTable,
  setImageFiles,
  setAudioFiles,
  ffmpegCommand,
  setErrors,
  errors
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: row.id,
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
    if (setAudioFiles) { // Check if setAudioFiles is provided
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
    }
  };

  const calculateEndTime = (startTime, length, isOverAnHour) => {
    if (!length || !startTime) return '';

    const parseTimeToSeconds = (timeStr, isHourFormat) => {
        const parts = String(timeStr).split(':').map(Number);
        if (isHourFormat) {
            return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        }
        return (parts[0] || 0) * 60 + (parts[1] || 0);
    };

    const totalStartSeconds = parseTimeToSeconds(startTime, isOverAnHour);
    const totalLengthSeconds = parseTimeToSeconds(length, isOverAnHour);
    
    if (isNaN(totalStartSeconds) || isNaN(totalLengthSeconds)) return '';

    const totalEndSeconds = totalStartSeconds + totalLengthSeconds;

    const endHours = Math.floor(totalEndSeconds / 3600);
    const endMinutes = Math.floor((totalEndSeconds % 3600) / 60);
    const endSeconds = totalEndSeconds % 60;
    return isOverAnHour
      ? `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`
      : `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
  };

  const isOverAnHourRow = row.original.duration && parseInt(String(row.original.duration), 10) >= 3600;


  const [selectedColor, setSelectedColor] = useState(null);
  const [colorPalette, setColorPalette] = useState({
    Vibrant: { hex: '#FFFFFF' }, DarkVibrant: { hex: '#FFFFFF' }, LightVibrant: { hex: '#FFFFFF' },
    Muted: { hex: '#FFFFFF' }, DarkMuted: { hex: '#FFFFFF' }, LightMuted: { hex: '#FFFFFF' }
  });

  useEffect(() => {
    if (isImageTable && row.original.filepath && typeof window !== 'undefined' && window.api) {
      const savedPalette = localStorage.getItem(`color-palette-${row.original.filepath}`);
      if (savedPalette) {
        try {
            setColorPalette(JSON.parse(savedPalette));
        } catch (e) { console.error("Failed to parse color palette from localStorage", e); }
      } else {
        window.api.send('get-color-palette', row.original.filepath);
        const responseChannel = `color-palette-response-${row.original.filepath}`;
        const listener = (colors) => {
          setColorPalette((prevPalette) => {
            const newPalette = {
              Vibrant: colors.Vibrant || prevPalette.Vibrant, DarkVibrant: colors.DarkVibrant || prevPalette.DarkVibrant,
              LightVibrant: colors.LightVibrant || prevPalette.LightVibrant, Muted: colors.Muted || prevPalette.Muted,
              DarkMuted: colors.DarkMuted || prevPalette.DarkMuted, LightMuted: colors.LightMuted || prevPalette.LightMuted
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
    if (setImageFiles) {
        setImageFiles((prev) =>
        prev.map((img) =>
            img.id === row.original.id
            ? { ...img, paddingColor: validColor, stretchImageToFit: false, useBlurBackground: false }
            : img
        )
        );
    }
  };

  const validateHexColor = (color) => {
    const hexPattern = /^#([0-9A-Fa-f]{3}){1,2}$/;
    return hexPattern.test(color);
  };
  
  useEffect(() => {
    if (isImageTable && row.original.id && setImageFiles && toggleRowExpanded) {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, useBlurBackground: true, stretchImageToFit: false, paddingColor: null }
            : img
        )
      );
      toggleRowExpanded(row.id);
    }
  }, [row.original.id, isImageTable, setImageFiles, toggleRowExpanded, row.id]);

  const handleStretchImageToFitChange = (e) => {
    if (setImageFiles) {
        setImageFiles((prev) =>
        prev.map((img) =>
            img.id === row.original.id
            ? { ...img, stretchImageToFit: e.target.checked, useBlurBackground: e.target.checked ? false : img.useBlurBackground, paddingColor: e.target.checked ? null : img.paddingColor }
            : img
        )
        );
    }
  };

  const handlePaddingColorChange = (e) => {
     if (setImageFiles) {
        setImageFiles((prev) =>
        prev.map((img) =>
            img.id === row.original.id
            ? { ...img, paddingColor: e.target.value }
            : img
        )
        );
    }
  };

  const handlePaddingColorCheckboxChange = (e) => {
    if (setImageFiles) {
        setImageFiles((prev) =>
        prev.map((img) =>
            img.id === row.original.id
            ? { ...img, paddingColor: e.target.checked ? (row.original.paddingColor || "#FFFFFF") : null, stretchImageToFit: false, useBlurBackground: e.target.checked ? false : img.useBlurBackground }
            : img
        )
        );
    }
  };

  const handleBlurBackgroundChange = (e) => {
    if (setImageFiles) {
        setImageFiles((prev) =>
        prev.map((img) =>
            img.id === row.original.id
            ? { ...img, useBlurBackground: e.target.checked, stretchImageToFit: e.target.checked ? false : img.stretchImageToFit, paddingColor: e.target.checked ? null : img.paddingColor }
            : img
        )
        );
    }
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={styles.row}
        {...attributes}
        onClick={(e) => toggleRowSelected && toggleRowSelected(row.id, rowIndex, e)}
      >
        {row.getVisibleCells().map((cell) => {
          const columnId = cell.column.id; 
          
          return (
            <td
              key={cell.id}
              className={styles.cell}
              title={typeof cell.getValue() === 'string' || typeof cell.getValue() === 'number' ? String(cell.getValue()) : undefined}
              onClick={(e) => {
                // For the 'select' column (checkbox), we want its own click handler to work
                // and not trigger the TR's onClick.
                // For other interactive cells (drag, expand, remove, copy), also stop propagation.
                if (columnId === 'select' || columnId === 'drag' || columnId === 'expand' || columnId === 'remove' || columnId === 'copy') {
                    e.stopPropagation();
                }
              }}
              {...(columnId === "drag" ? listeners : {})}
            >
              {/* Render Drag handle */}
              {columnId === "drag" && (
                <DragHandle row={row} rowIndex={rowIndex} />
              )}

              {/* Render Expand Icon */}
              {columnId === "expand" && (
                <span
                  className={`${styles.expandIcon} ${
                    isExpanded ? styles.expanded : ""
                  }`}
                  onClick={(e) => { // This click is now specific to the span
                    // e.stopPropagation(); // Already stopped by td if configured above
                    if (toggleRowExpanded) toggleRowExpanded(row.id);
                  }}
                  title="Expand/Collapse Row"
                >
                  {isExpanded ? "▽" : "▷"}
                </span>
              )}

              {/* Render Remove Button */}
              {columnId === "remove" && (
                <button
                  className={styles.removeButton}
                  onClick={(e) => { // This click is now specific to the button
                    // e.stopPropagation(); // Already stopped by td
                    if (removeRow) removeRow(row.original.id);
                  }}
                  title="Remove this file"
                >
                  ❌
                </button>
              )}
              
              {/* Render Copy Button - Content for this cell is defined in tableColumns */}
              {/* The flexRender below will handle rendering the button from tableColumns */}


              {/* ** THIS IS THE CRITICAL LINE FOR RENDERING CELL CONTENT INCLUDING THE CHECKBOX ** */}
              {/* It should render for ALL columns, including 'select', 'copy', etc. */}
              {/* The conditional exclusion was incorrect. */}
              {flexRender(cell.column.columnDef.cell, cell.getContext())}


              {/* Specific handling for duration formatting if not done by cell renderer */}
              {/* This might be redundant if your 'duration' column's cell renderer already formats it. */}
              {/* If 'duration' column's cell in tableColumns is just `info => info.getValue()`, then this is needed. */}
              {/* {columnId === "duration" && cell.column.id !== "select" && /* to avoid double render with flexRender */ }
              {/*  !cell.column.columnDef.cell && ( // Only if no custom cell renderer
                <span>{formatDuration(cell.getValue())}</span>
              )} */}

            </td>
          );
        })}
      </tr>
      {isExpanded && (
        <tr className={styles.expandedRow}>
            <td colSpan={row.getVisibleCells().length} className={styles.expandedCellNoPadding}> {/* Ensure expandedCellNoPadding is defined in CSS */}
                <div className={styles.expandedContent}>
                {isImageTable && (
                    <>
                    <div className={styles.thumbnailWrapper /* Big - if you have a different style */}>
                        <img src={row.original.filepath ? `thum:///${row.original.filepath}` : ''} alt="Expanded Thumbnail" className={styles.expandedThumbnail /* if different style */} />
                    </div>
                    <div className={styles.imageOptions}>
                        <label>
                            <input type="checkbox" checked={!!row.original.stretchImageToFit} onChange={handleStretchImageToFitChange} />
                            Stretch Image to Fit
                        </label>
                        <label>
                            <input type="checkbox" checked={!!row.original.useBlurBackground} onChange={handleBlurBackgroundChange} />
                            Use Blurred Background
                        </label>
                        <label>
                            <input type="checkbox" checked={row.original.paddingColor != null} onChange={handlePaddingColorCheckboxChange} />
                            Use Padding Color:
                            <input
                                type="text"
                                value={row.original.paddingColor || "#FFFFFF"}
                                onChange={handlePaddingColorChange}
                                onBlur={(e) => { if (!validateHexColor(e.target.value)) handlePaddingColorChange({target: { value: "#FFFFFF" }})}}
                                disabled={row.original.paddingColor == null}
                                className={styles.paddingColorInput}
                                style={{ backgroundColor: row.original.paddingColor || 'transparent' }}
                            />
                        </label>
                        <div className={styles.colorPalette}>
                            {Object.entries(colorPalette).map(([name, color]) => (
                            color && color.hex && (
                                <div
                                key={name}
                                className={`${styles.colorBox} ${selectedColor === color.hex ? styles.selectedColorBox : ''}`}
                                style={{ backgroundColor: color.hex }}
                                onClick={() => handleColorBoxClick(color.hex)}
                                title={`${name}: ${color.hex}`}
                                />
                            )
                            ))}
                        </div>
                    </div>
                    </>
                )}
                {!isImageTable && !isRenderTable && (
                    <>
                    <label>
                        Start Time:
                        <input
                        type="text"
                        value={row.original.startTime || (isOverAnHourRow ? '00:00:00' : '00:00')}
                        onChange={(e) => handleTimeInputChange(e, 'startTime', row.original.id, isOverAnHourRow)}
                        placeholder={isOverAnHourRow ? "HH:MM:SS" : "MM:SS"}
                        />
                    </label>
                    <label>
                        Length:
                        <input
                        type="text"
                        value={row.original.length || formatDuration(row.original.duration)}
                        onChange={(e) => handleTimeInputChange(e, 'length', row.original.id, isOverAnHourRow)}
                        placeholder={isOverAnHourRow ? "HH:MM:SS" : "MM:SS"}
                        />
                    </label>
                    <label>
                        End Time:
                        <input
                        type="text"
                        value={calculateEndTime(
                            row.original.startTime || (isOverAnHourRow ? '00:00:00' : '00:00'),
                            row.original.length || formatDuration(row.original.duration),
                            isOverAnHourRow
                        )}
                        readOnly
                        placeholder={isOverAnHourRow ? "HH:MM:SS" : "MM:SS"}
                        />
                    </label>
                    </>
                )}
                {isRenderTable && row.original.ffmpegCommand && (
                    <pre className={styles.ffmpegCommandPreview}>{row.original.ffmpegCommand}</pre>
                )}
                 {isRenderTable && !row.original.ffmpegCommand && (
                    <p>No FFmpeg command available for this render.</p>
                )}
                </div>
            </td>
        </tr>
      )}
    </>
  );
}

function Table({
  data = [],
  setData,
  columns = [],
  rowSelection = {},
  setRowSelection,
  isImageTable = false,
  isRenderTable = false,
  setImageFiles = () => {},
  setAudioFiles = () => {},
  ffmpegCommand,
  removeRender,
  globalFilter,
  setGlobalFilter,
  title,
  onSortedRows
}) {
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState(() => {
    if (typeof window !== 'undefined') {
        const savedExpandedRows = localStorage.getItem('expandedRows');
        try {
            return savedExpandedRows ? JSON.parse(savedExpandedRows) : {};
        } catch (e) { return {}; }
    }
    return {};
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [lastSelectedRowIndex, setLastSelectedRowIndex] = useState(null);

  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const toggleRowSelected = (rowId, rowIndex, event) => {
    setRowSelection((prev) => {
      const newSelection = { ...prev };
      const currentTableData = data || [];

      if (event.shiftKey && lastSelectedRowIndex !== null && currentTableData.length > 0) {
        const start = Math.min(lastSelectedRowIndex, rowIndex);
        const end = Math.max(lastSelectedRowIndex, rowIndex);
        for (let i = start; i <= end; i++) {
          if (currentTableData[i] && currentTableData[i].id) {
            newSelection[currentTableData[i].id] = true;
          }
        }
      } else if (event.ctrlKey || event.metaKey) {
        if (newSelection[rowId]) {
          delete newSelection[rowId];
        } else {
          newSelection[rowId] = true;
        }
      } else {
        // Plain click on TR (not checkbox) - make it toggle and preserve
        if (newSelection[rowId]) {
           delete newSelection[rowId];
        } else {
           newSelection[rowId] = true;
        }
      }
      return newSelection;
    });
    setLastSelectedRowIndex(rowIndex);
  };


  const toggleRowExpanded = (rowId) => {
    setExpandedRows((prev) => {
      const newExpandedRows = {
        ...prev,
        [rowId]: !prev[rowId],
      };
      if (typeof window !== 'undefined') {
          localStorage.setItem('expandedRows', JSON.stringify(newExpandedRows));
      }
      return newExpandedRows;
    });
  };

  const removeRow = (rowId) => {
    if (isRenderTable && removeRender) {
      removeRender(rowId);
    } else if (setData) {
      setData((prev) => {
        const updated = prev.filter((row) => row.id !== rowId);
        return updated;
      });
    }
  };

  const clearTable = () => {
    if (setData) setData([]);
    if (isImageTable && setImageFiles) setImageFiles([]);
    else if (!isRenderTable && setAudioFiles) setAudioFiles([]);
    if (setRowSelection) setRowSelection({});
  };

  const copyRow = (rowId) => {
    if (setData) {
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
    }
  };

  const tableColumns = React.useMemo(() => {
    const currentData = data || [];
    const baseColumns = [
      {
        id: "select",
        header: () => {
          const allSelected = currentData.length > 0 && Object.keys(rowSelection).length === currentData.length;
          const someSelected = Object.keys(rowSelection).length > 0 && !allSelected;
          return (
            <IndeterminateCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => {
                setRowSelection(prev => {
                  const allCurrentlySelected = currentData.length > 0 && Object.keys(prev).length === currentData.length;
                  if (allCurrentlySelected) {
                    return {};
                  } else {
                    return currentData.reduce((acc, currentRow) => {
                      if (currentRow && currentRow.id) {
                        acc[currentRow.id] = true;
                      }
                      return acc;
                    }, {});
                  }
                });
              }}
            />
          );
        },
        // THIS IS THE CELL RENDERER FOR THE ROW CHECKBOX
        cell: ({ row }) => (
          // The div with stopPropagation is important if the checkbox itself doesn't stop it.
          // Standard HTML checkboxes don't stop propagation on their own usually.
          <div onClick={(e) => e.stopPropagation()}> 
            <IndeterminateCheckbox
              checked={!!rowSelection[row.id]}
              onChange={() => {
                setRowSelection(prev => {
                  const newSelection = { ...prev };
                  if (newSelection[row.id]) {
                    delete newSelection[row.id];
                  } else {
                    newSelection[row.id] = true;
                  }
                  return newSelection;
                });
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
        header: column.id === 'openFolder' || column.enableSorting === false
            ? (typeof column.header === 'function' ? column.header : () => column.header)
            : ({ header }) => (
          <div
            className={styles.sortableHeader}
            onClick={() => {
              if (column.accessorKey) {
                const isSorted = sorting.find((sort) => sort.id === column.accessorKey);
                const direction = isSorted ? (isSorted.desc ? 'asc' : 'desc') : 'asc';
                setSorting([{ id: column.accessorKey, desc: direction === 'desc' }]);
              }
            }}
          >
            {typeof column.header === 'function' ? column.header(header.getContext()) : (column.header || "")}
            {column.accessorKey && (
                <span className={styles.sortIcon}>
                {sorting.find((sort) => sort.id === column.accessorKey)?.desc ? "🔽" : "🔼"}
                </span>
            )}
          </div>
        ),
      })),
    ];

    if (!isRenderTable) {
      if (!baseColumns.some(col => col.id === 'copy')) {
        baseColumns.push({
          id: "copy",
          header: "Copy",
          cell: ({ row }) => (
            <button
              className={styles.copyButton}
              onClick={(e) => {
                e.stopPropagation(); // Stop propagation for button click
                copyRow(row.original.id);
              }}
              title="Copy this row"
            >
              📋
            </button>
          ),
        });
      }
      if (!baseColumns.some(col => col.id === 'remove')) {
        baseColumns.push({
          id: "remove",
          header: "Remove",
          // Cell content for "remove" is rendered by the Row component
          // based on columnId === "remove".
          // So, the cell here can be null if Row handles it.
          // OR, if you want Table.js to define the button:
          cell: ({ row }) => (
             <button
                className={styles.removeButton}
                onClick={(e) => {
                    e.stopPropagation(); // Stop propagation for button click
                    removeRow(row.original.id);
                }}
                title="Remove this file"
            >
                ❌
            </button>
          ),
        });
      }
    } else {
      if (!baseColumns.some(col => col.id === 'remove') && !columns.some(c => c.id === 'remove')) {
         baseColumns.push({
            id: "remove",
            header: "Remove",
            cell: ({ row }) => (
                <button
                className={styles.removeButton}
                onClick={(e) => {
                    e.stopPropagation(); // Stop propagation for button click
                    removeRow(row.original.id);
                }}
                title="Remove this file"
                >
                ❌
                </button>
            ),
        });
      }
    }
    return baseColumns;
  }, [columns, data, rowSelection, sorting, isRenderTable, setRowSelection, removeRow, copyRow]);


  const table = useReactTable({
    data: data || [],
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
      const value = row.getValue(columnId);
      return String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
    },
  });

  React.useEffect(() => {
    if (table && table.getRowModel() && table.getRowModel().rows) {
        const order = table.getRowModel().rows.map((r) =>
        r.original.filename ?? r.original.outputFilename ?? r.original.id
        );
        // console.log(`${title} table order after selection change:`, order);
    }
  }, [rowSelection, table, title]);

  React.useEffect(() => {
    // Print the order of all rows
    const allOrder = table.getRowModel().rows.map((r) =>
      r.original.filename ?? r.original.outputFilename ?? r.original.id
    );
    console.log(`${title} table order:`, allOrder);

    // Print the order of selected rows
    const selectedOrder = table.getRowModel().rows
      .filter((r) => rowSelection[r.original.id])
      .map((r) => r.original.filename ?? r.original.outputFilename ?? r.original.id);
    console.log(`${title} selected row order:`, selectedOrder);
  }, [rowSelection, table.getRowModel().rows, title]);

  useEffect(() => {
    if (onSortedRows && table && table.getRowModel() && table.getRowModel().rows) {
      const sortedData = table.getRowModel().rows.map(row => row.original);
      onSortedRows(sortedData);
    }
  }, [sorting, data, table, onSortedRows]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    const currentData = data || [];

    if (active && over && active.id !== over.id) {
      const oldIndex = currentData.findIndex((item) => item.id === active.id);
      const newIndex = currentData.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = arrayMove([...currentData], oldIndex, newIndex);
        if (setData) setData(newData);
      }
    }
  };

  const parseDuration = (durationStr) => {
    if (typeof durationStr !== 'string') {
      return 0;
    }
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else {
      return 0;
    }
  };

  const totalSelectedDuration = React.useMemo(() => {
    const currentData = data || [];
    if (!isImageTable && !isRenderTable) {
      const totalSeconds = Object.keys(rowSelection).reduce((total, rowId) => {
        const selectedRow = currentData.find((row) => row.id === rowId);
        if (selectedRow) {
          const duration = selectedRow.length || selectedRow.duration || '0';
          return total + parseDuration(duration);
        }
        return total;
      }, 0);
      return formatDuration(totalSeconds);
    }
    return '00:00';
  }, [rowSelection, data, isImageTable, isRenderTable]);

  return (
    <div>
      <div className={styles.tableControls}>
        <h2 className={styles.tableTitle}>{title || "Table"}</h2>
        <div className={styles.controlsWrapper}>
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter && setGlobalFilter(e.target.value)}
            placeholder="Search..."
            className={styles.search}
          />
          <div className={styles.pagination}>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
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
                max={table.getPageCount() || 1}
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
                const value = e.target.value;
                const currentDataLength = (data || []).length;
                table.setPageSize(value === 'all' ? (currentDataLength > 0 ? currentDataLength : 10) : Number(value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
              <option value="all">Show All</option>
            </select>
          </div>
          {(data?.length ?? 0) > 0 && clearTable && (
            <button onClick={clearTable} className={`${styles.clearButton} ${styles.smallButton}`}>
                Clear Table
            </button>
          )}
        </div>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={(data || []).map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={styles.headerRow}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className={styles.headerCell} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, rowIndex) => (
                    <Row
                    key={row.id}
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
                    // ffmpegCommand={ffmpegCommand} // Only if used in Row's expanded content
                    // setErrors={setErrors} // Only if used in Row's expanded content
                    // errors={errors} // Only if used in Row's expanded content
                    />
                ))
              ) : (
                <tr>
                  <td colSpan={table.getAllFlatColumns().length} style={{ textAlign: 'center', padding: '20px' }}>
                    No data available. Please add files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
      <div className={styles.footer}>
        <span>
          {Object.keys(rowSelection).length} of {(data || []).length} rows selected
        </span>
         {!isImageTable && !isRenderTable && (data?.length ?? 0) > 0 && (
            <span>Total selected duration: {totalSelectedDuration}</span>
        )}
      </div>
    </div>
  );
}

export default Table;