function initFirstSlideMap(us, ports, edges, dispatch) {
  var proj = d3.geoAlbersUsa().scale(960).translate([360, 225]);
  var path = d3.geoPath().projection(proj);
  var figDims = ({x: 1150, y: 600});
  var mapDims = ({x: 720, y: 450});
  var barDims = ({x: 430, y: 550});
  var barMargin = {top: 80, right: 20, bottom: 100, left: 150}; 
  var mapContainer = d3.select( "#firstSlideMap")
    .append("svg")
    .attr("width", figDims.x)
    .attr("height", figDims.y);
  var margin = {top: 60, right: 0, bottom: 90, left: 430}; 
  var map = mapContainer.append("g")
    .attr("fill", "#ddd")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var mapMouseover = mapContainer.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var mapPorts = mapContainer.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var mapIntPorts = mapContainer.append("g")
    .attr("fill", "#ddd")
    .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")");
  mapContainer.append("text")
    .attr("x", 210)
    .attr("y", 40)
    .attr('font-size', '18')
    .text("International Flights");
  mapContainer.append("text")
    .attr("x", 720)
    .attr("y", 40)
    .attr('font-size', '18')
    .text("Domestic Flights");
    
  // first, deal with US destinations
  let edgesUS = edges
    .filter(function(d) { return proj([d.tgt.lon, d.tgt.lat]) !== null })
    .filter(function(d) { return d.src.x > 28})
    .filter(function(d) { return d.src.country === "USA" })
    .filter(function(d) { return d.tgt.country === "USA" });
  let edgesInt = edges
    .filter(function(d) { return d.tgt.country !== "USA" });
  let edgesIntCountry = d3.rollup(edgesInt, v => d3.sum(v, d => d.N), d => d.src, d => d.tgt.country);
  drawUS(us, map, path, proj);
  //drawFlightPathsUS(edgesUS, map, proj);

  drawPortsUS(ports, edgesUS, mapPorts, mapMouseover, proj);
  
  // BAR PLOT SETUP
  let y = d3.scaleBand()
    .range([0, barDims.y - barMargin.top - barMargin.bottom])
    .padding(0.2);
  let y_axis = d3.axisLeft(y);
  mapIntPorts.append("g")
    .attr("class", "y_axis")
    .call(y_axis);
  let x = d3.scaleLinear()
      .range([0, barDims.x - barMargin.left - barMargin.right]);
  let x_axis = d3.axisBottom(x).ticks(0);
  mapIntPorts.append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(0," + (barDims.y - barMargin.top - barMargin.bottom) + ")")
    .call(x_axis);
  mapIntPorts.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 10 - barMargin.left )
      .attr("x", 0 - (barDims.y / 3))
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Destination Country")
      .attr("fill", "#000"); 
  mapIntPorts.append("text")
      .attr("y", 0 + barDims.y - barMargin.top - barMargin.bottom/2)
      .attr("x", 0 + ((barDims.x - barMargin.left - barMargin.right) / 2))
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Number of Deportation Flights")
      .attr("fill", "#000"); 
    
  // LEGEND SETUP
  let legend = mapMouseover.append("g")
    .attr("transform", "translate(460,0)");
  legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", "#fc8d59");
  legend.append("rect")
    .attr("x", 0)
    .attr("y", 20)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", '#91bfdb');
  legend.append("text")
    .attr("x", 22)
    .attr("y", 12)
    .attr('font-size', '12')
    .text("departing selected airport");
  legend.append("text")
    .attr("x", 22)
    .attr("y", 32)
    .attr('font-size', '12')
    .text("arriving at selected airport");
  dispatch.on("load.flights_plot", function(data) {
  
  });
  dispatch.on("update.flights_plot", function(currentPort) {
    updateBarPlot(edges, currentPort, mapIntPorts, x, y);
    map.selectAll("line.edge")
      .remove();
    mapPorts.selectAll("circle.port")
      .attr('fill', d =>(d.port === currentPort ? '#ffec5e' : "#555"));
    redrawFlightPaths(edgesUS, currentPort, map, proj);
    
  });
}

function drawUS(data, map, path, proj){
  // add states
  map.selectAll("path")
    .data(topojson.feature(data, data.objects.usa).features)
    .enter().append("path")
    .attr("d", path)
    .attr("stroke", 'white')
    .attr("stroke-width", 0.75);
}

function drawPortsUS(data, edges, map, map2, proj){ 
  var defaultColor = "#555";
  
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
    .html(function(d) { return `<i>${d.port}</i>` });
  
  map.selectAll("circle")
    .data(data)
    .enter().append('circle')
    .attr("class", "port")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => 4.5)
    .attr('opacity', '.5')
    .attr('fill', defaultColor)
    .on('mouseover', function(d) {
      redrawFlightPaths(edges, d.port, map2, proj);
      $('.input_airport_name').val(d.port);
      tip.show(d, this);
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function(d) {
      tip.hide();
      map2.selectAll("line.edge")
        .remove();
      $('.input_airport_name').val(currentPort);
      d3.select(this).style('opacity', ".5");
      /*d3.select(this)
        .filter(function (d) {
          return d.port !== currentPort })
        .style('fill', defaultColor);*/
    });
  map2.call(tip);
}

// process airport and flight data
function drawFlightPathsUS(edges, map, proj) {
  
  map.selectAll("line")
    .data(edges)
    .enter().append('line')
    .attr("class", "edge")
    .attr("x1", d => d.src.x)
    .attr("y1", d => d.src.y)
    .attr("x2", d => d.tgt.x)
    .attr("y2", d => d.tgt.y)
    .attr("stroke-width", d => 0.75)
    .attr("stroke", "#4c93ff")
    .attr("opacity", 0.5);
    
}

// process airport and flight data
function redrawFlightPaths(edges, port, map, proj) {
  var colors = ['#fc8d59','#91bfdb'];
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
    .html(function(d) { return `<i>${d.src.city} to ${d.tgt.city}: ${d.N} flights</i>` });
  if (port !== "") {
    let edgesFiltered = edges
      .filter(function(d) { return d.src.port === port || d.tgt.port === port });
    edgesFiltered
      .forEach( function (d) { d.colorKey = (d.src.port === port ? 0 : 1)});
    map.selectAll("line")
      .data(edgesFiltered)
      .enter().append('line')
      .attr("class", "edge")
      .attr("x1", d => d.src.x + (d.src.port === port ? -1 : 2))
      .attr("y1", d => d.src.y + (d.src.port === port ? -1 : 2))
      .attr("x2", d => d.tgt.x + (d.src.port === port ? -1 : 2))
      .attr("y2", d => d.tgt.y + (d.src.port === port ? -1 : 2))
      .attr("stroke-width", 3)
      .attr("stroke", d => colors[d.colorKey])
      .attr("opacity", 0.85)
      .on('mouseover', function(d) {
        tip.show(d, this);
      })
      .on('mouseout', function(d) {
        tip.hide();
      });
  map.call(tip);
      
  }
}

function updateBarPlot(edges, port, g, x, y) {
  //if (port !== "") {
    let edgesFiltered = edges
      .filter(function(d) { return d.src.port === port });
    
    let byNation = d3.rollups(edgesFiltered, v => d3.sum(v, d => d.N), d => d.tgt.country)
      .filter(d => d[0] !== "USA")
      .sort(function(a, b) { return b[1] - a[1]; });
    let byNationSliced = byNation.slice(0, 8);
    if (d3.sum(byNation.slice(9, byNation.length).map(d => d[1])) > 0) {
      byNationSliced.push(["Other", d3.sum(byNation.slice(9, byNation.length).map(d => d[1]))]);
    }
    y.domain(byNationSliced.map(d => d[0]));
    g.selectAll(".y_axis")
        .call(d3.axisLeft(y));
    x.domain([0, d3.max(byNationSliced.map(d => d[1]))]);
    g.selectAll(".x_axis")
        .call(d3.axisBottom(x).ticks(5));
    var bars = g.selectAll(".bar")
        .data(byNationSliced);
  
    bars.enter().append("rect")
      .attr("class", "bar")
      .attr("y", function(d) { return y(d[0]); })
      .attr("height", y.bandwidth())
      .attr("x", function(d) { return 0; })
      .attr("width", function(d) { return x(d[1]); })
      .attr("fill", '#fc8d59');
    bars.exit().remove();
    bars.attr("y", function(d) { return y(d[0]); })
      .attr("height", y.bandwidth())
      .attr("x", function(d) { return 0; })
      .attr("width", function(d) { return x(d[1]); })
      .attr("fill", '#fc8d59');
 // } else {


}
