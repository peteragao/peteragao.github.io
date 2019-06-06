function initSecondSlideSummary(dispatch, data) {
  // plot dimensions
  var margin = {top: 60, right: 0, bottom: 0, left: 60};
  var width = 1200 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;
  var subMargin = {top: 40, right: 80, bottom: 40, left: 80};
  var subWidth = width - subMargin.left - subMargin.right;
  var subHeight = height - subMargin.top - subMargin.bottom - height / 4;
  var barHeight = 35;
  var barMargin = {top: 60, right: 100, bottom: 60, left: 60};
  var subBarWidth = subWidth - barMargin.left - barMargin.right;
  
  var byDeptPort = Array.from(d3.rollup(data, v => d3.sum(v, d => d.N), d => d.air_AirportName));
  var total =  d3.sum(byDeptPort.map(d => d[1]));
  
  var sexColors = ['#fbb4ae','#b3cde3','#ccebc5','#decbe4'];
  var ageColors = ['#b3e2cd','#fdcdac','#cbd5e8'];
  var cocColors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69'];
  // CAREFUL!! This defines a global so we can access it below
  var summaryContainer  = d3.select("#secondSlideSummary").append("svg")
    .attr("id", "summaryContainer")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  var totalSummary  = summaryContainer.append("g")
    .attr("id", "totalSummary")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height / 4);
  var subSummary  = summaryContainer.append("g")
    .attr("id", "subSummary")
    .attr('transform', `translate(${subMargin.left}, ${subMargin.top + height / 4})`)
    .attr("width", subWidth)
    .attr("height", subHeight + barMargin.height);
  subSummary.append("rect")
    .attr("width", subWidth - barMargin.left)
    .attr("height", subHeight + barMargin.bottom)
    .attr("fill", "#eee");
  subSummary.append("text")
    .attr("id", "subTitle")
    .attr("x", 0)
    .attr("y", 0 - 10)
    .text("Demographics for individuals on all deportation flights from 2010 to 2018:")
    .attr("font-size", "16px");
  x_total = d3.scaleLinear()
    .domain([0, total])
    .range([0, width - barMargin.left - barMargin.right]);
  dispatch.on("load.secondSlideSummary", function(data) {

    totalSummary.append("rect")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("width", function(d) { return x_total(total); })
      .attr("height", barHeight)
      .attr('fill', "#555");
    totalSummary.append("text")
      .attr("id", "s2_total_subtext")
      .attr("text-anchor", "end")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("x", width - barMargin.left - barMargin.right )
      .attr("y", barHeight + 12)
      .text(total + " of " + total + " total deportation flights")
      .style("text-align", "right")
      .attr("font-size", "10px");

    var sexSummary = subSummary.append("g")
      .attr("id", "sexSummary")
      .attr('transform', `translate(0, 0)`)
      .attr("width", subWidth)
      .attr("height", subHeight / 3);
    sexSummary.append("text")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("x", 0)
      .attr("y", 0 - 10)
      .text("Sex:")
      .attr("font-size", "12px");

    var ageSummary = subSummary.append("g")
      .attr('transform', `translate(0, ${subHeight / 3 })`)
      .attr("id", "ageSummary")
      .attr("width", subWidth)
      .attr("height", subHeight / 3);
    ageSummary.append("text")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("x", 0)
      .attr("y", 0 - 10)
      .text("Juvenile:")
      .attr("font-size", "12px");

    var CoCSummary = subSummary.append("g")
      .attr("id", "CoCSummary")
      .attr('transform', `translate(0, ${subHeight / 3 * 2})`)
      .attr("width", subWidth)
      .attr("height", subHeight / 3);
    CoCSummary.append("text")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("x", 0)
      .attr("y", 0 - 10)
      .text("Country of Citizenship:")
      .attr("font-size", "12px");
    var bySex = Array.from(d3.rollup(data, v => d3.sum(v, d => d.N), d => d.Sex))
      .sort(function(a, b) { return b[1] - a[1]; });
    var byAge = Array.from(d3.rollup(data, v => d3.sum(v, d => d.N), d => d.Juvenile))
      .sort(function(a, b) { return b[1] - a[1]; });
    var byCoC = Array.from(d3.rollup(data, v => d3.sum(v, d => d.N), d => d.CountryOfCitizenship))
      .sort(function(a, b) { return b[1] - a[1]; });      
    var byCoCClipped = byCoC.slice(0,6);
    var totalPort =  d3.sum(bySex.map(d => d[1]));
    var x_sub_total = d3.scaleLinear()
        .domain([0, total])
        .range([0, subBarWidth]);
    byCoCClipped.push(["Other", d3.sum(byCoC.map(d => d[1])) - d3.sum(byCoC.slice(0,6).map(d => d[1]))]);
    drawSummaryBar(bySex, d3.select("#sexSummary"), x_sub_total, sexColors);
    drawSummaryBar(byAge, d3.select("#ageSummary"), x_sub_total, ageColors);
    drawSummaryBar(byCoCClipped, d3.select("#CoCSummary"), x_sub_total, cocColors);
  });
  dispatch.on("update.secondSlideSummary", function(filtered) {
    d3.select("#subTitle")
      .text("Demographics for all flights leaving " + currentPort + ":");
    totalSummary.selectAll("rect").remove();
    totalSummary.append("rect")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("width", function(d) { return x_total(total); })
      .attr("height", barHeight)
      .attr('fill', "#ccc");
    var totalPort = d3.rollup(filtered, v => d3.sum(v, d => d.N));
    totalSummary.append("rect")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("width", function(d) { return x_total(totalPort); })
      .attr("height", barHeight)
      .attr('fill', "#555");
    d3.select("#s2_total_subtext")
      .text(totalPort + " of " + total + " total deportation flights");
    d3.select("#sexSummary").selectAll("g").remove();
    d3.select("#ageSummary").selectAll("g").remove();
    d3.select("#CoCSummary").selectAll("g").remove();
    if (currentPort === "" && currentNation === " ") {
      d3.select("#subTitle")
        .text("Demographics for individuals on all deportation flights from 2010 to 2018:");
    }
    if (filtered.length > 0) {
      // summarizes number of deportations across all years/nations
      var bySex = Array.from(d3.rollup(filtered, v => d3.sum(v, d => d.N), d => d.Sex))
        .sort(function(a, b) { return b[1] - a[1]; });
      var byAge = Array.from(d3.rollup(filtered, v => d3.sum(v, d => d.N), d => d.Juvenile))
        .sort(function(a, b) { return b[1] - a[1]; });
      var byCoC = Array.from(d3.rollup(filtered, v => d3.sum(v, d => d.N), d => d.CountryOfCitizenship))
        .sort(function(a, b) { return b[1] - a[1]; });
      var byCoCClipped = byCoC.slice(0,6);
      byCoCClipped.push(["Other", d3.sum(byCoC.map(d => d[1])) - d3.sum(byCoC.slice(0,6).map(d => d[1]))]);


      d3.select("#s2_total_subtext")
        .text(totalPort + " of " + total + " total deportation flights");
      var x_port = d3.scaleLinear()
        .domain([0, totalPort])
        .range([0, subBarWidth]);
      drawSummaryBar(bySex, d3.select("#sexSummary"), x_port, sexColors);
      drawSummaryBar(byAge, d3.select("#ageSummary"), x_port, ageColors);
      drawSummaryBar(byCoCClipped, d3.select("#CoCSummary"), x_port, cocColors);
    }
  });
  function drawSummaryBar(summarized, g, x_scale, colors) {
    var tempData = summarized;
    tracker = 0;
    for (i = 0; i < tempData.length; i++) { 
      tempData[i].push(x_scale(tracker));
      tempData[i].push(x_scale(tracker) + x_scale(tempData[i][1]));
      tempData[i].push(colors[i]);
      tracker = tracker + summarized[i][1];
    }
    var summaryBar = g.append("g")
      .attr("transform", "translate(" + barMargin.left + "," + barMargin.top + ")")
      .attr("width", x_scale.range()[1])
      .attr("height", barHeight);
    var tip = d3.tip()
      .attr('class', "d3-tip")
      .attr("opacity", 0.9)
      .style("color", "white")
      .style("background-color", "gray")
      .style("padding", "4px")
      .style("border-radius", "2px")
      .style("font-size", "11px")
      .style("font-family", "Avenir Next")
      .offset([-6, 0])
      .html(function(d) { return `<i>${d[0]}: ${d[1]} flights</i>` });   
    summaryBar.call(tip);
    summaryBar.selectAll("rect").remove();
    var bars = summaryBar.selectAll("rect")
      .data(tempData);
    
    bars.enter().append("rect")
      .attr("x", d => d[2])
      .attr("width", d => d[3] - d[2])
      .attr("height", barHeight)
      .attr('fill', d => d[4])
      .on('mouseover', function(d) {
        tip.show(d, this);
        d3.select(this).style('opacity', .6);
      })
      .on('mouseout', function(d) {
        tip.hide();
        d3.select(this).style('opacity', 1);
      });
    bars.attr("x", d => d[2])
      .attr("width", d => d[3] - d[2])
      .attr("height", barHeight)
      .attr('fill', d => d[4])
      .on('mouseover', function(d) {
        tip.show(d, this);
        d3.select(this).style('opacity', .6);
      })
      .on('mouseout', function(d) {
        tip.hide();
        d3.select(this).style('opacity', 1);
      });
    bars.exit().remove();
  
    
  
  }
}

