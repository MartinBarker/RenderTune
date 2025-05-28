// Table.js
import React, { useState, useEffect } from "react";
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
    
    setAudioFiles((prev) => {
      // Create a new array with the updated audio file
      const updatedAudioFiles = prev.map((audio) => {
        if (audio.id === rowId) {
          const updatedAudio = { ...audio, [field]: formattedValue };

          // If we're updating startTime and we have length info, calculate a new endTime
          if (field === 'startTime' && audio.length) {
            // Parse start time properly based on format
            const startTimeParts = isOverAnHour ? formattedValue.split(':').map(Number) : [0, ...formattedValue.split(':').map(Number)];
            const startHours = startTimeParts[0] || 0;
            const startMinutes = startTimeParts.length >= 2 ? startTimeParts[startTimeParts.length - 2] : 0;
            const startSeconds = startTimeParts.length >= 1 ? startTimeParts[startTimeParts.length - 1] : 0;
            
            // Parse length
            const lengthParts = audio.length.split(':').map(Number);
            const lengthHours = isOverAnHour && lengthParts.length === 3 ? lengthParts[0] : 0;
            const lengthMinutes = isOverAnHour && lengthParts.length === 3 ? lengthParts[1] : lengthParts[0];
            const lengthSeconds = isOverAnHour && lengthParts.length === 3 ? lengthParts[2] : lengthParts[1];
            
            // Calculate total seconds
            const startTotalSeconds = (startHours * 3600) + (startMinutes * 60) + startSeconds;
            const lengthTotalSeconds = (lengthHours * 3600) + (lengthMinutes * 60) + lengthSeconds;
            const endTotalSeconds = startTotalSeconds + lengthTotalSeconds;
            
            // Format end time
            const endHours = Math.floor(endTotalSeconds / 3600);
            const endMinutes = Math.floor((endTotalSeconds % 3600) / 60);
            const endSeconds = Math.floor(endTotalSeconds % 60);
            
            updatedAudio.endTime = isOverAnHour
              ? `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`
              : `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
            
            // Ensure startTime is properly saved in the format we expect
            updatedAudio.startTime = formattedValue;
          }
          
          // If updating endTime, ensure the length is adjusted accordingly
          if (field === 'endTime' && audio.startTime) {
            // Similar calculation but in reverse to determine length
            const startTimeParts = isOverAnHour ? audio.startTime.split(':').map(Number) : [0, ...audio.startTime.split(':').map(Number)];
            const startHours = startTimeParts[0] || 0;
            const startMinutes = startTimeParts.length >= 2 ? startTimeParts[startTimeParts.length - 2] : 0;
            const startSeconds = startTimeParts.length >= 1 ? startTimeParts[startTimeParts.length - 1] : 0;
            
            const endTimeParts = isOverAnHour ? formattedValue.split(':').map(Number) : [0, ...formattedValue.split(':').map(Number)];
            const endHours = endTimeParts[0] || 0;
            const endMinutes = endTimeParts.length >= 2 ? endTimeParts[endTimeParts.length - 2] : 0;
            const endSeconds = endTimeParts.length >= 1 ? endTimeParts[endTimeParts.length - 1] : 0;
            
            const startTotalSeconds = (startHours * 3600) + (startMinutes * 60) + startSeconds;
            const endTotalSeconds = (endHours * 3600) + (endMinutes * 60) + endSeconds;
            const lengthTotalSeconds = endTotalSeconds - startTotalSeconds;
            
            if (lengthTotalSeconds > 0) {
              const lengthHours = Math.floor(lengthTotalSeconds / 3600);
              const lengthMinutes = Math.floor((lengthTotalSeconds % 3600) / 60);
              const lengthSeconds = Math.floor(lengthTotalSeconds % 60);
              
              updatedAudio.length = isOverAnHour
                ? `${lengthHours.toString().padStart(2, '0')}:${lengthMinutes.toString().padStart(2, '0')}:${lengthSeconds.toString().padStart(2, '0')}`
                : `${lengthMinutes.toString().padStart(2, '0')}:${lengthSeconds.toString().padStart(2, '0')}`;
            }
          }

          return updatedAudio;
        }
        return audio;
      });
      
      // Save to localStorage immediately to persist changes
      try {
        localStorage.setItem("audioFiles", JSON.stringify(updatedAudioFiles));
      } catch (error) {
        console.error('Error saving audioFiles to localStorage:', error);
      }
      
      return updatedAudioFiles;
    });
  };

  const calculateEndTime = (startTime, length, isOverAnHour) => {
    if (!length) return ''; // Return empty string if length is not defined

    const [startHours, startMinutes, startSeconds] = isOverAnHour ? startTime.split(':').map(Number) : [0, ...startTime.split(':').map(Number)];
    const [lengthHours, lengthMinutes, lengthSeconds] = isOverAnHour ? length.split(':').map(Number) : [0, ...length.split(':').map(Number)];
    const totalStartSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
    const totalLengthSeconds = lengthHours * 3600 + lengthMinutes * 60 + lengthSeconds;
    const totalEndSeconds = totalStartSeconds + totalLengthSeconds;

    if (isNaN(totalEndSeconds)) return ''; // Return empty string if calculation results in NaN

    const endHours = Math.floor(totalEndSeconds / 3600);
    const endMinutes = Math.floor((totalEndSeconds % 3600) / 60);
    const endSeconds = totalEndSeconds % 60;
    return isOverAnHour
      ? `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`
      : `${endMinutes.toString().padStart(2, '0')}:${endSeconds.toString().padStart(2, '0')}`;
  };

  const isOverAnHour = row.original.duration && row.original.duration >= 3600;

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
    if (isImageTable) {
      const savedPalette = localStorage.getItem(`color-palette-${row.original.filepath}`);
      if (savedPalette) {
        console.log(`[Table.js] Loaded color palette from localStorage for ${row.original.filepath}:`, JSON.parse(savedPalette));
        setColorPalette(JSON.parse(savedPalette));
      } else {
        console.log(`[Table.js] No palette in localStorage for ${row.original.filepath}, requesting from main process...`);
        window.api.send('get-color-palette', row.original.filepath);
        const responseChannel = `color-palette-response-${row.original.filepath}`;
        window.api.receive(responseChannel, (colors) => {
          console.log(`[Table.js] Received color palette from main process for ${row.original.filepath}:`, colors);
          setColorPalette((prevPalette) => {
            const newPalette = {
              Vibrant: colors.Vibrant || prevPalette.Vibrant,
              DarkVibrant: colors.DarkVibrant || prevPalette.DarkVibrant,
              LightVibrant: colors.LightVibrant || prevPalette.LightVibrant,
              Muted: colors.Muted || prevPalette.Muted,
              DarkMuted: colors.DarkMuted || prevPalette.DarkMuted,
              LightMuted: colors.LightMuted || prevPalette.LightMuted
            };
            console.log(`[Table.js] Setting new color palette for ${row.original.filepath}:`, newPalette);
            localStorage.setItem(`color-palette-${row.original.filepath}`, JSON.stringify(newPalette));
            return newPalette;
          });
        });
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
      toggleRowExpanded(row.id); // Expand the row by default
    }
  }, [row.original.id, isImageTable]);

  const handleStretchImageToFitChange = (e) => {
    if (e.target.checked) {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, stretchImageToFit: true, useBlurBackground: false, paddingColor: null }
            : img
        )
      );
    } else {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, stretchImageToFit: false }
            : img
        )
      );
    }
  };

  const handlePaddingColorChange = (e) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === row.original.id
          ? { ...img, paddingColor: e.target.value }
          : img
      )
    );
  };

  const handlePaddingColorCheckboxChange = (e) => {
    if (e.target.checked) {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, paddingColor: "#FFFFFF", stretchImageToFit: false, useBlurBackground: false }
            : img
        )
      );
    } else {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, paddingColor: null }
            : img
        )
      );
    }
  };

  const handleBlurBackgroundChange = (e) => {
    if (e.target.checked) {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, useBlurBackground: true, stretchImageToFit: false, paddingColor: null }
            : img
        )
      );
    } else {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === row.original.id
            ? { ...img, useBlurBackground: false }
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

              {/* Render other cells */}
              {columnHeader !== "Expand" &&
                columnHeader !== "Drag" &&
                columnHeader !== "Remove" &&
                columnHeader !== "Duration" &&
                flexRender(cell.column.columnDef.cell, cell.getContext())}

              {/* Render Duration cell */}
              {columnHeader === "Duration" && (
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
                  checked={row.original.stretchImageToFit || false}
                  onChange={handleStretchImageToFitChange}
                />
                Stretch Image to Fit
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={row.original.paddingColor !== null}
                  onChange={handlePaddingColorCheckboxChange}
                />
                Padding Color:
                <input
                  id='paddingColorInput'
                  type="text"
                  value={row.original.paddingColor || "none"}
                  onChange={handlePaddingColorChange}
                  className={styles.paddingColorInput}
                  style={{
                    backgroundColor: row.original.paddingColor === "none" ? "#FFFFFF" : row.original.paddingColor
                  }}
                />
                {errors[row.original.id] && (
                  <span className={styles.errorText}>{errors[row.original.id]}</span>
                )}
              </label>
              <div>
                {Object.values(colorPalette).map((color, index) => (
                  <div
                    key={index}
                    className={`${styles.colorBox} ${selectedColor === color.hex ? styles.selectedColorBox : ''}`}
                    style={{ background: /^#([0-9A-Fa-f]{3}){1,2}$/.test(color.hex) ? color.hex : "#FFFFFF" }}
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
              <pre>{ffmpegCommand}</pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Table({ 
  data, 
  setData, 
  columns, 
  rowSelection, 
  setRowSelection, 
  isImageTable, 
  isRenderTable, 
  setImageFiles, 
  setAudioFiles, 
  ffmpegCommand, 
  removeRender, 
  globalFilter, 
  setGlobalFilter,
  onSelectedRowsChange
}) {
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState(() => {
    const savedExpandedRows = localStorage.getItem('expandedRows');
    return savedExpandedRows ? JSON.parse(savedExpandedRows) : {};
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [errors, setErrors] = useState({});
  const [sortStatus, setSortStatus] = useState({ column: null, direction: 'manual' });

  useEffect(() => {
    if (sortStatus.column) {
      console.log(`Column "${sortStatus.column}" is sorted ${sortStatus.direction}`);
    }
  }, [sortStatus]);

  useEffect(() => {
    const selectedFiles = data
      .filter((row) => rowSelection[row.id]) // Filter selected rows
      .sort((a, b) => data.findIndex((row) => row.id === a.id) - data.findIndex((row) => row.id === b.id)); // Ensure order matches table row order
    //console.log("Selected files:", selectedFiles);
  }, [rowSelection, data]); // Trigger whenever rowSelection or data changes

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
    setExpandedRows((prev) => {
      const newExpandedRows = {
        ...prev,
        [rowId]: !prev[rowId],
      };
      localStorage.setItem('expandedRows', JSON.stringify(newExpandedRows));
      return newExpandedRows;
    });
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
        updated.splice(index + 1, 0, newRow); // Insert the new row after the copied row
        localStorage.setItem("audioFiles", JSON.stringify(updated)); // Save to localStorage
        return updated;
      }
      return prev;
    });
  };

  const [originalOrder, setOriginalOrder] = useState(data.map(row => row.id));

  useEffect(() => {
    setOriginalOrder(data.map(row => row.id));
  }, [data]);

  const tableColumns = React.useMemo(() => {
    const baseColumns = [
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
      ...columns.map((column) => {
        // For File Name column, set sortingFn to 'alphanumeric'
        if (column.accessorKey === 'filename') {
          return {
            ...column,
            enableSorting: true,
            sortingFn: 'alphanumeric',
            header: function Header(ctx) {
              const col = ctx.column;
              return (
                <div
                  className={styles.sortableHeader}
                  onClick={col.getToggleSortingHandler()}
                  style={{ cursor: col.getCanSort() ? 'pointer' : 'default' }}
                >
                  {typeof column.header === 'function' ? column.header(ctx) : column.header}
                  <span className={styles.sortIcon}>
                    {col.getIsSorted() === 'asc' ? "🔼" :
                      col.getIsSorted() === 'desc' ? "🔽" : ""}
                  </span>
                </div>
              );
            }
          };
        }
        // For all other columns, keep as before
        return {
          ...column,
          header: column.id === 'openFolder' ? column.header : (ctx) => {
            const col = ctx.column;
            return (
              <div
                className={styles.sortableHeader}
                onClick={col.getToggleSortingHandler()}
                style={{ cursor: col.getCanSort() ? 'pointer' : 'default' }}
              >
                {typeof column.header === 'function' ? column.header(ctx) : column.header}
                <span className={styles.sortIcon}>
                  {col.getIsSorted() === 'asc' ? "🔼" :
                    col.getIsSorted() === 'desc' ? "🔽" : ""}
                </span>
              </div>
            );
          }
        };
      }),
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
        }
      );
    } else {
      baseColumns.push({
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
      });
    }

    return baseColumns;
  }, [columns, data, rowSelection, sorting, isRenderTable]);

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
      const value = row.getValue(columnId);
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  useEffect(() => {
    // pull the rows *after* sort/filter but *before* pagination
    const rows = table.getPrePaginationRowModel().rows;

    // keep only the selected ones, in exactly the order they're rendered
    const selectedFiles = rows
      .filter((r) => r.getIsSelected())
      .map((r) => r.original);

    //console.log("Selected files in display order:", selectedFiles);
    onSelectedRowsChange?.(selectedFiles);
  }, [
    rowSelection,
    table.getState().sorting, // re-run when sorting changes
    table.getState().globalFilter, // re-run when filter changes
  ]);

const handleDragEnd = (event) => {
  const { active, over } = event;
  if (!active || !over || active.id === over.id) return;

  // 1) pull the rows *after* sort/filter but *before* pagination
  const rows = table.getRowModel().rows;

  // 2) make a plain array of your original row objects
  const sortedData = rows.map(r => r.original);

  // 3) find indexes *in the sorted array*  
  const oldIndex = rows.findIndex(r => r.id === active.id);
  const newIndex = rows.findIndex(r => r.id === over.id);

  // 4) move them
  const newData = arrayMove(sortedData, oldIndex, newIndex);

  // 5) write it back
  setData(newData);
  localStorage.setItem("audioFiles", JSON.stringify(newData));

  // 6) clear the sort so you now render in this "manually‐sorted‐plus‐one‐override" mode
  setSorting([]);
};


  const parseDuration = (duration) => {
    if (typeof duration !== 'string') {
      return 0;
    }
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else {
      return 0;
    }
  };

  const totalSelectedDuration = React.useMemo(() => {
    if (!isImageTable && !isRenderTable) {
      const totalSeconds = Object.keys(rowSelection).reduce((total, rowId) => {
        const selectedRow = data.find((row) => row.id === rowId);
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

  const getSelectedRows = () => {
    // If table instance is not available yet, return empty array
    if (!tableInstanceRef.current) return [];
    
    // Get the current display order from the table instance
    // This accounts for any active sorting, filtering, and pagination
    const rowModel = tableInstanceRef.current.getRowModel();
    const currentDisplayedRows = rowModel.rows;
    
    // Filter for only the selected rows while maintaining their current display order
    const selectedRowsInDisplayOrder = currentDisplayedRows
      .filter(row => rowSelection[row.id])
      .map(row => row.original);
    
    return selectedRowsInDisplayOrder;
  };

  return (
    <div>
      <div className={styles.tableHeader}>
        <div className={styles.tableTitle}>
          {isImageTable ? "Image Files" : isRenderTable ? "Renders List" : "Audio Files"}
        </div>
        <div className={styles.controls}>
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
        </div>
      </div>
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
                  setErrors={setErrors}
                  errors={errors}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
        <div className={styles.paginationContainer}>
          <span className={styles.rowsSelected}>
            {Object.keys(rowSelection).length} of {data.length} rows selected
          </span>
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
                const value = e.target.value;
                table.setPageSize(value === 'all' ? data.length : Number(value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </DndContext>
      {/* 
      {!isImageTable && !isRenderTable && (
        <div className={styles.footer}>
          <span>Total selected duration: {totalSelectedDuration}</span>
        </div>
      )}
      */}
    </div>
  );
}

export default Table;