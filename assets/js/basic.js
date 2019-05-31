// FUNCTIONS: xScale(lines 47-56), yScale(lines 59-68), renderXAxes(lines 71-79), renerYAxes(lines 82-90),
//      renderCircles(lines 93-115), rollOver(lines 118-140), inactiveLabel(lines 142-144), 
//      activeLabel(lines 146 - 148)

// READ CSV: lines 150-323

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
        .attr('fill', '#79d2a6');

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