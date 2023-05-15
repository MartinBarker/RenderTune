import React, { useState, useEffect, useRef, useMemo } from "react";
import MaterialReactTable from 'material-react-table';

const Table = ({ tableData, onSelectedRowsChanged, columnInfo }) => {

    const [data, setData] = useState([]);
    const [rowSelection, setRowSelection] = useState({});

    //call setData() function every time tableData var changes
    useEffect(() => {
        setData(tableData);
    }, [tableData]);

    //call getSelectedRows() function every time rowSelection var changes    
    useEffect(() => {
        getSelectedRows();
    }, [rowSelection]);

    //simple column definitions pointing to flat data
    const columns = useMemo(
        () => columnInfo,
        [columnInfo],
    );

    function getSelectedRows() {
        let selectedRows = []
        for (const [key, value] of Object.entries(rowSelection)) {
            selectedRows.push(data[key])
        }
        onSelectedRowsChanged(selectedRows)
    }

    return (
        <>
            <MaterialReactTable
                autoResetPageIndex={false}
                columns={columns}
                data={data}
                enableRowSelection
                onRowSelectionChange={setRowSelection}
                state={{ rowSelection }}
                //clicking anywhere on the row will select it
                muiTableBodyRowProps={({ row }) => ({
                    onClick: row.getToggleSelectedHandler(),
                    sx: { cursor: 'pointer' },
                })}
                enableRowNumbers
                rowNumberMode="static"
                initialState={{ density: 'compact' }}
                enableTopToolbar={false}
                enableRowOrdering
                muiTableBodyRowDragHandleProps={({ table }) => ({
                    onDragEnd: () => {
                        const { draggingRow, hoveredRow } = table.getState();
                        if (hoveredRow && draggingRow) {
                            data.splice(
                                hoveredRow.index,
                                0,
                                data.splice(draggingRow.index, 1)[0],
                            );
                            setData([...data]);
                        }
                    },
                })}
            />
        </>
    );
};

export default Table;
