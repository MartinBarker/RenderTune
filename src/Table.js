import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-dt";
import "./Table.css";

const Table = ({ tableData }) => {
    
    //call tableSetup function once on startup
    useEffect(() => {
        tableSetup();
    }, []);

    //call function to update table data 
    useEffect(() => {
        updateTableRows(tableData)
    }, [tableData]);

    const updateTableRows = (newData) => {
        console.log('adding data to table: ', newData)
        var $el = $(tableRef.current);
        var dataTable = $el.DataTable();
        dataTable.clear()
        for(var x=0; x<newData.length; x++){
            console.log(`add row ${x}: `, newData[x])
            dataTable.row.add(newData[x]);
        }
        dataTable.draw();
      };

    const tableRef = useRef();
    const tableSetup = () => {
        const $el = $(tableRef.current);
        const dataTable = $el.DataTable({
            columns: [
                { title: "sequence" },
                { title: "#" },
                { title: "<input type='checkbox'>", orderable: false },
                { title: "audio", className: "track-name", type: "natural" },
            ],
            columnDefs: [
                { targets: [0], searchable: false, orderable: false, visible: false },
                { targets: [1], searchable: false, orderable: false, width: "40px" },
                { targets: [2], className: "selectall-checkbox text-center", searchable: false, orderable: false, width: "40px" },
            ],
            autoWidth: true,
            language: {
                emptyTable: "No files in this upload",
            },
            rowReorder: {
                dataSrc: "sequence",
            },
        });
        return () => {
            dataTable.destroy(true);
        };
    }

    return (
        <table ref={tableRef} style={{ width: "100%" }}>
            <thead>
                <tr>
                    <th>sequence</th>
                    <th>#</th>
                    <th>selectAll</th>
                    <th>audio</th>
                    {/*
                    <th>length</th>
                    <th>audioFilepath</th>
                    <th>trackNum</th>
                    <th>album</th>
                    <th>year</th>
                    <th>artist</th>
                    */}
                </tr>
            </thead>
        </table>
    );
};

export default Table;
