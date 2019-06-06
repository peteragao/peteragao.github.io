function initFifthSlideBar(dispatch){
  dispatch.on("load.bar_plot", function(data) {

    // bar plot dimensions
    margin = {top: 60, right: 0, bottom: 60, left: 300},
    width = 960 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

    // CAREFUL!! This defines a global so we can access it below
    barPlot = d3.select("#bar_pane").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      
    barPlot.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Destination Airport");  
    y = d3.scaleBand()
      .range([0, height])
      .padding(0.2);
    y_axis = d3.axisLeft(y);
    barPlot.append("g")
        .attr("class", "y_axis")
        .call(y_axis);
        
    barPlot.append("text")
      .attr("y", 0 + height + margin.top / 2)
      .attr("x", 0 + ((width - 300) / 2))
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text("Number of People on Deportation Flights");  
    x = d3.scaleLinear()
      .domain([0, 100000])
      .range([0, width]);
    x_axis = d3.axisBottom(x);

  });
  dispatch.on("update.bar_plot", function(filtered) {
    if (currentPort !== "") {
      // summarizes number of deportations across all years/nations
      var byDestPort = Array.from(d3.rollup(filtered, v => d3.sum(v, d => d.N), d => d.air2_AirportName))
        .sort(function(a, b) { return b[1] - a[1]; })
        .slice(0,5); // just pulls the top 5 destinations!

      var destPorts = byDestPort.map(d => d[0]);
      y.domain(destPorts);
      barPlot.selectAll(".y_axis")
        .call(d3.axisLeft(y));
      
      var bars = barPlot.selectAll(".bar")
        .data(byDestPort);
  
      bars.enter().append("rect")
        .attr("class", "bar")
        .attr("y", function(d) { return y(d[0]); })
        .attr("height", y.bandwidth())
        .attr("x", function(d) { return 0; })
        .attr("width", function(d) { return x(d[1]); })
        .attr("fill", 'red');
      bars.exit().remove();
      bars.attr("y", function(d) { return y(d[0]); })
        .attr("height", y.bandwidth())
        .attr("x", function(d) { return 0; })
        .attr("width", function(d) { return x(d[1]); })
        .attr("fill", 'red');
      
      barPlot.selectAll(".title").remove();
      var title = barPlot.append("text")
        .attr("class", "title")
        .attr("y", 0 - margin.top / 2 - 10)
        .attr("x", (width - 300)/ 2)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(currentPort);
    }
  });
}

