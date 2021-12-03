// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 30, left: 40 },
  width = 300 - margin.left - margin.right,
  height = 1600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("body")
  .append("svg")
  .attr("height", width + margin.left + margin.right)
  .attr("width", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let distributionFile = "counts.csv";
let numBins = 16;

// get the data
d3.csv(distributionFile, function (data) {
  // X axis: scale and draw:
  var x = d3
    .scaleLinear()
    .domain([0, numBins]) // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
    .range([0, width]);
  svg.append("g").call(d3.axisLeft(x));

  // set the parameters for the histogram
  var histogram = d3
    .histogram()
    .value(function (d) {
      return d.bucket;
    }) // I need to give the vector of value
    .domain(x.domain()) // then the domain of the graphic
    .thresholds(x.ticks(numBins)); // then the numbers of bins

  // // And apply this function to data to get the bins
  var bins = histogram(data);

  // Y axis: scale and draw:
  var y = d3.scaleLinear().range([height, 0]);
  y.domain([
    d3.max(bins, function (d) {
      return d.length;
    }),
    0,
  ]); // d3.hist has to be called before the Y axis obviously
  // svg.append("g").call(d3.axisBottom(y));

  // append the bar rectangles to the svg element
  svg
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", 1)
    .attr("transform", function (d) {
      return "translate(" + 0 + "," + x(d.x0) + ")";
    })
    .attr("height", function (d) {
      return x(d.x1) - x(d.x0) - 2;
    })
    .attr("width", function (d) {
      return y(d.length);
    })
    .style("opacity", 0.7)
    .style("fill", "#69b3a2");
});
