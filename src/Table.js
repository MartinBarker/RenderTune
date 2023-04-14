import React, { useEffect, useRef } from "react";
import $ from "jquery";
import DataTable from "datatables.net-dt";

var dataSet = [
    [
        "Tiger Nixon",
        "System Architect",
        "Edinburgh",
        "5421",
        "2011/04/25",
        "$320,800",
    ],
    [
        "Ashton Cox",
        "Junior Technical Author",
        "San Francisco",
        "1562",
        "2009/01/12",
        "$86,000",
    ]
];

const Table = () => {
    const tableRef = useRef();

    useEffect(() => {
        const $el = $(tableRef.current);
        const dataTable = $el.DataTable({
            data: dataSet,
            columns: [
                { title: "Name" },
                { title: "Occupation" },
                { title: "City" },
                { title: "ZIP" },
                { title: "Birthday" },
                { title: "Salary" },
            ],
        });
        // Destroy the DataTable instance when the component unmounts
        return () => {
            dataTable.destroy(true);
        };
    }, []);

    return (
        <table ref={tableRef}>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Occupation</th>
                    <th>City</th>
                    <th>ZIP</th>
                    <th>Birthday</th>
                    <th>Salary</th>
                </tr>
            </thead>
        </table>
    );
};

export default Table;

