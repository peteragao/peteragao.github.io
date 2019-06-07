function initSecondSlideLine(dispatch, data) {
  // line plot dimensions
  var topRegion = d3.rollups(data, v => d3.sum(v, d => d.N), d => d.region)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0,8).map(d => d[0]);
  topRegion.push("Other");
  var colors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9'];
  var margin = {top: 60, right: 30, bottom: 60, left: 150}; 
  var width = 960 - margin.left - margin.right;
  var height = 550 - margin.top - margin.bottom;
  var linePlotContainer = d3.select("#secondSlideLine").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  var leftBar = linePlotContainer.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width / 2)
    .attr("height", height);
  var rightBar = linePlotContainer.append("g")
    .attr("transform", "translate(" + (margin.left + width / 2 + 30) + "," + margin.top + ")")
    .attr("width", width / 2)
    .attr("height", height);
    
  leftBar.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 2 * margin.left / 3)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .text("Number of passengers");  

  var y_AR = d3.scaleLinear()
    .domain([0, 100])
    .range([ height, 0 ]);
  leftBar.append("g")
    .attr("class", "y_axis")
    .call(d3.axisLeft(y_AR));
        // Add X axis --> it is a date format
  var x = d3.scaleTime()
    .domain([new Date(2010, 5, 1), new Date(2018, 7, 1)])
    .range([ 0, width / 2 - 25]);
  leftBar.append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
    
  var y_select = d3.scaleLinear()
    .range([ height, 0 ]);
  rightBar.append("g")
    .attr("class", "y_axis")
    .call(d3.axisLeft(y_select).ticks(0));
  rightBar.append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  dispatch.on("load.line_plot", function(data) {
    drawAllRegionsBar(data, leftBar, y_AR, topRegion, colors);
  });
  dispatch.on("update.line_plot", function(currentPort) {
    var filtered = data
      .filter(function(d) { return d.MissionYear > 2010 });
    if (currentPort !== "") {
      console.log(currentPort);
      var filtered = data
        .filter(function(d) { return (d.air_AirportName === currentPort || d.air2_AirportName === currentPort) })
        .filter(function(d) { return d.MissionYear > 2010 });
    } 
    console.log(filtered);
    leftBar.selectAll(".layer").remove();
    rightBar.selectAll(".layer").remove();
    drawAllRegionsBar(filtered, leftBar, y_AR, topRegion, colors);

    
 });
 
function drawAllRegionsBar(data, g, y, topRegion, colors) {
  var grouped = d3.rollup(data, v => d3.sum(v, d => d.N), d => d.topRegion, d => d.MissionYear);
  groupedReformat = [];
  topRegion.forEach(function (i) {
    for (j = 2011; j < 2019; j++) {
      if (grouped.get(i) === undefined || grouped.get(i).get(j) === undefined) {
        groupedReformat.push({rgn: i, yr: j, v: 0});
      } else {
        groupedReformat.push({rgn: i, yr: j, v: grouped.get(i).get(j)});
      }
    }
  });
  y.domain([0, d3.max(d3.rollups(data, v => d3.sum(v, d => d.N), d => d.MissionYear).map(d => d[1]))]);
  g.selectAll(".y_axis")
    .call(d3.axisLeft(y));

  var sumstat = d3.nest()
    .key(function(d) { return d.yr;})
    .entries(groupedReformat);
  var groupedStack = d3.stack()
    .keys([0,1,2,3,4,5,6,7,8])
    .value(function(d, key){
      return d.values[key].v;
    })
    (sumstat);
  groupedStack.forEach(function (d) {
    d.forEach(function (e) {
      e.rgn = topRegion[d.index];
    });
  });
  console.log(groupedStack);
  var tip = d3.tip()
    .attr('class', "d3-tip")
    .attr("opacity", 0.9)
    .style("color", "white")
    .style("background-color", "gray")
    .style("padding", "4px 6px")
    .style("border-radius", "2px")
    .style("font-size", "11px")
    .style("font-family", "Avenir Next")
    .offset([-6, 0])
    .html(function(d) {return `<i>${d.rgn} (${d.data.key}): ${d[1] - d[0]} flights</i>` });
  var layers = g.selectAll(".layer")
    .data(groupedStack)
    .enter().append("g")
    .attr("class", "layer")
    .style("fill", d => colors[d.key]);
  layers.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
    .attr("x", function(d) { return x(new Date(d.data.key, 0, 1)) - 20; })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .attr("width", 40)
    .attr("stroke", "#eee")
    .attr("stroke-width", 0.8)
    .on('mouseover', function(d) {
      tip.show(d, this);
      d3.select(this).style('opacity', 0.65);
     })
    .on('mouseout', function(d) {
      tip.hide();
      d3.select(this).style('opacity', 1);
    })
    .on('click', function(d) {
      drawRegionalBar(data, d.rgn, rightBar, y_select, colors[topRegion.indexOf(d.rgn)]);
    });
  layers.call(tip);
}

function drawRegionalBar(data, rgn, g, y, color) {
  g.selectAll(".layer").remove();
  var filtered = data
    .filter(function(d) { return (d.topRegion === rgn) });
  var byNation = d3.rollups(filtered, v => d3.sum(v, d => d.N), d => d.CountryOfCitizenship)
    .sort(function(a, b) { return b[1] - a[1]; });
  var byTopNation = byNation.slice(0,8);
  byTopNation.push(["Other", d3.sum(byNation.slice(8, byNation.length).map(d => d[1]))]);
  var topNation = byTopNation.map(d => d[0]);
  var grouped = d3.rollup(filtered, v => d3.sum(v, d => d.N), d => d.CountryOfCitizenship, d => d.MissionYear);
  groupedReformat = [];

  topNation.forEach(function (i) {
    for (j = 2011; j < 2019; j++) {
      if (grouped.get(i) === undefined || grouped.get(i).get(j) === undefined) {
        groupedReformat.push({coc: i, yr: j, v: 0});
      } else {
        groupedReformat.push({coc: i, yr: j, v: grouped.get(i).get(j)});
      }
    }
  });
  y.domain([0, d3.max(d3.rollups(filtered, v => d3.sum(v, d => d.N), d => d.MissionYear).map(d => d[1]))]);
  g.selectAll(".y_axis")
    .call(d3.axisLeft(y));

  var sumstat = d3.nest()
    .key(function(d) { return d.yr;})
    .entries(groupedReformat);
  console.log(sumstat);
  var groupedStack = d3.stack()
    .keys(topNation.map(function (d, i) { return i;}))
    .value(function(d, key){
      return d.values[key].v;
    })
    (sumstat);
  console.log(groupedStack);
  groupedStack.forEach(function (d) {
    d.forEach(function (e) {
      console.log(topNation[d.index]);
      e.coc = topNation[d.index];
    });
  });
  console.log(groupedStack);
  var tip = d3.tip()
    .attr('class', "d3-tip")
    .attr("opacity", 0.9)
    .style("color", "white")
    .style("background-color", "gray")
    .style("padding", "4px 6px")
    .style("border-radius", "2px")
    .style("font-size", "11px")
    .style("font-family", "Avenir Next")
    .offset([-6, 0])
    .html(function(d) {return `<i>${d.coc} (${d.data.key}): ${d[1] - d[0]} flights</i>` });
  var layers = g.selectAll(".layer")
    .data(groupedStack)
    .enter().append("g")
    .attr("class", "layer")
    .style("fill", color)
    .attr('opacity', function(d, i) {return (7 - i) / 10});
  layers.selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
    .attr("x", function(d) { return x(new Date(d.data.key, 0, 1)) - 20; })
    .attr("y", function(d) { return y(d[1]); })
    .attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .attr("width", 40)
    .attr("stroke", "#eee")
    .attr("stroke-width", 0.8)
    .on('mouseover', function(d) {
      tip.show(d, this);
      d3.select(this).style('opacity', 0.65);
     })
    .on('mouseout', function(d) {
      tip.hide();
      d3.select(this).style('opacity', 1);
    });
  layers.call(tip);

}
 
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
