// Set up chart
var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create SVG wrapper
var svg = d3
  .select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Selected starting axes
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// Changes the scale on the x-axis when the selected x-axis changes
function xScale(data, chosenXAxis) {
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenXAxis]) * 0.9,
      d3.max(data, d => d[chosenXAxis]) * 1.1])
    .range([0,width]);

  return xLinearScale;
}

// Changes the scale on the y-axis when the selected y-axis changes
function yScale(data, chosenYAxis) {
  var yLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenYAxis]) * 0.65,
      d3.max(data, d => d[chosenYAxis]) * 1.1])
    .range([height, 0]);

  return yLinearScale;
}

// Updates x-axis when selected x-axis is changed
function renderXAxis(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// Updates y-axis when selected y-axis is changed
function renderYAxis(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
}

// Updates circles when x or y axes are changed
function renderCircles(circlesPart, newXScale, newYScale, chosenXAxis, chosenYAxis) {

  circlesPart.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]))
    .attr("x", d => newXScale(d[chosenXAxis]))
    .attr("y", d => newYScale(d[chosenYAxis]) + 5);

  return circlesPart;
}

// Updates clickable tooltip
function updateToolTip(circlesGroup, chosenXAxis, chosenYAxis) {

  switch (chosenXAxis) {
    case "age":
      var xLabel = "Age";
      break;
    case "income":
      var xLabel = "Income";
      break;
    default:
      var xLabel = "Poverty";
  }

  switch (chosenYAxis) {
    case "obesity":
      var yLabel = "Obesity";
      break;
    case "smokes":
      var yLabel = "Smokes";
      break;
    default:
      var yLabel = "Healthcare";
  }

  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([80, 60])
    .html(d => {
      return (`<b>${d.state}</b><br>${xLabel}: ${d[chosenXAxis]}<br>${yLabel}: ${d[chosenYAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", data => {
    toolTip.show(data);
  })

    .on("mouseout", data => {
      toolTip.hide(data);
    });
  
  return circlesGroup;
}

// Retrieve census data from csv
d3.csv("data.csv").then(censusData => {
  
  // Parse data
  censusData.forEach(data => {
    data.poverty = +data.poverty;
    data.age = +data.age;
    data.income = +data.income;
    data.healthcare = +data.healthcare;
    data.obesity = +data.obesity;
    data.smokes = +data.smokes;
  });

  // Find axes scales using functions above and csv data
  var xLinearScale = xScale(censusData, chosenXAxis);
  var yLinearScale = yScale(censusData, chosenYAxis);

  // Create axes functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // Append x-axis to chart
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // Append y-axis to chart
  var yAxis = chartGroup.append("g")
    .call(leftAxis);

  // Create group for circles and label text
  var circlesGroup = chartGroup.selectAll("g")
    .data(censusData)
    .enter()
    .append("g");

  // Append circles to group
  var circlesCircle = circlesGroup.append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", 15)
    .classed("stateCircle", true);

  // Append text to group
  var circlesText = circlesGroup.append("text")
    .text(d => d.abbr)
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d[chosenYAxis]) + 5)
    .classed("stateText", true);

  // Group all x-axis labels together
  var xLabelGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`)
    .classed("aText", true);

  // Add poverty label to x-axis labels
  var povertyLabel = xLabelGroup.append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("value", "poverty")
    .classed("active", true)
    .text("In Poverty (%)");

  // Add age label to x-axis labels
  var ageLabel = xLabelGroup.append("text")
    .attr("x", 0)
    .attr("y", 35)
    .attr("value", "age")
    .classed("inactive", true)
    .text("Age (median)");
  
  // Add income label to x-axis labels
  var incomeLabel = xLabelGroup.append("text")
    .attr("x", 0)
    .attr("y", 55)
    .attr("value", "income")
    .classed("inactive", true)
    .text("Income (median)");

  // Group all y-axis labels together
  var yLabelGroup = chartGroup.append("g")
    .attr("transform", "rotate(-90)")
    .classed("aText", true);

  // Add healthcare label to y-axis labels
  var healthcareLabel = yLabelGroup.append("text")
    .attr("y", 65 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("value", "healthcare")
    .classed("active", true)
    .text("Lacks Healthcare (%)");
  
  // Add obesity label to y-axis labels
  var obesityLabel = yLabelGroup.append("text")
    .attr("y", 45 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("value", "obesity")
    .classed("inactive", true)
    .text("Obesity (%)");

  // Add smokes label to y-axis labels
  var smokesLabel = yLabelGroup.append("text")
    .attr("y", 25 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("value", "smokes")
    .classed("inactive", true)
    .text("Smokes (%)");

  var circlesGroup = updateToolTip(circlesGroup, chosenXAxis, chosenYAxis);

  // Update x-axis, circle parts and labels when clicked
  xLabelGroup.selectAll("text")
    .on("click", function() {
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {
        chosenXAxis = value;

        xLinearScale = xScale(censusData, chosenXAxis);

        xAxis = renderXAxis(xLinearScale, xAxis);

        circlesCircle = renderCircles(circlesCircle, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
        circlesText = renderCircles(circlesText, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
        circlesGroup = updateToolTip(circlesGroup, chosenXAxis, chosenYAxis);

        // Changes active and inactive classes for labels
        switch (chosenXAxis) {
          case "age":
            povertyLabel.classed("active", false)
              .classed("inactive", true);
            ageLabel.classed("active", true)
              .classed("inactive", false);
            incomeLabel.classed("active", false)
              .classed("inactive", true);
            break;
          case "income":
            povertyLabel.classed("active", false)
              .classed("inactive", true);
            ageLabel.classed("active", false)
              .classed("inactive", true);
            incomeLabel.classed("active", true)
              .classed("inactive", false);
            break;
          default:
            povertyLabel.classed("active", true)
              .classed("inactive", false);
            ageLabel.classed("active", false)
              .classed("inactive", true);
            incomeLabel.classed("active", false)
              .classed("inactive", true); 
        }
      }
    });

  // Update y-axis, circle parts and labels when clicked
  yLabelGroup.selectAll("text")
    .on("click", function() {
      var value = d3.select(this).attr("value");
      if (value !== chosenYAxis) {
        chosenYAxis = value;
        
        yLinearScale = yScale(censusData, chosenYAxis);

        yAxis = renderYAxis(yLinearScale, yAxis);
        
        circlesCircle = renderCircles(circlesCircle, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
        circlesText = renderCircles(circlesText, xLinearScale, yLinearScale, chosenXAxis, chosenYAxis);
        circlesGroup = updateToolTip(circlesGroup, chosenXAxis, chosenYAxis);

        // Changes active and inactive classes for labels
        switch (chosenYAxis) { 
          case "obesity":
            healthcareLabel.classed("active", false)
              .classed("inactive", true);
            obesityLabel.classed("active", true)
              .classed("inactive", false);
            smokesLabel.classed("active", false)
              .classed("inactive", true);
            break;
          case "smokes":
            healthcareLabel.classed("active", false)
              .classed("inactive", true);
            obesityLabel.classed("active", false)
              .classed("inactive", true);
            smokesLabel.classed("active", true)
              .classed("inactive", false);
            break;
          default:
            healthcareLabel.classed("active", true)
              .classed("inactive", false);
            obesityLabel.classed("active", false)
              .classed("inactive", true);
            smokesLabel.classed("active", false)
              .classed("inactive", true);
        }
      }
    });
});