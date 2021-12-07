// https://bl.ocks.org/tlfrd/187e45e0629711c4560cf6bcd0767b27
var margin = { top: 40, right: 50, bottom: 60, left: 50 };
var totalWidth = 5000;
var width = 600 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

var income = {
  sf: [0, 33960, 83662.06, 145059.21, 244014.33, -1],
  chi: [0, 21943, 46173, 79736, 135366, -1],
};

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", 5000)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Config
var cfg = {
  labelMargin: 5,
  xAxisMargin: 10,
  legendRightMargin: 0,
};

var x = d3.scaleLinear().range([0, width]);

var colour = d3.scaleSequential(d3.interpolatePRGn);

var y = d3.scaleBand().range([height, 0]).padding(0.1);

function parse(d) {
  d.rank = +d.rank;
  d.annual_growth = +d.annual_growth;
  d.city_bucket = d.city_bucket;
  return d;
}

var legend = svg.append("g").attr("class", "legend");

// legend
//   .append("text")
//   .attr("x", width - cfg.legendRightMargin)
//   .attr("y", height - 2 * cfg.legendRightMargin)
//   .attr("text-anchor", "end")
//   .text("How well are bike stations distributed");

legend
  .append("text")
  .attr("x", width / 2)
  .attr("text-anchor", "end")
  .text("Balanced");

legend
  .append("text")
  .attr("x", 120)
  .attr("text-anchor", "end")
  .text("Not enough stations");

legend
  .append("text")
  .attr("x", width - cfg.legendRightMargin)
  .attr("text-anchor", "end")
  .text("More than enough stations");

// legend
//   .append("text")
//   .attr("x", width - cfg.legendRightMargin)
//   .attr("y", 20)
//   .attr("text-anchor", "end")
//   .style("opacity", 0.5)
//   .text("across income levels? (%)");

d3.csv("popgrowth.csv", parse, function (error, data) {
  if (error) throw error;

  y.domain(
    data.map(function (d) {
      return d.city_bucket;
    })
  );
  x.domain(
    d3.extent(data, function (d) {
      return d.annual_growth;
    })
  );

  var max = d3.max(data, function (d) {
    return d.annual_growth;
  });
  colour.domain([-max, max]);

  var yAxis = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + x(0) + ",0)")
    .append("line")
    .attr("y1", 0)
    .attr("y2", height);

  var xAxis = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + (height + cfg.xAxisMargin) + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

  var bars = svg.append("g").attr("class", "bars");

  bars
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "annual-growth")
    .attr("x", function (d) {
      return x(Math.min(0, d.annual_growth));
    })
    .attr("y", function (d) {
      return y(d.city_bucket);
    })
    .attr("height", function (d) {
      console.log(d.city_bucket.split(" ")[1] == "percentile");
      if (d.city_bucket.split(" ")[1] == "percentile") return 5 * y.bandwidth();
      else return y.bandwidth();
    })
    .attr("width", function (d) {
      return Math.abs(x(d.annual_growth) - x(0));
    })
    // .style("fill", function (d) {
    //   return colour(d.annual_growth);
    // });
    .style("fill", function (d) {
      return colorCity(d.city_bucket);
    })
    .on("mouseover", function (d) {
      //Handle 'mouseover' events
      svg
        .append("text")
        // .append("rect") //Append SVG 'text' element.
        .attr("class", "description")

        // .text(event.city_bucket)
        // .attr("x", function (d) {
        //   return width;
        // })
        // .attr("y", function (d) {
        //   return 30;
        // })
        // .attr("height", 2000)
        // .attr("width", 5000)
        // .style("fill", "black")
        // .attr("opacity", 0.1)
        .text(firstSentence(d.city_bucket))
        .attr("x", width + 2 * margin.right)
        .attr("y", margin.top);

      svg
        .append("text")
        // .append("rect") //Append SVG 'text' element.
        .attr("class", "description")
        .text("The current number of bike stations:")
        .attr("x", width + 2 * margin.right)
        .attr("y", margin.top + 100);

      for (i = 0; i < 3; i += 1) {
        svg
          .append("circle")
          .attr("class", "description")
          .attr("cy", margin.top + 125) //g element already at correct x pos
          .attr("cx", width + 2 * margin.right + i * 15)
          // .attr("cx", function (d) {
          //   return -d.idx * 2 * d.radius - d.radius;
          // })
          .attr("r", 5)
          .attr("fill", "#f17720")
          .transition()
          .duration(500);
      }
    })
    .on("mouseout", function (event, d) {
      svg.selectAll(".description").remove(); // Remove all ptLabels
    });
  var labels = svg.append("g").attr("class", "labels");

  function firstSentence(city_bucket) {
    let city = splitName(city_bucket);
    let start_num = 0;
    let end_num = splitBucket(city_bucket);
    return (
      "1 in 5 households in " +
      city +
      " make between $" +
      start_num +
      " and $" +
      end_num +
      " a year."
    );
  }

  function splitBucket(city_bucket) {
    let cityname = city_bucket.split("_")[0];
    let bucket = city_bucket.split("_")[0];
    let index = 0;
    switch (bucket) {
      case "20":
        index = 0;
      case "40":
        index = 1;
      case "60":
        index = 2;
      case "80":
        index = 3;
      case "100":
        index = 4;
    }
    return income[cityname][index];
  }

  function splitName(city_bucket) {
    let cityname = city_bucket.split("_")[0];
    switch (cityname) {
      case "sf":
        return "San Francisco";
      case "chi":
        // code block
        return "Chicago";
      default:
        // code block
        return "CITY";
    }
  }
  function colorCity(city_bucket) {
    if (!city_bucket) {
      return "#4EA25A";
    }
    let cityname = city_bucket.split("_")[0];
    // console.log(cityname);

    switch (cityname) {
      case "sf":
        return "#9260A2";
      case "chi":
        // code block
        return "#4EA25A";
      default:
        // code block
        return "#4EA25A";
    }
  }

  labels
    .selectAll("text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", x(0))
    .attr("y", function (d) {
      return y(d.city_bucket);
    })
    .attr("dx", function (d) {
      return d.annual_growth < 0 ? cfg.labelMargin : -cfg.labelMargin;
    })
    .attr("dy", y.bandwidth())
    .attr("text-anchor", function (d) {
      return d.annual_growth < 0 ? "start" : "end";
    })
    .text(function (d) {
      return d.city_bucket;
    })
    .style("fill", function (d) {
      if (d.city_bucket == "European Union") {
        return "blue";
      }
    });
});
