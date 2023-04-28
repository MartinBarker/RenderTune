import React, { useState, useEffect, useRef, useMemo } from "react";
import MaterialReactTable from 'material-react-table';

const Table = ({ tableData }) => {


    useEffect(() => {
        setData(tableData)
    }, [tableData]);


    //simple column definitions pointing to flat data
    const columns = useMemo(
        () => [
            {
                accessorKey: 'fileName',
                header: 'File Name',
            },
            {
                accessorKey: 'length',
                header: 'Length',
            }
        ],
        [],
    );

    const [data, setData] = useState([]);
    const [rowSelection, setRowSelection] = useState({});

        function showRowSelection(){
            console.log('show rowSelection, rowSelection=',rowSelection)
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
        
        <button onClick={()=>{console.log('rowSelection=',rowSelection)}} >Show rowSelection</button>
        </>
    );
};

export default Table;
