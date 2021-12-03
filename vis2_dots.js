//SVG setup
const margin = { top: 40, right: 30, bottom: 30, left: 50 },
  width = 1200 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

//x scales
const y = d3.scaleLinear().rangeRound([0, height]).domain([0, 17]);

//set up svg
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

//tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const t = d3.transition().duration(1000);

const dataFile = "chicago.csv";
const medians = { chicago: 58247 };
//number of bins for histogram
const nbins = 16;

//Note: data fetching is done each time the function is ran
//as d3.csv is replaced by tabletop.js request to get data each time
//from google spreadsheet
function update() {
  let distributionFile = "counts.csv";

  // get the data
  d3.csv(distributionFile, function (data) {
    // X axis: scale and draw:
    var dist_x = d3
      .scaleLinear()
      .domain([0, 17]) // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
      .range([0, height]);
    // svg.append("g").call(d3.axisLeft(dist_x));

    // set the parameters for the histogram
    var histogram = d3
      .histogram()
      .value(function (d) {
        return d.bucket;
      }) // I need to give the vector of value
      .domain(dist_x.domain()) // then the domain of the graphic
      .thresholds(dist_x.ticks(nbins)); // then the numbers of bins

    // // And apply this function to data to get the bins
    var dist_bins = histogram(data);

    // Y axis: scale and draw:
    var dist_y = d3.scaleLinear().range([width, 0]);
    dist_y.domain([100, 0]); // d3.hist has to be called before the Y axis obviously
    // svg.append("g").call(d3.axisBottom(y));

    // append the bar rectangles to the svg element
    svg
      .selectAll("rect")
      .data(dist_bins)
      .enter()
      .append("rect")
      .attr("x", 1)
      .attr("transform", function (d) {
        return "translate(" + 10 + "," + dist_x(d.x0 - 0.4) + ")";
      })
      .attr("height", function (d) {
        return dist_x(d.x1) - dist_x(d.x0) - 1;
      })
      .attr("width", function (d) {
        return dist_y(d.length * 0.8);
      })
      .style("opacity", 0.5)
      .style("fill", "#ADA8A8");
  });

  // Get the data
  d3.csv(dataFile, function (error, allData) {
    allData.forEach(function (d) {
      d.station_name = d.station_name;
      d.bucket = +d.bucket;
    });
    //simulate new data by randomizing/slicing
    // let data = d3.shuffle(allData).slice(0, 35);
    let data = allData;

    //histogram binning
    const histogram = d3
      .histogram()
      .domain(y.domain())
      .thresholds(y.ticks(nbins))
      .value(function (d) {
        return d.bucket;
      });

    //binning data and filtering out empty bins
    const bins = histogram(data).filter((d) => d.length > 0);

    //g container for each bin
    let binContainer = svg.selectAll(".gBin").data(bins);

    binContainer.exit().remove();

    let binContainerEnter = binContainer
      .enter()
      .append("g")
      .attr("class", "gBin")
      .attr("transform", (d) => `translate(${margin.left - 30}, ${y(d.x0)})`);

    //need to populate the bin containers with data the first time
    binContainerEnter
      .selectAll("circle")
      .data((d) =>
        d.map((p, i) => {
          return {
            idx: i,
            name: p.station_name,
            value: p.bucket,
            income: p.median_household_income_census_block,
            belowMedian:
              p.median_household_income_census_block < medians["chicago"],
            radius: (y(d.x1) - y(d.x0)) / 3,
          };
        })
      )
      .enter()
      .append("circle")
      .attr("class", "enter")
      .attr("cy", 0) //g element already at correct x pos
      .attr("cx", function (d) {
        return d.idx * 2 * d.radius - d.radius;
      })
      .attr("fill", function (d) {
        console.log(d.belowMedian);
        return d.belowMedian ? "#f17720" : "#1fbad6";
      })
      .attr("r", 0)
      .on("mouseover", tooltipOn)
      .on("mouseout", tooltipOff)
      .transition()
      .duration(500)
      .attr("r", function (d) {
        return d.length == 0 ? 0 : d.radius;
      });

    binContainerEnter
      .merge(binContainer)
      .attr("transform", (d) => `translate(${margin.left - 30}, ${y(d.x0)})`);

    //enter/update/exit for circles, inside each container
    let dots = binContainer.selectAll("circle").data((d) =>
      d.map((p, i) => {
        return {
          idx: i,
          name: p.station_name,
          income: p.median_household_income_census_block,
          value: p.bucket,
          belowMedian: p.median_household_income_census_block < medians[p.city],
          radius: (y(d.x1) - y(d.x0)) / 2,
        };
      })
    );

    //EXIT old elements not present in data
    dots.exit().attr("class", "exit").transition(t).attr("r", 0).remove();

    //UPDATE old elements present in new data.
    dots.attr("class", "update");

    //ENTER new elements present in new data.
    dots
      .enter()
      .append("circle")
      .attr("class", "enter")
      .attr("cy", 0) //g element already at correct x pos
      .attr("cx", function (d) {
        return -d.idx * 2 * d.radius - d.radius;
      })
      .attr("r", 0)
      .attr("fill", function (d) {
        return d.belowMedian ? "#f17720" : "#1fbad6";
      })
      .merge(dots)
      .on("mouseover", tooltipOn)
      .on("mouseout", tooltipOff)
      .transition()
      .duration(500)
      .attr("r", function (d) {
        return d.length == 0 ? 0 : d.radius;
      });
  }); //d3.csv
  svg
    .append("text")
    .attr("x", margin.left + 150)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("text-decoration", "underline")
    .text(
      "[Chicago] Bike station vs population distribution over income brackets"
    );
  svg
    .append("text")
    .attr("x", margin.left + 150)
    .attr("y", height + 25)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(
      "Orange: below median; Blue: above median; Gray: Population distribution over income brackets"
    );
} //update

function tooltipOn(d) {
  //x position of parent g element
  let gParent = d3.select(this.parentElement);
  let translateValue = gParent.attr("transform");
  let gY = translateValue.split(",")[1].split(")")[0];
  let gX = +d3.select(this).attr("cx");

  d3.select(this).classed("selected", true);
  tooltip.transition().duration(200).style("opacity", 0.9);
  tooltip
    .html(d.name + "<br/> ($" + d.income + "/year)")
    .style("left", gX + "px")
    .style("top", gY + "px");
} //tooltipOn

function tooltipOff(d) {
  d3.select(this).classed("selected", false);
  tooltip.transition().duration(500).style("opacity", 0);
} //tooltipOff

// add x axis
svg
  .append("g")
  .attr("class", "axis axis--x")
  //   .attr("transform", "translate(0," + height + ")")
  .call(d3.axisLeft(y));

//draw everything
update();

//update with new data every 3sec
// d3.interval(function () {
//   update();
// }, 3000);
d3.select("#clickMe").on("click", function () {
  update();
});
