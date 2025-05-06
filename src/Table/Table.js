// Table.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  return (<input type="checkbox" ref={ref} className={`${styles.checkbox} ${className}`} {...rest} onClick={e => e.stopPropagation()} />);
}

// DragHandle now correctly uses useSortable for the handle itself.
// It needs the item ID to associate its listeners with the correct sortable item.
function DragHandle({ itemId, rowIndex }) {
  const { attributes, listeners, setActivatorNodeRef } = useSortable({ id: itemId });
  return (
    <div className={styles.dragHandleWrapper}>
      <button 
        ref={setActivatorNodeRef} // Important for accessibility and custom activator nodes
        {...attributes} 
        {...listeners} 
        className={styles.dragHandle} 
        title="Drag to reorder" 
        onClick={e => e.stopPropagation()} // Prevent row click when interacting with handle
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
  const h = Math.floor(secondsValue / 3600);
  const m = Math.floor((secondsValue % 3600) / 60);
  const s = secondsValue % 60;
  return h > 0 ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
               : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function parseDuration(durationStr) {
  if (typeof durationStr !== 'string') return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (!isNaN(Number(durationStr))) {
    return Number(durationStr);
  }
  return 0;
}

function Row({
  row,
  rowIndex,
  toggleRowExpanded,
  isExpanded,
  toggleRowSelected,
  // removeRow is passed but not used directly here, part of column def
  isImageTable,
  isRenderTable,
  setImageFiles, 
  setAudioFiles,
}) {
  // MODIFIED: useSortable for the Row item. 
  // attributes and listeners are NOT used here if DragHandle provides them.
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id: row.original.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1, // Visual cue for the item being dragged
  };

  const formatTimeInput = (value, isOverAnHour) => {
    const cleanValue = value.replace(/[^0-9:]/g, '');
    if (isOverAnHour) {
      if (cleanValue.length > 4 && !cleanValue.includes(':')) return `${cleanValue.slice(0, 2)}:${cleanValue.slice(2, 4)}:${cleanValue.slice(4, 6)}`;
    } else {
      if (cleanValue.length > 2 && !cleanValue.includes(':')) return `${cleanValue.slice(0, 2)}:${cleanValue.slice(2, 4)}`;
    }
    return cleanValue;
  };

  const handleTimeInputChange = (e, field, rowId, isOverAnHour) => {
    const formattedValue = formatTimeInput(e.target.value, isOverAnHour);
    if (setAudioFiles) {
        setAudioFiles(prev => prev.map(audio => audio.id === rowId ? { ...audio, [field]: formattedValue, ...(field === 'length' && { startTime: isOverAnHour ? '00:00:00' : '00:00' }) } : audio));
    }
  };

  const calculateEndTime = (startTime, length, isOverAnHour) => {
    if (!length || !startTime) return '';
    const parse = (ts, hf) => String(ts).split(':').map(Number).reduce((acc, t, i, arr) => hf ? acc + t * Math.pow(60, arr.length - 1 - i) : acc + t * Math.pow(60, arr.length - 1 - i), 0);
    const startS = parse(startTime, isOverAnHour);
    const lengthS = parse(length, isOverAnHour);
    if (isNaN(startS) || isNaN(lengthS)) return '';
    const endS = startS + lengthS;
    const h = Math.floor(endS / 3600);
    const m = Math.floor((endS % 3600) / 60);
    const s = endS % 60;
    return isOverAnHour ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                       : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isOverAnHourRow = row.original.duration && parseInt(String(row.original.duration), 10) >= 3600;
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorPalette, setColorPalette] = useState({ Vibrant: {}, DarkVibrant: {}, LightVibrant: {}, Muted: {}, DarkMuted: {}, LightMuted: {} });

  useEffect(() => {
    if (isImageTable && row.original.filepath && typeof window !== 'undefined' && window.api) {
      const saved = localStorage.getItem(`color-palette-${row.original.filepath}`);
      if (saved) try { setColorPalette(JSON.parse(saved)); } catch (e) { console.error(e); }
      else {
        window.api.send('get-color-palette', row.original.filepath);
        const channel = `color-palette-response-${row.original.filepath}`;
        const cb = (c) => {
            if (c) { // Ensure c is not null or undefined
                const newP = Object.fromEntries(Object.entries(colorPalette).map(([k, v]) => [k, c[k] || v]));
                setColorPalette(newP);
                localStorage.setItem(`color-palette-${row.original.filepath}`, JSON.stringify(newP));
            }
        };
        window.api.receive(channel, cb);
        return () => window.api.removeAllListeners(channel);
      }
    }
  }, [row.original.filepath, isImageTable]); 

  const handleColorBoxClick = (color) => {
    const validColor = /^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : "#FFFFFF";
    setSelectedColor(validColor);
    if(setImageFiles) setImageFiles(p => p.map(i => i.id === row.original.id ? { ...i, paddingColor: validColor, stretchImageToFit: false, useBlurBackground: false } : i));
  };
  const validateHexColor = (color) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);

  const handleImagePropChange = (prop, value) => {
    if(setImageFiles) {
        setImageFiles(prev => prev.map(img => {
            if (img.id === row.original.id) {
                const updatedImg = { ...img, [prop]: value };
                if (prop === 'stretchImageToFit' && value) {
                    updatedImg.useBlurBackground = false; updatedImg.paddingColor = null;
                } else if (prop === 'useBlurBackground' && value) {
                    updatedImg.stretchImageToFit = false; updatedImg.paddingColor = null;
                } else if (prop === 'paddingColor' && value !== null) {
                    updatedImg.stretchImageToFit = false; updatedImg.useBlurBackground = false;
                }
                return updatedImg;
            }
            return img;
        }));
    }
  };
  const handleStretchImageToFitChange = (e) => handleImagePropChange('stretchImageToFit', e.target.checked);
  const handleBlurBackgroundChange = (e) => handleImagePropChange('useBlurBackground', e.target.checked);
  const handlePaddingColorCheckboxChange = (e) => handleImagePropChange('paddingColor', e.target.checked ? (row.original.paddingColor || "#FFFFFF") : null);
  const handlePaddingColorTextChange = (e) => handleImagePropChange('paddingColor', e.target.value);

  return (
    <>
      {/* MODIFIED: <tr> has ref and style for dnd. No attributes/listeners here if handle is used. */}
      <tr 
        ref={setNodeRef} 
        style={style} 
        className={`${styles.row} ${row.getIsSelected() ? styles.selected : ''} ${isDragging ? styles.draggingRow : ''}`} 
        onClick={(e) => toggleRowSelected && toggleRowSelected(row.id, rowIndex, e)}
        // REMOVED: {...attributes} and {...listeners} as DragHandle will provide them
      >
        {row.getVisibleCells().map(cell => {
          const columnId = cell.column.id;
          return (
            <td key={cell.id} className={styles.cell} title={typeof cell.getValue() === 'string' || typeof cell.getValue() === 'number' ? String(cell.getValue()) : undefined}>
              {/* MODIFIED: Pass itemId to DragHandle */}
              {columnId === "drag" && <DragHandle itemId={row.original.id} rowIndex={rowIndex} />}
              {columnId === "expand" && (
                <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpanded && toggleRowExpanded(row.id);
                      }} title="Expand/Collapse Row">
                  {isExpanded ? "▽" : "▷"}
                </span>
              )}
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
      {isExpanded && (
        <tr className={styles.expandedRow}>
            {/* Ensure .expandedCellNoPadding exists or use a relevant class if padding is zero */}
            <td colSpan={row.getVisibleCells().length} className={styles.expandedCellNoPadding}> 
                <div className={styles.expandedContent}>
                {isImageTable && (
                    <>
                    {/* MODIFIED: className to styles.thumbnail from styles.expandedThumbnail for consistency with CSS */}
                    <div className={styles.thumbnailWrapper}><img src={row.original.filepath ? `thum:///${row.original.filepath}` : ''} alt="Expanded" className={styles.thumbnail} /></div>
                    <div className={styles.imageOptions}>
                        <label><input type="checkbox" checked={!!row.original.stretchImageToFit} onChange={handleStretchImageToFitChange} onClick={e => e.stopPropagation()} /> Stretch</label>
                        <label><input type="checkbox" checked={!!row.original.useBlurBackground} onChange={handleBlurBackgroundChange} onClick={e => e.stopPropagation()} /> Blur BG</label>
                        <label><input type="checkbox" checked={row.original.paddingColor != null} onChange={handlePaddingColorCheckboxChange} onClick={e => e.stopPropagation()} /> Pad Color:
                            <input type="text" value={row.original.paddingColor || "#FFFFFF"} onChange={handlePaddingColorTextChange} onBlur={e => !validateHexColor(e.target.value) && handleImagePropChange('paddingColor',"#FFFFFF")} disabled={row.original.paddingColor == null} className={styles.paddingColorInput} style={{ backgroundColor: row.original.paddingColor || 'transparent' }} onClick={e => e.stopPropagation()}/>
                        </label>
                        <div className={styles.colorPalette}>
                            {Object.entries(colorPalette).map(([k,c]) => c && c.hex && <div key={k} className={`${styles.colorBox} ${selectedColor === c.hex ? styles.selectedColorBox : ''}`} style={{backgroundColor: c.hex}} onClick={(e) => {e.stopPropagation(); handleColorBoxClick(c.hex)}} title={`${k}: ${c.hex}`} />)}
                        </div>
                    </div>
                    </>
                )}
                {!isImageTable && !isRenderTable && (
                    <>
                    <label>Start:<input type="text" value={row.original.startTime || (isOverAnHourRow ? '00:00:00' : '00:00')} onChange={e => handleTimeInputChange(e, 'startTime', row.original.id, isOverAnHourRow)} placeholder={isOverAnHourRow ? "H:M:S" : "M:S"} onClick={e => e.stopPropagation()} /></label>
                    <label>Length:<input type="text" value={row.original.length || formatDuration(row.original.duration)} onChange={e => handleTimeInputChange(e, 'length', row.original.id, isOverAnHourRow)} placeholder={isOverAnHourRow ? "H:M:S" : "M:S"} onClick={e => e.stopPropagation()} /></label>
                    <label>End:<input type="text" value={calculateEndTime(row.original.startTime || (isOverAnHourRow ? '00:00:00' : '00:00'), row.original.length || formatDuration(row.original.duration), isOverAnHourRow)} readOnly placeholder={isOverAnHourRow ? "H:M:S" : "M:S"} onClick={e => e.stopPropagation()} /></label>
                    </>
                )}
                {isRenderTable && <pre className={styles.ffmpegCommandPreview}>{row.original.ffmpegCommand || "No command."}</pre>}
                </div>
            </td>
        </tr>
      )}
    </>
  );
}


function Table({
  data = [], setData, columns = [], rowSelection = {}, setRowSelection,
  isImageTable = false, isRenderTable = false, setImageFiles = () => {}, setAudioFiles = () => {},
  ffmpegCommand, removeRender, globalFilter, setGlobalFilter, title, onSortedRows
}) {
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('expandedRows');
        if (saved) try { return JSON.parse(saved); } catch(e) { /* ignore */ }
    }
    if (isImageTable && data && data.length > 0) {
        return data.reduce((acc, row) => {
            if (row && row.id) acc[row.id] = true;
            return acc;
        }, {});
    }
    return {};
  });

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [lastSelectedRowIndex, setLastSelectedRowIndex] = useState(null);

  const generateUniqueId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const toggleRowSelected = useCallback((rowId, rowIndex, event) => {
    setRowSelection(prev => {
      const newSelection = { ...prev }; 
      const currentData = data || []; 

      if (event.shiftKey && lastSelectedRowIndex !== null && currentData.length > 0) {
        const start = Math.min(lastSelectedRowIndex, rowIndex);
        const end = Math.max(lastSelectedRowIndex, rowIndex);
        for (let i = start; i <= end; i++) {
          if (currentData[i]?.id) {
            newSelection[currentData[i].id] = true; 
          }
        }
      } else if (event.ctrlKey || event.metaKey) {
        if (newSelection[rowId]) {
          delete newSelection[rowId]; 
        } else {
          newSelection[rowId] = true;  
        }
      } else {
        if (newSelection[rowId]) {
          delete newSelection[rowId]; 
        } else {
          newSelection[rowId] = true;  
        }
      }
      return newSelection;
    });
    setLastSelectedRowIndex(rowIndex); 
  }, [data, lastSelectedRowIndex, setRowSelection]);


  const toggleRowExpanded = useCallback(rowId => {
    setExpandedRows(prev => {
      const newExp = { ...prev, [rowId]: !prev[rowId] };
      if (typeof window !== 'undefined') localStorage.setItem('expandedRows', JSON.stringify(newExp));
      return newExp;
    });
  }, []);

  const removeRow = useCallback(rowId => {
    if (isRenderTable && removeRender) removeRender(rowId);
    else if (setData) setData(p => p.filter(r => r.id !== rowId));
  }, [isRenderTable, removeRender, setData]);

  const clearTable = useCallback(() => {
    if (setData) setData([]);
    if (isImageTable && setImageFiles) setImageFiles([]);
    else if (!isRenderTable && setAudioFiles) setAudioFiles([]);
    if (setRowSelection) setRowSelection({});
  }, [setData, isImageTable, setImageFiles, isRenderTable, setAudioFiles, setRowSelection]);

  const copyRow = useCallback(rowId => {
    if (setData) setData(p => {
      const i = p.findIndex(r => r.id === rowId);
      if (i >= 0) return [...p.slice(0, i + 1), { ...p[i], id: generateUniqueId() }, ...p.slice(i + 1)];
      return p;
    });
  }, [setData]);

  const tableColumns = useMemo(() => {
    return [
      { id: "select", header: ({ table }) => { 
          const allRowsSelected = table.getIsAllRowsSelected();
          const someRowsSelected = table.getIsSomeRowsSelected();
          return <IndeterminateCheckbox 
                    checked={allRowsSelected} 
                    indeterminate={someRowsSelected && !allRowsSelected} 
                    onChange={table.getToggleAllRowsSelectedHandler()}
                 />;
        }, 
        cell: ({ row }) => <IndeterminateCheckbox 
                                checked={row.getIsSelected()} 
                                indeterminate={row.getIsSomeSelected()}
                                onChange={row.getToggleSelectedHandler()}
                            />
      },
      { id: "expand", header: "Expand", cell: () => null }, 
      { id: "drag", header: "Drag", cell: () => null },   
      ...columns.map(c => ({ ...c, header: c.id === 'openFolder' || c.enableSorting === false ? (typeof c.header === 'function' ? c.header : () => c.header) : ({header}) => (
          <div className={styles.sortableHeader} onClick={() => c.accessorKey && setSorting(s => [{id: c.accessorKey, desc: s[0]?.id === c.accessorKey ? !s[0]?.desc : false }])}>
            {typeof c.header === 'function' ? c.header(header.getContext()) : (c.header || "")}
            {c.accessorKey && <span className={styles.sortIcon}>{sorting[0]?.id === c.accessorKey ? (sorting[0]?.desc ? "🔽" : "🔼") : ""}</span>}
          </div>
      )})),
      ...(!isRenderTable ? [
        { id: "copy", header: "Copy", cell: ({row}) => <button className={styles.copyButton} onClick={e => {e.stopPropagation(); copyRow(row.original.id);}} title="Copy">📋</button> },
        { id: "remove", header: "Remove", cell: ({row}) => <button className={styles.removeButton} onClick={e => {e.stopPropagation(); removeRow(row.original.id);}} title="Remove">❌</button> }
      ] : [{ id: "remove", header: "Remove", cell: ({row}) => <button className={styles.removeButton} onClick={e => {e.stopPropagation(); removeRow(row.original.id);}} title="Remove">❌</button> }])
        .filter(ac => !columns.some(c => c.id === ac.id)) 
    ];
  }, [columns, sorting, isRenderTable, removeRow, copyRow, setSorting]); // data removed from deps as it's not directly used for column defs, only for rowSelection logic handled by table instance

  const table = useReactTable({
    data: data || [], columns: tableColumns, state: { sorting, pagination, rowSelection, globalFilter },
    getRowId: r => r.id, onPaginationChange: setPagination, 
    onRowSelectionChange: setRowSelection, 
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (r, cId, fVal) => String(r.getValue(cId)||"").toLowerCase().includes(String(fVal||"").toLowerCase()),
    enableRowSelection: true, 
    enableMultiRowSelection: true, 
  });

  useEffect(() => {
    const currentRows = table.getRowModel().rows;
    const selectedIds = new Set(Object.keys(rowSelection).filter(id => rowSelection[id]));
    const selectedRows = currentRows
      .filter(row => selectedIds.has(row.original.id))
      .map(row => row.original);

    if (selectedRows.length > 0 && title) { // Added title check for console log
      console.log(`[${title}] Selected Rows in Current Table Order:`, selectedRows);
    }
  }, [rowSelection, table.getRowModel().rows, title]);

  useEffect(() => {
    if (table.getRowModel().rows) {
      const sortedRows = table.getRowModel().rows.map(r => r.original);
      if (title) { // Added title check for console log
          console.log(`[${title}] Current Table Order:`, sortedRows);
      }
      if (onSortedRows) {
        onSortedRows(sortedRows);
      }
    }
  }, [sorting, data, table, onSortedRows, title]);

  // MODIFIED: Added handleDragStart
  const handleDragStart = useCallback(() => {
    if (sorting.length > 0) {
      const visuallySortedData = table.getRowModel().rows.map(row => row.original);
      setData(visuallySortedData); // Bake in current visual sort
      setSorting([]); // Clear programmatic sort
      if (title) { // Added title check for console log
        console.log(`[${title}] Drag started with active sort. Baked sort into data and cleared sorting state.`);
      }
    }
  }, [sorting, table, setData, setSorting, title]);


  const handleDragEnd = useCallback(event => {
    const { active, over } = event;
    if (active && over && active.id !== over.id && setData) {
      // table.getRowModel().rows will reflect the data after handleDragStart modifications (if any)
      const currentItems = table.getRowModel().rows.map(row => row.original);
      
      const oldIndex = currentItems.findIndex(item => item.id === active.id);
      const newIndex = currentItems.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentItems, oldIndex, newIndex);
        setData(newOrder);
        if (title) { // Added title check for console log
          console.log(`[${title}] New Row Order After Drag:`, newOrder);
        }
      }
    }
  }, [setData, table, title]);

  const totalSelectedDuration = useMemo(() => {
    if (isImageTable || isRenderTable || !data) return '00:00';
    const totalS = Object.keys(rowSelection).reduce((t, rId) => {
        const selR = data.find(r => r.id === rId);
        return selR ? t + parseDuration(selR.length || selR.duration || '0') : t;
    }, 0);
    return formatDuration(totalS);
  }, [rowSelection, data, isImageTable, isRenderTable]);

  return (
    <div>
      <div className={styles.tableControls}>
        <h2 className={styles.tableTitle}>{title || "Table"}</h2>
        <div className={styles.controlsWrapper}>
          <input type="text" value={globalFilter ?? ""} onChange={e => setGlobalFilter && setGlobalFilter(e.target.value)} placeholder="Search..." className={styles.search}/>
          <div className={styles.pagination}>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</button>
            <span> {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1} </span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
            <span> | Go: <input type="number" min="1" max={table.getPageCount()||1} defaultValue={table.getState().pagination.pageIndex+1} onChange={e=>table.setPageIndex(e.target.value?Number(e.target.value)-1:0)} className={styles.pageInput}/></span>
            <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(e.target.value==='all'?(data?.length||10):Number(e.target.value))}>
              {[10,20,30,40,50].map(s=><option key={s} value={s}>Show {s}</option>)}<option value="all">All</option>
            </select>
          </div>
          {(data?.length ?? 0) > 0 && clearTable && <button onClick={clearTable} className={`${styles.clearButton} ${styles.smallButton}`}>Clear</button>}
        </div>
      </div>
      {/* MODIFIED: Added onDragStart to DndContext */}
      <DndContext 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        {/* Ensure data used by SortableContext is up-to-date: (data || []) */}
        <SortableContext items={(data||[]).map(r => r.id)} strategy={verticalListSortingStrategy}>
          <table className={styles.table}>
            <thead>{table.getHeaderGroups().map(hg=><tr key={hg.id} className={styles.headerRow}>{hg.headers.map(h=><th key={h.id} className={styles.headerCell} style={{width:h.getSize()!==150?h.getSize():undefined}}>{h.isPlaceholder?null:flexRender(h.column.columnDef.header,h.getContext())}</th>)}</tr>)}</thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((r, rI) => <Row key={r.id} row={r} rowIndex={rI} toggleRowSelected={toggleRowSelected} toggleRowExpanded={toggleRowExpanded} isExpanded={!!expandedRows[r.id]} removeRow={removeRow} isImageTable={isImageTable} isRenderTable={isRenderTable} setImageFiles={setImageFiles} setAudioFiles={setAudioFiles}/>)
               : (<tr><td colSpan={table.getAllFlatColumns().length} style={{textAlign:'center',padding:'20px'}}>No data.</td></tr>)}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
      <div className={styles.footer}>
        <span>{Object.keys(rowSelection).length} of {(data||[]).length} selected</span>
        {!isImageTable && !isRenderTable && (data?.length??0)>0 && <span>Duration: {totalSelectedDuration}</span>}
      </div>
    </div>
  );
}
export default Table;