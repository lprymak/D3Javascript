// FUNCTIONS: xScale(lines 47-56), yScale(lines 59-68), renderXAxes(lines 71-79), renerYAxes(lines 82-90),
//      renderCircles(lines 93-115), rollOver(lines 118-140), createTable(lines 143-177), 
//      createBarChart(lines 180 - 302), clickChange(lines 305-394), inactiveLabel(lines 397-399), 
//      activeLabel(lines 400 - 403)

// READ CSV: lines 407-582

// SVG wrapper dimensions
var svgWidth = 900;
var svgHeight = 660;

var margin = {
    top: 50,
    right: 60,
    bottom: 100,
    left: 120
};

var height = svgHeight - margin.top - margin.bottom;
var width = svgWidth - margin.left - margin.right;

// Creates an SVG wrapper, appends an SVG group that will hold our chart
var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

svg.append('rect').style('width', '100%').style('height', '100%').attr('fill', 'white').classed('chartBack', true);

// Appends an SVG group
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// Creates dictionary of labels and label text
var labelValues = {
    "smokes": "Smoking Population (%):", "obesity": "Obesity Rate (%):",
    "healthcare": "Lacking Healthcare (%):", "income": "Household Income:",
    "age": "Median Age:", "poverty": "Poverty Rate (%):"
};
// Create array to hold clicked circle data
var clickedCircles = [];

// Function used for updating x-scale var upon click on axis label
function xScale(censusData, chosenXAxis) {
    // Creates x scale
    var xLinearScale = d3.scaleLinear()
        .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
        d3.max(censusData, d => d[chosenXAxis])
        ])
        .range([0, width]);

    return xLinearScale;
}

// Function used for updating y-scale var upon click on axis label
function yScale(censusData, chosenYAxis) {
    // Creates y scale
    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(censusData, d => d[chosenYAxis]) * 0.8,
        d3.max(censusData, d => d[chosenYAxis])
        ])
        .range([height, 0]);

    return yLinearScale;
}

// Function used for updating xAxis var upon click on axis label
function renderXAxes(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);

    return xAxis;
}

// Function used for updating yAxis var upon click on axis label
function renderYAxes(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
        .duration(1000)
        .call(leftAxis);

    return yAxis;
}

// Function used for updating circles group with a transition to new circles
function renderCircles(circlesGroup, cicleMasks, textMasks, newXScale, chosenXAxis, newYScale, chosenYAxis, censusData) {

    // Transitions circles
    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));

    cicleMasks.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));

    textMasks.transition()
        .duration(1000)
        .attr("x", d => newXScale(d[chosenXAxis]))
        .attr("y", d => newYScale(d[chosenYAxis]) + 5);

    // Updates tooltips with new info
    rollOver(circlesGroup, chosenXAxis, chosenYAxis, censusData);

    return circlesGroup;
}

// Function to update tooltips on mouseover
function rollOver(circlesGroup, chosenXAxis, chosenYAxis, censusData) {

    xlabel = labelValues[chosenXAxis];
    ylabel = labelValues[chosenYAxis];

    clickChange(circlesGroup, censusData);

    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([95, -95])
        .html(function (d) {
            return (`${d.state}<br>${xlabel} ${d[chosenXAxis]}<br>${ylabel} ${d[chosenYAxis]}`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function (labels) {
        toolTip.show(labels, this);
    })
        .on("mouseout", function (labels) {
            toolTip.hide(labels);
        });
}

// Function to create summary table
function createTable(arr) {
    var Indexes = ['poverty', 'age', 'income', 'healthcare', 'obesity', 'smokes'];
    var pnl = d3.select('#summary').append('div').classed("card", true).append('div').classed("card-body", true);
    var tbl = pnl.append('table');
    if (arr.length < 2) {

        tbl.append("thead").selectAll("tr")
            .data([arr])
            .enter()
            .append("tr")
            .html(d => `<td rowspan="2" ></td><th rowspan="2">${d[0].state}</th>`);

        Indexes.map(i => {
            tbl.append("tbody")
                .selectAll("tr").data([arr])
                .enter().append("tr")
                .html(d => `<th>${labelValues[i]}</th><td>${d[0][i]}</td>`);
        })
    }
    else {
        tbl.append("thead").selectAll("tr")
            .data([arr])
            .enter()
            .append("tr")
            .html(d => `<td rowspan="2" class=wht></td><th rowspan="2" class="first" >${d[0].state}</th><th rowspan="2" class="second" >${d[1].state}</th>`);

        Indexes.map(i => {
            tbl.append("tbody")
                .selectAll("tr").data([arr])
                .enter().append("tr")
                .html(d => `<th>${labelValues[i]}</th><td>${d[0][i]}</td><td>${d[1][i]}</td>`);
        });
    }
    // console.log(d3.select('#summary').node().clientHeight);
}

// Function to create comaparison bar chart for two states
function createBarChart(stateData, censusData) {
    var totalWidth = 350;
    var totalHeight = 450;

    // Use table height for bar chart placement
    var summaryHeight = d3.select('#summary').node().clientHeight;

    var CARD = d3.select('#bar').append('div').classed('card border-0', true).append('div').classed('card-body', true);
    CARD.append('div').attr("height", totalHeight).attr("width", totalWidth).attr('id', 'bchart').classed('overflow-hidden', true);

    // Calculate averages and save to object
    var averages = {};
    Object.keys(labelValues).map(index => {
        var data = [];
        censusData.map(state => {
            data.push(state[index]);
        })
        var sum = data.reduce(function (a, b) { return a + b; });
        var avgs = sum / data.length;
        averages[index] = { "average": avgs.toPrecision(4), "max": d3.max(data), "min": d3.min(data) };
    })

    var x1 = [], x2 = [], ys = [];
    Object.keys(averages).map(key => {
        x1.push(stateData[0][key]);
        x2.push(stateData[1][key]);
        ys.push(key);
    })

    var data = []
    var layout = {
        margin: { l: 170 },
        width: totalWidth,
        height: totalHeight,
        grid: {
            rows: 6,
            columns: 1,
            pattern: 'independent',
            roworder: 'bottom to top'
        },
        font: {
            family: 'sans-serif'
        },
        showlegend: false,
        barmode: 'group'
    };
    // Create a bar subplot for each category
    ys.forEach((item, i) => {
        console.log(averages[item].average);
        trace0 = {
            x: [x1[i]],
            y: [labelValues[item]],
            type: 'bar',
            name: stateData[0].state,
            orientation: 'h',
            xaxis: `x${i + 1}`,
            yaxis: `y${i + 1}`,
            marker: {
                color: '#79d2a6'
            },
            font: {
                family: 'sans-serif',
                size: 14,
                color: '#79d2a6'
            }
        }
        trace1 = {
            x: [x2[i]],
            y: [labelValues[item]],
            type: 'bar',
            name: stateData[1].state,
            orientation: 'h',
            xaxis: `x${i + 1}`,
            yaxis: `y${i + 1}`,
            marker: {
                color: 'rgb(82, 81, 81)'
            }
        }

        trace2 = {
            x: [averages[item].average],
            y: [labelValues[item]],
            type: 'bar',
            name: "Average",
            orientation: 'h',
            xaxis: `x${i + 1}`,
            yaxis: `y${i + 1}`,
            marker: {
                color: '#cccccc'
            }
        }
        data.push(trace2, trace1, trace0);

        if (i === 0) {
            layout[`xaxis`] = { domain: [0, d3.max([x1[0], x2[0]])], anchor: `y${0}`, showgrid: false, zeroline: false, showline: false, showticklabels: false, fixedrange: true };
            layout[`yaxis`] = { showgrid: false, zeroline: false, showline: false, tickfont: { family: 'sans-serif', size: 12 }, fixedrange: true };
        }
        else {
            layout[`xaxis${i + 1}`] = { domain: [0, d3.max([x1[i], x2[i]])], anchor: `y${i}`, showgrid: false, zeroline: false, showline: false, showticklabels: false, fixedrange: true };
            layout[`yaxis${i + 1}`] = { showgrid: false, zeroline: false, showline: false, tickfont: { family: 'sans-serif', size: 12 }, fixedrange: true };
        }
    })

    // Chart subplots
    Plotly.newPlot('bchart', data, layout);

    // Move plotly parent div to below summary table height, change width and margins
    var bar = d3.select("#bar");
    bar.select('.svg-container').classed('overflow-hidden', true).style("transform", `translate(50px, 0)`);
    bar.select('.main-svg').classed('overflow-hidden', true);
    bar.select('.card').style('width', 350);
    bar.style("margin-top", `${summaryHeight - 35}px`);

    // Create smaller legend - problem I am having with subplots is the one legend per subplot, so created separate
    // to elminiate trying to figure out how to keep one legend only
    var graphHeight = d3.select('#bar').node().clientHeight;
    var lg = bar.select('.card-body').append('svg').classed('lgnd', true).attr('height', 60).attr("transform", `translate(67, ${-1 * (graphHeight - 70)})`);

    lg.append('rect').attr('width', '10').attr('height', '10').attr('x', 0).attr('y', 0).style('fill', '#79d2a6');
    lg.append('text').text(stateData[0].state).attr('x', 25).attr('y', 9).style('font-size', 10).style('fill', '#808080');
    lg.append('rect').attr('width', '10').attr('height', '10').attr('x', 0).attr('y', 15).style('fill', 'rgb(82, 81, 81)');
    lg.append('text').text(stateData[1].state).attr('x', 25).attr('y', 24).style('font-size', 10).style('fill', '#808080');
    lg.append('rect').attr('width', '10').attr('height', '10').attr('x', 0).attr('y', 30).style('fill', '#cccccc');
    lg.append('text').text("National Average").attr('x', 25).attr('y', 39).style('font-size', 10).style('fill', '#808080');
}

// Function to change the opacity when a circle is clicked on
function clickChange(circlesGroup, censusData) {
    // 
    function clearSummary() {
        d3.select('#summary').html("");
        d3.select('#bar').html("");
        clickedCircles = [];
    }

    // Changes all circles to 1 opacity when click on bg
    d3.selectAll('.chartBack').on('click', function () {
        circlesGroup.transition().style('opacity', 1).attr('fill', '#79d2a6');
        clearSummary();
        d3.select('#summary').append('p').text('*Select up to 2 states').style('color', 'lightgray');
    })

    // Changes other circles to 0.5 opacity while keeping clicked circle 1 opacity
    circlesGroup.on('click', function () {
        // If selected has 1 opacity and if there are already two others selected, 
        // change to 0.5 opacity and remove from data array
        var color = d3.select(this)._groups[0][0].style.opacity;
        // If none selected, add clicked data to array and change opacity
        if (clickedCircles.length === 0) {
            clearSummary();
            circlesGroup.transition().style('opacity', 0.2).attr('fill', 'rgb(82, 81, 81)');

            d3.select(this)
                .transition()
                .duration(10)
                .style('opacity', 1).attr('fill', '#79d2a6');
            clickedCircles.push(d3.select(this)._groups[0][0].__data__);

            createTable(clickedCircles);

        }
        // If one selected already
        else if (clickedCircles.length === 1) {
            // If one circle selected, add second clicked to array and change opacity
            if (color == 0.2) {
                clickedCircles.push(d3.select(this)._groups[0][0].__data__);
                d3.select(this)
                    .transition()
                    .duration(10)
                    .style('opacity', 1)
                    .attr('fill', '#79d2a6');
                d3.select('#summary').html("");
                d3.select('#bar').html("");

                createTable(clickedCircles);
                createBarChart(clickedCircles, censusData);
            }
            // If selected has 1 opacity and if only one selected, change all circles to 1 opacity and empty data array
            else {
                circlesGroup.transition().style('opacity', 1).attr('fill', '#79d2a6');
                clearSummary();
                d3.select('#summary').append('p').text('*Select up to 2 states').style('color', 'lightgray');
            }
        }
        // If two selected already
        else {
            // If two circles selected and clicked circle opacity is 1, 
            // change opacity to 0.2 and remove from selected array
            if (color == 1) {
                clickedCircles.splice(clickedCircles.indexOf(d3.select(this)._groups[0][0].__data__), 1);
                d3.select(this)
                    .transition()
                    .duration(10)
                    .style('opacity', 0.2)
                    .attr('fill', 'rgb(82, 81, 81)');
                d3.select('#summary').html("");
                d3.select('#bar').html("");
                createTable(clickedCircles);
            }
            // If two circles selected, clear array before adding selected
            else {
                clearSummary();
                circlesGroup.transition().style('opacity', 0.2).attr('fill', 'rgb(82, 81, 81)');
                clickedCircles.push(d3.select(this)._groups[0][0].__data__);

                d3.select(this)
                    .transition()
                    .duration(10)
                    .style('opacity', 1)
                    .attr('fill', '#79d2a6');
                createTable(clickedCircles);
            }
        }

        // Prevents from propagating to the parent svg event
        d3.event.stopPropagation();
    })
}

// Function setting label to inactive
function inactiveLabel(label) {
    d3.select(`.${label}`).classed("active", false).classed("inactive", true);
}
// Function setting label to active
function activeLabel(label) {
    d3.select(`.${label}`).classed("active", true).classed("inactive", false);
}

// Reads csv
d3.csv("./assets/data/data.csv").then(function (censusData) {
    console.log(censusData);

    // Parses data
    censusData.forEach(state => {
        state.poverty = +state.poverty;
        state.healthcare = +state.healthcare;
        state.id = +state.id;
        state.age = +state.age;
        state.income = +state.income;
        state.smokes = +state.smokes;
        state.obesity = +state.obesity;
    })

    var SUMMARY = d3.select('#summary');
    SUMMARY.append('p').text('*Select up to 2 states').style('color', 'lightgray');

    // Sets initial active axis labels
    var chosenXAxis = "poverty";
    var chosenYAxis = "healthcare";

    // Creates x scale function
    var xLinearScale = xScale(censusData, chosenXAxis);

    // Creates y scale function
    var yLinearScale = yScale(censusData, chosenYAxis);

    // Adds main circles - main color
    var circlesGroup = chartGroup.selectAll("circle")
        .data(censusData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 16)
        .attr('fill', '#79d2a6')
        .classed("stateCircle", true)
        .attr("mask", "url(#text_mask)");

    // Creates mask
    var mask = chartGroup.append('mask').attr('id', 'text_mask');

    // Adds mask circles - color equates opacity
    var cicleMasks = mask.selectAll("circle")
        .data(censusData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 16)
        .attr('fill', '#e6e6e6');

    // Adds abbreviation text to mask - background color visible
    var textMasks = mask.selectAll("circle").select('text')
        .data(censusData)
        .enter()
        .append("text")
        .attr("x", d => xLinearScale(d[chosenXAxis]))
        .attr("y", d => yLinearScale(d[chosenYAxis]) + 5)
        .attr("text-anchor", "middle")
        .style("font-size", 14)
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text((d) => d.abbr);

    // Calls initial rollover tooltips
    rollOver(circlesGroup, chosenXAxis, chosenYAxis, censusData);

    // Creates initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Appends x axis
    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // Appends y axis
    var yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis);

    // Createa group for  2 x- axis labels
    var labelsGroup = chartGroup.append("g")

    // Creates x axis labels
    var xValues = [{ 'value': 'poverty', 'text': 'Poverty Rate (%)' },
    { 'value': 'age', 'text': 'Median Age' },
    { 'value': 'income', 'text': 'Household Income' }
    ];
    xValues.map((entry, i) => {
        labelsGroup.append("text")
            .attr("transform", `translate(${width / 2}, ${height})`)
            .attr("x", 0)
            .attr("y", (20 * i) + 40)
            .attr("value", entry.value) // value to grab for event listener
            .classed("inactive", true)
            .classed(entry.value, true)
            .text(entry.text);
    })

    // Creates y axis labels
    var yValues = [{ 'value': 'healthcare', 'text': 'Lacking Healthcare (%)' },
    { 'value': 'smokes', 'text': 'Smoking Rate (%)' },
    { 'value': 'obesity', 'text': 'Obesity Rate (%)' }
    ];
    yValues.map((entry, i) => {
        labelsGroup.append('text')
            .attr("transform", `translate(${0}, ${height / 2})`)
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - height / 2)
            .attr("y", (i * -20) - 40)
            .attr("value", entry.value) // value to grab for event listener
            .classed("inactive", true)
            .classed(entry.value, true)
            .text(entry.text);
    })

    // Sets current chosen axis labels to active
    activeLabel(chosenXAxis);
    activeLabel(chosenYAxis);

    // x axis labels event listener
    labelsGroup.selectAll("text").on("click", function () {

        // Gets value of selection
        var value = d3.select(this).attr("value");
        // If change in x axis
        if (value === "poverty" || value === "age" || value === "income") {
            if (value !== chosenXAxis) {

                // Replaces chosenXaxis with value
                chosenXAxis = value;

                // Updates x scale for new data
                xLinearScale = xScale(censusData, chosenXAxis);

                // Updates x axis with transition
                xAxis = renderXAxes(xLinearScale, xAxis);

                // Updates circles with new x values
                circlesGroup = renderCircles(circlesGroup, cicleMasks, textMasks, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis, censusData);

                // Changes classes to change bold text
                Object.keys(labelValues).map(key => {
                    inactiveLabel(key);
                })
                activeLabel(value);
                activeLabel(chosenYAxis);
            }
        }
        // If change in y axis
        else {
            if (value !== chosenYAxis) {

                // Replaces chosenXaxis with value
                chosenYAxis = value;

                // Updates y scale for new data
                yLinearScale = yScale(censusData, chosenYAxis);

                // Updates y axis with transition
                yAxis = renderYAxes(yLinearScale, yAxis);

                // Updates circles with new y values
                circlesGroup = renderCircles(circlesGroup, cicleMasks, textMasks, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis, censusData);

                // Changes classes to change bold text
                Object.keys(labelValues).map(key => {
                    inactiveLabel(key);
                })
                activeLabel(value);
                activeLabel(chosenXAxis);
            };
        };
    })
})