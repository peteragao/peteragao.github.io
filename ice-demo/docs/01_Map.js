function initFirstSlideMap(us, ports, edges, dispatch) {
  var proj = d3.geoAlbersUsa().scale(960).translate([360, 225]);
  var path = d3.geoPath().projection(proj);
  var figDims = ({x: 1000, y: 800});
  var mapDims = ({x: 720, y: 450});
  var mapContainer = d3.select( "#firstSlideMap")
    .append("svg")
    .attr("width", mapDims.x)
    .attr("height", mapDims.y);
  
  var map = mapContainer.append("g")
    .attr("fill", "#ddd");
  var mapMouseover = mapContainer.append("g");
  var mapPorts = mapContainer.append("g");
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
  
  dispatch.on("load.flights_plot", function(data) {
    
  });
  dispatch.on("update.flights_plot", function(currentPort) {
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
      //d3.select(this).style('fill', '#ffec5e');
      console.log(d.port);
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
    console.log(edgesFiltered);
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
