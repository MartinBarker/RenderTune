import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-dt";
import './Table.css';


const Table = () => {

    // Set default table data 
    const [dataSet, setDataSet] = useState([
        [
            'aaaa 1',
            'aaaa 2',
            'aaaa 3',
            'aaaa 4',
            'aaaa 5',
            'aaaa 6',
        ],
        [
            'bbbb 1',
            'bbbb 2',
            'bbbb 3',
            'bbbb 4',
            'bbbb 5',
            'bbbb 6',
        ]
    ]);
    
    const [dataSetObj, setDataSetObj] = useState([
        {
            "sequence":'aaaa 1',
            "#":'aaaa 2',
            "selectAll":'aaaa 3',
            "audio":'aaaa 4',
            "length":'aaaa 5',
            "audioFilepath":'aaaa 6',
        },
        {
            "sequence":'bbbbb 1',
            "#":'bbbbb 2',
            "selectAll":'bbbbb 3',
            "audio":'bbbbb 4',
            "length":'bbbbb 5',
            "audioFilepath":'bbbbb 6',
        }
    ]);
    

    const tableRef = useRef();

    // Run this at start of component dom render
    useEffect(() => {
        const $el = $(tableRef.current);
        const dataTable = $el.DataTable({
            data: dataSet,
            "autoWidth": true,
            "pageLength": 5000,


            columns: [
                { title: "sequence" },
                { title: "#" },
                { title: "selectAll" },
                { title: "audio" },
                { title: "length" },
                { title: "audioFilepath" },
            ],
            columnDefs: [
                { //invisible sequence num
                  searchable: false,
                  orderable: false,
                  visible: false,
                  targets: 0,
                },
                { //visible sequence num
                  searchable: false,
                  orderable: false,
                  targets: 1,
          
                },
                {//select all checkbox
                  "className": 'selectall-checkbox',
                  "className": "text-center",
                  searchable: false,
                  orderable: false,
                  targets: 2,
                },
                {//audio filename 
                  targets: 3,
                  type: "natural",
                  className: 'track-name'
                },
                /*
                {//audio format
                    targets: 4,
                    type: "string"
                },
                */
                { //audio file length
                  targets: 4,
                  type: "string"
                },
                /*
                
                { //video output format
                    targets: 6,
                    type: "string",
                    orderable: false
                },
                */
                {//audioFilepath
                  targets: 5,
                  visible: false,
                }
              ],
            
        });

        // Add a new row
        dataTable.row.add([
            'bzzzzbbb 1',
            'bzzzzbbb 2',
            'bzzzzbbb 3',
            'bzzzzbbb 4',
            'bzzzzbbb 5',
            'bzzzzbbb 6',
        ]).draw();

        // Destroy the DataTable instance when the component unmounts
        return () => {
            dataTable.destroy(true);
        };
    }, []);

    return (
        <table ref={tableRef}>
            <thead>
                <tr>
                    <th>sequence</th>
                    <th>#</th>
                    <th>selectAll</th>
                    <th>audio</th>
                    <th>length</th>
                    <th>audioFilepath</th>
                </tr>
            </thead>
        </table>
    );
};

export default Table;

