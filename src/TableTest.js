import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
} from "react";
import MaterialReactTable from "material-react-table";

const TableTest = ({ tableData, onSelectedRowsChanged, columnInfo }) => {
    const [data, setData] = useState([]);
    const [rowSelection, setRowSelection] = useState({});
    const tableRef = useRef(null);
    //call setData() function every time tableData var changes
    useEffect(() => {
        setData(tableData);
    }, [tableData]);

    const getSelectedRows = useCallback(() => {
        const sortedData = tableRef.current
            ?.getSortedRowModel()
            .rows.map((row) => row.original);
        let selectedRows = [];
        for (const [key, value] of Object.entries(rowSelection)) {
            selectedRows.push(sortedData[key]);
        }
        onSelectedRowsChanged(selectedRows);
    }, [rowSelection, onSelectedRowsChanged]);

    //call getSelectedRows() function every time rowSelection var changes
    useEffect(() => {
        getSelectedRows();
    }, [getSelectedRows]);

    //simple column definitions pointing to flat data
    const columns = useMemo(() => columnInfo, [columnInfo]);

    return (
        <>
            <MaterialReactTable
                autoResetPageIndex={false}
                tableInstanceRef={tableRef}
                columns={columns}
                data={data}
                enableRowSelection
                onRowSelectionChange={setRowSelection}
                state={{ rowSelection }}
                //clicking anywhere on the row will select it
                muiTableBodyRowProps={({ row }) => ({
                    onClick: row.getToggleSelectedHandler(),
                    sx: { cursor: "pointer" }
                })}
                enableRowNumbers
                rowNumberMode="static"
                initialState={{ density: "compact" }}
                enableTopToolbar={false}
                enableRowOrdering
                muiTableBodyRowDragHandleProps={({ table }) => ({
                    onDragEnd: () => {
                        const { draggingRow, hoveredRow } = table.getState();
                        if (hoveredRow && draggingRow) {
                            data.splice(
                                hoveredRow.index,
                                0,
                                data.splice(draggingRow.index, 1)[0]
                            );
                            setData([...data]);
                        }
                    }
                })}
            />
        </>
    );
};

export default TableTest;
