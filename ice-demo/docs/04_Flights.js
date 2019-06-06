function initFourthSlideFlights(dispatch, data, us, path, proj) {
  var fourthSlideMap = drawUS(us, path, proj, "#fourthSlideFlights");
  drawPorts(data, fourthSlideMap, proj);
  
  dispatch.on("load.flights_plot", function(data) {
    
  });
  dispatch.on("update.flights_plot", function(filtered) {
    if (currentPort !== "") {
      fourthSlideMap.selectAll("line").remove();
      drawFlights(filtered, fourthSlideMap, proj);
    }
  });
}
/*

function drawFlights(data, plot, proj){
	// Group by destination(target) airport name, lat, long to sum up total flights
	var destinations = d3.nest()
	  .key(function(d) { return d.air2_AirportName; })
	  .key(function(d) { return d.air2_Longitude; })
	  .key(function(d) { return d.air2_Latitude; })
	  .rollup(function(v) { return {"tot_flight": d3.sum(v, function(d) { return d.N;}) } })
	  .map(data, d3.map);

	
	// Rearrange output of rollup to easily order and access target airport data
	var targets = [];
	destinations.entries().map(function(airport) {
		return airport.value.entries().map(function(airport_long) {
			return airport_long.value.entries().map(function(airport_lat) {
				targets.push( {
				  'name': airport.key,
			      'air_Latitude': parseFloat(airport_lat.key),
			      'air_Longitude': parseFloat(airport_long.key),
			      'volume': airport_lat.value.tot_flight
			    });
			});
		});
	});
	
	// Sort target airports in decreasing order and select top 5
	targets.sort((a, b) => (a.volume < b.volume) ? 1 : -1);
	
	// This function removes flights going to airports that are not in the US
	targets_domestic = cleanFlights(targets, proj);
	
	// Source airport data
	var source = {'name': data[0].air_AirportName,
					'air_Longitude': data[0].air_Longitude,
					'air_Latitude': data[0].air_Latitude};
	
	plot.selectAll("line")
    .data(targets_domestic)
    .enter().append('line')
    .attr("x1", proj([source.air_Longitude, source.air_Latitude])[0])
    .attr("y1", proj([source.air_Longitude, source.air_Latitude])[1])
    .attr("x2", d => proj([d.air_Longitude, d.air_Latitude])[0])
    .attr("y2", d => proj([d.air_Longitude, d.air_Latitude])[1])
    .attr("stroke-width", 2)
    .attr("stroke", "#555")
    .attr("opacity", 0.8);
}
*/