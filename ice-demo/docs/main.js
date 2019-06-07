/* 
This script calls the main plotting functions.
*/

function main() {
  
  // CHANGE THESE TO SWITCH PROJECTION
  var us = d3.json("https://peteragao.github.io/space-time/usa_map.json");
  var regionsMap = d3.json("https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-region-in-world.json");
  var proj = d3.geoAlbersUsa().scale(960).translate([360, 225]);
  var path = d3.geoPath();
  
  // Load summarized flights dataset
  var ports = d3.json("https://peteragao.github.io/space-time/ICE_airports.json");
  var edges = d3.json("https://peteragao.github.io/space-time/ICE_flights_agg.json");
  
  var flights = d3.json("https://peteragao.github.io/space-time/ice-air-by-airport.json");

  // CAUTION: I've initialized some globals here which is probably not optimal
  currentPort = "";
  currentNation = " ";
  
  async function asyncRun() {
    
    dispatch = d3.dispatch("load", "update");
    let portsCleaned = cleanPorts(await ports, proj);
    
    // adds information in place
    let edgesCleaned = cleanEdges(await edges, await ports, proj);
    
    initFirstSlideMap(await us, await portsCleaned, await edges, dispatch);
    
    // get list of unique departure airports
    var portList = Array.from(new Set(portsCleaned.map(d => d.port)));
    // for autocomplete, add city/state
    acPortList = Array.from(new Set(portsCleaned.map(d => d.port + " (" + d.city + ", " + d.state + ")")));

    let flightsCleaned = cleanFlights(await flights, await regionsMap, portList);
    // get list of unique citizenship nations
    var nationList = Array.from(new Set(flightsCleaned.map(d => d.CountryOfCitizenship)))
      .sort();
    // add null option
    nationList.unshift(" ");
    // Load dispatch methods
    initSecondSlideLine(dispatch, await flightsCleaned);
    
    // Load plots
    dispatch.call("load", this, await flightsCleaned);

    // initialize interactive capabilities
    listenPort(dispatch, await flightsCleaned, await portList);
    listenNation(dispatch, await flightsCleaned, await nationList);
  }
  asyncRun();
}
// This function removes airports that are not in the US and projects coordinates
function cleanPorts(ports, proj) {
  let cleanedPorts = ports
    .filter(function(d) { return proj([d.lon, d.lat]) !== null })
    .filter(function(d) { return d.country === "USA" });
  cleanedPorts.forEach(function(port) {
    port.x = proj([port.lon, port.lat])[0];
    port.y = proj([port.lon, port.lat])[1];
  });
  return cleanedPorts;
}

// This function adds airport information to edges
function cleanEdges(edges, ports, proj) {
  let portLookup = new Map(ports.map(d => [d.port, d]));
  edges.forEach(function(edge) {
    edge.src = portLookup.get(edge.air_AirportName);
    edge.tgt = portLookup.get(edge.air2_AirportName);
  });
  let edgesCleaned = edges
    .filter(function(d) { return d.src.x > 28});
  return edgesCleaned;
}

// This function removes flights leaving from airports that are not in the US
function cleanFlights(flights, regionsMap, portList) {
  let nations = regionsMap.map(d => d.country);
  let regions = regionsMap.map(d => d.location);
  let cleaned = flights
    .filter(function(d) { return portList.indexOf(d.air_AirportName) !== -1 });

  cleaned.forEach(function(flight) {
    if (nations.indexOf(flight.CountryOfCitizenship) !== -1) {
      flight.region = regions[nations.indexOf(flight.CountryOfCitizenship)];
    } else {
      flight.region = "Other";
    }
  });
  let byRegion = d3.rollups(flights, v => d3.sum(v, d => d.N), d => d.region)
    .sort(function(a, b) { return b[1] - a[1]; })
    .slice(0,8);
  let topRegion = byRegion.map(d => d[0]);
  cleaned.forEach(function(flight) {
    if (topRegion.indexOf(flight.region) !== -1) {
      flight.topRegion = flight.region;
    } else {
      flight.topRegion = "Other";
    }
  });
  return cleaned;
}




// This function filters flights to match selected airport/nation
function filterFlights(flights, port, nation) {

  let filtered = flights;
  if (port !== "") {
    let temp = filtered.filter(function (d) { return d.air_AirportName === port });
    filtered = temp;
  }
  if (nation !== " ") {
    let temp = filtered.filter(function (d) { return d.CountryOfCitizenship === nation });
    filtered = temp;
  }
  return filtered;
}

// This function sets up interactive capabilities for changing the
// selected departure airport
function listenPort(dispatch, cleaned, portList) {    
  // use Jquery autocomplete
  $( ".input_airport_name" ).autocomplete({
    source: acPortList
  });
      
  // submit airport by return
  $(".input_airport_name").keyup(function (e) {
    if (e.keyCode == 13) {
      // weird behavior -- beware
      if (acPortList.indexOf($(this).val()) !== -1) {
        let newPort = portList[acPortList.indexOf($(this).val())];
        $('.input_airport_name').val(newPort);
        updatePort(cleaned, newPort);
      }
    }
  });
  
  // needs fix
  d3.selectAll(".airport_submit")
    .on("click",  function(d) {
      if (acPortList.indexOf($(this).siblings('.input_airport_name').val()) !== -1) {
        let newPort = portList[acPortList.indexOf($(this).siblings('.input_airport_name').val())];
        $('.input_airport_name').val(newPort);
        return updatePort(cleaned, newPort);
      } else if (portList.indexOf($(this).siblings('.input_airport_name').val()) !== -1) {
        let newPort = portList[portList.indexOf($(this).siblings('.input_airport_name').val())];
        $('.input_airport_name').val(newPort);
        return updatePort(cleaned, newPort);
      }
    });
      
  d3.selectAll("circle.port")
    .on("click", function(d) {
      $('.input_airport_name').val(d.port);
      return updatePort(cleaned, d.port);
    });
    
  d3.selectAll("#airport_clear")
    .on("click", function () {
      $(".input_airport_name").val("");
      return updatePort(cleaned, "");
    });
    
}

// This function sets up interactive capabilities for changing the
// selected nation
function listenNation(dispatch, cleaned, nationList) {  
  
  var dropdownChange = function() {
    selected = d3.select(this).property('value');
    updateNation(cleaned, selected);
    $(".nation_dd").val(currentNation);
  };
  
  var dropdown = d3.selectAll(".nation_select_pane")
    .insert("select")
    .attr("class", "nation_dd")
    .on("change", dropdownChange);
  dropdown.selectAll("option")
    .data(nationList)
    .enter().append("option")
    .attr("value", function (d) { return d; })
    .text(d => d);
  d3.selectAll("#nation_clear")
    .on("click", function () {
      $(".nation_dd").val(" ");
      return updateNation(cleaned, " ");
    });
}

// These functions call filterFlights to subset our data 
// according to the selected departure airport/nation
function updatePort(cleaned, port) {
  currentPort = port;
  let filtered = filterFlights(cleaned, port, currentNation);
  dispatch.call("update", this, currentPort);
}
function updateNation(cleaned, nation) {
  currentNation = nation;
  let filtered = filterFlights(cleaned, currentPort, nation);
  dispatch.call("update", this, currentNation);
}


// call main
main();

/*
TO DO:
Tooltips
colors
Titles
fonts
update points by nation
shrink
*/

