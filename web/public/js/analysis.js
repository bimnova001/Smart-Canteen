// analysis.js (Part 1)
// ======================================
// GLOBAL
// ======================================

let allData = [];
let filteredData = [];

let peopleChart = null;
let barChart = null;
let areaChart = null;


// ======================================
// LOAD DATA
// ======================================

async function fetchData() {
    try {
        const res = await fetch("/api/history");

        if (!res.ok) {
            throw new Error("Failed to fetch history");
        }

        allData = await res.json();

        // Fix BOM
        allData = allData.map(row => {

            if (row["﻿date"]) {
                row.date = row["﻿date"];
                delete row["﻿date"];
            }

            return {
                ...row,

                date: row.date,

                time: row.time || "00:00",

                avg_people:
                    Number(row.avg_people || 0),

                max_people:
                    Number(row.max_people || 0),

                food_count:
                    Number(row.food_count || 0),

                occupancy_percent:
                    Number(
                        row.avg_occupancy ??
                        row.occupancy_percent ??
                        0
                    )
            };
        });

        console.log("Analytics loaded:", allData);

    } catch (err) {

        console.error(err);

        allData = [];

    }

    applyFilter();
}


// ======================================
// FILTER
// ======================================

function applyFilter() {

    const range =
        document.getElementById("rangeSelect")
            ?.value || "all";

    if (range === "all") {

        filteredData = [...allData];

    } else {

        const days = Number(range);

        const cutoff = new Date();

        cutoff.setHours(0, 0, 0, 0);

        cutoff.setDate(
            cutoff.getDate() - days
        );

        filteredData =
            allData.filter(row => {

                const d =
                    new Date(row.date);

                return d >= cutoff;

            });
    }

    updateStats();

    drawCharts();

    if (typeof drawHeatmap === "function") {
        drawHeatmap();
    }
}


// ======================================
// STATS
// ======================================

function updateStats() {

    if (!filteredData.length) {

        setText("statAvgPeople", "0");
        setText("statPeak", "0");
        setText("statOcc", "0%");
        setText("statTotal", "0");

        return;
    }

    const avgPeople =
        average(
            filteredData.map(
                x => x.avg_people
            )
        );

    const peak =
        Math.max(
            ...filteredData.map(
                x => x.max_people
            )
        );

    const avgOcc =
        average(
            filteredData.map(
                x => x.occupancy_percent
            )
        );

    setText(
        "statAvgPeople",
        avgPeople.toFixed(1)
    );

    setText(
        "statPeak",
        peak
    );

    setText(
        "statOcc",
        avgOcc.toFixed(1) + "%"
    );

    setText(
        "statTotal",
        filteredData.length
    );

    const peakRow =
        filteredData.find(
            x => x.max_people === peak
        );

    if (peakRow) {

        setText(
            "statPeakDate",
            `${peakRow.date} ${peakRow.time}`
        );

    }
}


// ======================================
// UTIL
// ======================================

function average(arr) {

    if (!arr.length)
        return 0;

    return arr.reduce(
        (a, b) => a + b,
        0
    ) / arr.length;
}

function setText(id, value) {

    const el =
        document.getElementById(id);

    if (el) {
        el.textContent = value;
    }
}

function destroyChart(chart) {

    if (chart) {
        chart.destroy();
    }
}


// ======================================
// GROUP BY DATE
// ======================================

function groupByDate() {

    const map = {};

    filteredData.forEach(row => {

        if (!map[row.date]) {

            map[row.date] = {

                avgPeople: [],
                maxPeople: [],
                occupancy: [],
                food: []

            };
        }

        map[row.date]
            .avgPeople
            .push(
                row.avg_people
            );

        map[row.date]
            .maxPeople
            .push(
                row.max_people
            );

        map[row.date]
            .occupancy
            .push(
                row.occupancy_percent
            );

        map[row.date]
            .food
            .push(
                row.food_count
            );
    });

    return Object.keys(map)
        .sort()
        .map(date => ({

            date,

            avgPeople:
                average(
                    map[date].avgPeople
                ),

            maxPeople:
                Math.max(
                    ...map[date].maxPeople
                ),

            occupancy:
                average(
                    map[date].occupancy
                ),

            food:
                average(
                    map[date].food
                )
        }));
}


// ======================================
// DRAW CHARTS
// ======================================

function drawCharts() {

    const data =
        groupByDate();

    const labels =
        data.map(
            x => x.date
        );

    createPeopleChart(
        labels,
        data
    );

    createBarChart();

    createAreaChart(
        labels,
        data
    );
}


// ======================================
// LINE CHART
// ======================================

function createPeopleChart(
    labels,
    data
) {

    destroyChart(
        peopleChart
    );

    const ctx =
        document.getElementById(
            "lineChart"
        );

    if (!ctx) return;

    peopleChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Avg People",

                        data:
                            data.map(
                                x => x.avgPeople
                            ),

                        tension: 0.4,

                        borderWidth: 2
                    },

                    {
                        label:
                            "Peak People",

                        data:
                            data.map(
                                x => x.maxPeople
                            ),

                        tension: 0.4,

                        borderWidth: 2
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {

                    legend: {
                        display: true
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true
                    }
                }
            }
        });
}


// ======================================
// BAR CHART
// Avg People by Day
// ======================================

function createBarChart() {

    destroyChart(
        barChart
    );

    const ctx =
        document.getElementById(
            "barChart"
        );

    if (!ctx) return;

    const names = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    const values =
        new Array(7).fill(0);

    const counts =
        new Array(7).fill(0);

    filteredData.forEach(row => {

        const day =
            new Date(
                row.date
            ).getDay();

        values[day] +=
            row.avg_people;

        counts[day]++;
    });

    const avg =
        values.map(
            (v, i) =>
                counts[i]
                    ? v / counts[i]
                    : 0
        );

    barChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: names,

                datasets: [

                    {
                        label:
                            "Avg People",

                        data: avg,

                        borderWidth: 1
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true
                    }
                }
            }
        });
}


// ======================================
// AREA CHART
// Occupancy
// ======================================

function createAreaChart(
    labels,
    data
) {

    destroyChart(
        areaChart
    );

    const ctx =
        document.getElementById(
            "areaChart"
        );

    if (!ctx) return;

    areaChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels,

                datasets: [

                    {
                        label:
                            "Occupancy %",

                        data:
                            data.map(
                                x => x.occupancy
                            ),

                        fill: true,

                        tension: 0.4,

                        borderWidth: 2
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: true
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 100
                    }
                }
            }
        });
}

// ======================================
// HEATMAP
// ======================================

function drawHeatmap() {

    const container =
        document.getElementById(
            "heatmapContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    let metric = "avg_people";

    const selector =
        document.getElementById(
            "heatmapMetric"
        );

    if (selector) {
        metric = selector.value;
    }

    const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];

    const hours = [];

    for (let i = 0; i < 24; i++) {

        hours.push(
            String(i)
                .padStart(2, "0") + ":00"
        );
    }

    const matrix = {};

    days.forEach(day => {

        matrix[day] = {};

        hours.forEach(hour => {

            matrix[day][hour] = [];
        });
    });

    filteredData.forEach(row => {

        const day =
            days[
                new Date(
                    row.date
                ).getDay()
            ];

        const hour =
            row.time
                ?.substring(0, 2)
                .padStart(2, "0") +
            ":00";

        let value = 0;

        switch (metric) {

            case "occupancy_percent":
                value =
                    row.occupancy_percent;
                break;

            case "food_count":
                value =
                    row.food_count;
                break;

            default:
                value =
                    row.avg_people;
        }

        if (
            matrix[day] &&
            matrix[day][hour]
        ) {

            matrix[day][hour]
                .push(value);
        }
    });

    let maxValue = 1;

    Object.values(matrix)
        .forEach(day => {

            Object.values(day)
                .forEach(arr => {

                    if (arr.length) {

                        const avg =
                            average(arr);

                        maxValue =
                            Math.max(
                                maxValue,
                                avg
                            );
                    }
                });
        });

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "heatmap-container";

    const yLabels =
        document.createElement("div");

    yLabels.className =
        "hm-labels-y";

    days.forEach(day => {

        const label =
            document.createElement(
                "div"
            );

        label.className =
            "hm-label-y";

        label.textContent =
            day;

        yLabels.appendChild(
            label
        );
    });

    wrapper.appendChild(
        yLabels
    );

    const grid =
        document.createElement("div");

    grid.className =
        "heatmap";

    grid.style.gridTemplateColumns =
        `repeat(${hours.length}, 1fr)`;

    days.forEach(day => {

        hours.forEach(hour => {

            const arr =
                matrix[day][hour];

            const avg =
                arr.length
                    ? average(arr)
                    : 0;

            const intensity =
                avg / maxValue;

            const cell =
                document.createElement(
                    "div"
                );

            cell.className =
                "hm-cell";

            cell.style.background =
                `rgba(0,255,135,${0.08 + intensity * 0.92})`;

            cell.dataset.tooltip =
                `${day} ${hour}
${metric}: ${avg.toFixed(1)}`;

            cell.addEventListener(
                "mousemove",
                showTooltip
            );

            cell.addEventListener(
                "mouseleave",
                hideTooltip
            );

            grid.appendChild(
                cell
            );
        });
    });

    const gridWrapper =
        document.createElement("div");

    gridWrapper.appendChild(
        grid
    );

    const xLabels =
        document.createElement("div");

    xLabels.className =
        "hm-labels-x";

    hours.forEach(hour => {

        const label =
            document.createElement(
                "div"
            );

        label.className =
            "hm-label";

        label.textContent =
            hour.substring(0, 2);

        xLabels.appendChild(
            label
        );
    });

    gridWrapper.appendChild(
        xLabels
    );

    wrapper.appendChild(
        gridWrapper
    );

    container.appendChild(
        wrapper
    );
}


// ======================================
// TOOLTIP
// ======================================

function showTooltip(e) {

    const tooltip =
        document.getElementById(
            "tooltip"
        );

    if (!tooltip) return;

    tooltip.textContent =
        e.target.dataset.tooltip;

    tooltip.classList.add(
        "show"
    );

    tooltip.style.left =
        e.clientX + 12 + "px";

    tooltip.style.top =
        e.clientY + 12 + "px";
}

function hideTooltip() {

    const tooltip =
        document.getElementById(
            "tooltip"
        );

    if (!tooltip) return;

    tooltip.classList.remove(
        "show"
    );
}


// ======================================
// EXPORT CSV
// ======================================

function exportCSV() {

    if (!filteredData.length)
        return;

    const header =
        [
            "date",
            "time",
            "avg_people",
            "max_people",
            "food_count",
            "occupancy_percent"
        ];

    const rows =
        filteredData.map(row => [

            row.date,
            row.time,
            row.avg_people,
            row.max_people,
            row.food_count,
            row.occupancy_percent
        ]);

    const csv =
        [
            header.join(","),

            ...rows.map(
                r => r.join(",")
            )
        ].join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement(
            "a"
        );

    a.href = url;

    a.download =
        "analytics.csv";

    a.click();

    URL.revokeObjectURL(
        url
    );
}


// ======================================
// EVENTS
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        fetchData();

        document
            .getElementById(
                "rangeSelect"
            )
            ?.addEventListener(
                "change",
                applyFilter
            );

        document
            .getElementById(
                "refreshBtn"
            )
            ?.addEventListener(
                "click",
                fetchData
            );

        document
            .getElementById(
                "exportBtn"
            )
            ?.addEventListener(
                "click",
                exportCSV
            );

        document
            .getElementById(
                "heatmapMetric"
            )
            ?.addEventListener(
                "change",
                drawHeatmap
            );
    }
);