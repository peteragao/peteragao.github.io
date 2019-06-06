function initThirdSlideLine(dispatch, data) {
  // line plot dimensions
  var colors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9'];
  var margin = {top: 60, right: 30, bottom: 60, left: 150}; 
  var width = 960 - margin.left - margin.right;
  var height = 550 - margin.top - margin.bottom;
  var linePlotContainer = d3.select("#thirdSlideLine").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  var linePlot = linePlotContainer.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width)
    .attr("height", height);
    
  linePlot.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 2 * margin.left / 3)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .text("Number of deportees");  
  function value(d, key) {
    return d[key];
  }  
  var grouped = d3.rollups(data, v => d3.sum(v, d => d.N), d => d.topRegion, d => d.MissionYear);
  console.log(grouped);
  groupedReformat = [];
  grouped.forEach(function(d) {
    d[1].forEach(function(e) {
      groupedReformat.push({rgn: d[0], yr: e[0], v: e[1]});
    });
  });
  
  var sumstat = d3.nest()
    .key(function(d) { return d.yr;})
    .entries(groupedReformat);
  console.log(sumstat);
  var groupedStack = d3.stack()
    .keys([0,1,2,3,4,5,6,7,8])
    .value(function(d, key){
      return d.values[key].v;
    })
    (sumstat);
  console.log(groupedStack);
  
    // Add X axis --> it is a date format
  var x = d3.scaleTime()
    .domain([new Date(2010, 0, 1), new Date(2018, 0, 1)])
    .range([ 0, width ]);
  linePlot.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5));

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, 1.2*d3.max(grouped.map(d => d3.max(d[1].map(e => e[1]))))])
    .range([ height, 0 ]);
  linePlot.append("g")
    .call(d3.axisLeft(y));
  console.log(groupedStack);
  linePlot
    .selectAll("layers")
    .data(groupedStack)
    .enter()
    .append("path")
      .attr("fill", d => colors[d.key])
      .attr("d", d3.area()
        .x(function(d, i) { return x(new Date(d.data.key, 0, 1)); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
      );

 
/*  dispatch.on("load.line_plot", function(data) {
    var byYear= Array.from(d3.rollup(data, v => d3.sum(v, d => d.N), d => d.MissionYear));
    var line = d3.line()
      .x(function(d) { return x(new Date(d[0], 0, 1)); }) // set the x values for the line generator
      .y(function(d) { return y(d[1]); });
    linePlot.append("path")
      .attr("class", "line") // Assign a class for styling 
      .attr("d", line(byYear));
  });
  dispatch.on("update.line_plot", function(filtered) {
    // summarizes number of deportations of selected nation across all years
    // not sure how to do this step
    var byYear= Array.from(d3.rollup(filtered, v => d3.sum(v, d => d.N), d => d.MissionYear));
    linePlot.selectAll("path")
      .remove();
    var line = d3.line()
      .x(function(d) { return x(new Date(d[0], 0, 1)); }) // set the x values for the line generator
      .y(function(d) { return y(d[1]); });
    linePlot.append("path")
      .attr("class", "line") // Assign a class for styling 
      .attr("d", line(byYear));

 });*/
}
