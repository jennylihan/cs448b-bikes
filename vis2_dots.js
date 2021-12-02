//SVG setup
const margin = { top: 40, right: 30, bottom: 30, left: 50 },
  width = 1600 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

//x scales
const y = d3.scaleLinear().rangeRound([0, height]).domain([0, 17]);

const medians = { chicago: 58247 };
const buckets = {
  1: 67,
  2: 40,
  3: 32,
  4: 39,
  5: 34,
  6: 37,
  7: 28,
  8: 28,
  9: 24,
  10: 48,
  11: 66,
  12: 84,
  13: 67,
  14: 48,
  15: 59,
  16: 78,
};
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

//number of bins for histogram
const nbins = 16;

//Note: data fetching is done each time the function is ran
//as d3.csv is replaced by tabletop.js request to get data each time
//from google spreadsheet
function update() {
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
        return d.belowMedian ? "#edca3a" : "#1fbad6";
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
        return d.belowMedian ? "#edca3a" : "#1fbad6";
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
