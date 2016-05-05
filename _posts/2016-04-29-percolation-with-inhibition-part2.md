---
layout: post
title: Percolation with inhibition - part 2
custom_css:
- markov
custom_js:
- d3/d3.min
---
This part 2 in the series on percolation with inhbition. If you have not
yet read part 1 you can find it [here]({% post_url
2016-04-25-percolation-with-inhibition %}).

In this post we will try to get an intuition for how many vertices
eventually turn active in the process. Let us assume that we have $$n$$
vertices in total, $$n^+$$ of them which send positive messages and
$$n^-$$ of them which send negative messages.

For a fixed vertex in the graph we can assume that it does not know if
its neighbours are positive or negative. Since it only receives at most
one message from each neighbour we can think of these messages being
independently positive with probability $$n^+/n$$ and negative
with probability $$n^-/n$$. Formally these events are not independent
but the dependence is weak so you can assume they are to get some
intuition behind the process.

This allows us to model the process as a Markov chain. If you are
unfamiliar with Markov chains there is a great pictorial explanation
[here](http://setosa.io/blog/2014/07/26/markov-chains/). Our Markov
chain consists of *infinitely* many states which represent the potential
of our single vertex under consideration. The states are given by the
set $$\{\ldots,-2,-1,0,1,2,\ldots,K\}$$ and correspond to the value of
the potential of the vertex. Like all vertices which are not active at
the start it starts with its potential in state 0 and it can only stop
if it ever reaches state $$K$$. The transition probabilities are given
as the probability of increasing or decreasing the potential as
explained in the previous paragraph.

Below you see an interactive version of the process. The fact that state
$$K$$ is an absorbing state is denoted by a self-loop. Since we do not
have space for infinitely many states the left-most state represents all
states smaller or equal to $$-K$$. You can imagine the chain extending
infinitely to the left. Additionally we reset the process if it has not
finished after 10 steps (you can change this variable below). Note that
the process should always reach $$K$$ if $$n^-<n^+$$ with enough many
steps. However, if $$n^- > n^+$$ we have a drift to the left. This means
that if the potential becomes too small there is hardly any chance that
it will be able to recover. Try it out by choosing $$n^- = 100$$ and
$$n^+ = 50$$ for example.

<div id="chain"></div>

<form onsubmit="change_params(); return false;" style="margin-bottom:20px">
  <input type="button" value="Update parameters" onclick="change_params()">
  <table style="max-width: 720px; font-size:75%; margin-bottom:10px">
  <tr>
    <td>
    <label for="nodeCount">Number of positive vertices</label>
    </td>
    <td>
      <input id="nodeCount" type="text" value="50" style="width: 50px;">
    </td>
  </tr>
  <tr>
    <td>
    <label for="inodeCount">Number of negative vertices </label>
    </td>
    <td>
      <input id="inodeCount" type="text" value="50" style="width: 50px;">
    </td>
  </tr>
  <tr>
    <td>
    <label for="maximumSteps">Maximum number of steps</label>
    </td>
    <td>
      <input id="maximumSteps" type="text" value="10" style="width: 50px;">
    </td>
  </tr>
  <tr>
    <td>
    <label for="kPerc">Activation threshold (<i>K</i>)</label>
    </td>
    <td>
      <input id="kPerc" type="text" value="2" style="width: 50px;">
    </td>
  </tr>
  <tr>
    <td>
    <label for="delay">Animation speed, ms (lower is faster)</label>
    </td>
    <td>
      <input id="delay" type="text" value="50" style="width: 50px;">
    </td>
  </tr>
</table>
</form>
Below you can see some statistics of the simulations of the Markov chain.
The histogram shows after how many steps the potential reached $$K$$.
Observe that for $$n^-\gg n^+$$ the most likely outcome is that the
process goes directly to $$K$$.
<div id="hist"></div>
The plot below shows which fraction of all the simulations ever reach
$$K$$ within the given number of steps. You can use it to estimate which
fraction of the vertices turn active in the bootstrap percolation
process. Just set the maximum number of steps in the Markov chain to the
average degree of the graph.

By pressing the *update parameters* button you start a new simulation
and draw a new curve. The old one is not lost however so you can compare
different parameters.
<div id="stats"></div>

<script>

var width = d3.select("#chain").node().getBoundingClientRect().width;
var height = 200;
var kThresh = 3;
var stateRadius = 15;
var trial = 0;
var n_ex = 80;
var n_in = 65;
var max_steps = 10;
var speed = 50;
var data_point = 0;

var n = 40;
//var data = Array.apply(0, Array(n)).map(Number.prototype.valueOf,0);
var data = [];
var histogram_data = [];

var fill = d3.scale.category20c();


function setup(num_exp) {
  data = Array.apply(0, Array(n)).map(Number.prototype.valueOf,0);
  data = [];
  histogram_data = [];
  d3.select("#chain").selectAll("*").remove();
  d3.select("#hist").selectAll("*").remove();
  var margin = width/(2.4*kThresh);
  var svg = d3.select("#chain").append("svg")
      .attr("width", width)
      .attr("height", height);

  d3.select(window)
      .on("resize", function() {
        var targetWidth = d3.select("#chain").node().getBoundingClientRect().width;
        svg.attr("width", targetWidth);
        });

  defs = svg.append("defs");

  defs.append("marker")
      .attr({
        "id":"arrow",
        "viewBox":"0 -5 10 10",
        "refX":5,
        "refY":0,
        "markerWidth":4,
        "markerHeight":4,
        "orient":"auto"
      })
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class","arrowHead");

  var path_collection = [];

  var xs = [], ys = [];
  for(var x = 0; x <= 2*kThresh; ++x) {
    if(kThresh < 3) {
      xs.push(margin + x*0.8*(margin));
    }
    else {
      xs.push(margin + x*0.8*(margin));
    }
    ys.push(height/2.0);
    path_collection.push({});
  }

  var forward = [], backward = [];
  for(var idx=0; idx < xs.length-1; ++idx) {
    var coord=[[xs[idx],ys[idx]],[0.5*(xs[idx]+xs[idx+1])-10,ys[idx]-30],[xs[idx+1]-stateRadius,ys[idx+1]-stateRadius]];
    forward.push(coord);
    if(idx < xs.length-2) {
      var clone=[[xs[idx+1],ys[idx+1]],[0.5*(xs[idx]+xs[idx+1])+10,ys[idx]+30],[xs[idx]+stateRadius,ys[idx]+stateRadius]];
      backward.push(clone);
    }
    else {
    var clone=[[xs[idx+1],ys[idx+1]],
      [xs[idx+1]+40,ys[idx]-30],
      [xs[idx+1]+50,ys[idx]],
      [xs[idx+1]+40,ys[idx]+30],
      [xs[idx+1]+20,ys[idx+1]+stateRadius]];
      backward.push(clone);
    }
  }

  for(var idx=0; idx < forward.length; ++idx) {
    var path = svg.append("path")
      .data([forward[idx]])
      .attr("d", d3.svg.line()
        .tension(0) // Catmull–Rom
        .interpolate("basis"))
      .attr({
        "class":"arrow",
        "marker-end":"url(#arrow)"
        });
    path_collection[idx]["forward"] = path;
    var path2 = svg.append("path")
      .data([backward[idx]])
      .attr("d", d3.svg.line()
        .tension(0) // Catmull–Rom
        .interpolate("basis"))
      .attr({
        "class":"arrow",
        "marker-end":"url(#arrow)"
        });
    path_collection[idx+1]["backward"] = path2;
  }

  var states = {"nodes":[]};
  for(var idx=0; idx < xs.length; ++idx) {
    var fillcolor;
    if(idx > kThresh) {
        fillcolor =  d3.rgb(fill.range()[8]).brighter(idx-kThresh-2);
        }
        else if(idx == kThresh) {
          fillcolor = fill.range()[17];
        }
        else {
          fillcolor = d3.rgb(fill.range()[0]).darker(kThresh - idx - 2);
        }
    var state = {"x": xs[idx], "y": ys[idx], "r": stateRadius, "fill":
    fillcolor, "label":idx-kThresh, "coord":[xs[idx],ys[idx]]};
    states["nodes"].push(state);
    path_collection[idx]["node"] = state;
  }

  var elem = svg.selectAll("g").data(states.nodes);
  var elemEnter = elem.enter()
    .append("g")
    .attr("transform", function(d){return "translate("+d.x+","+d.y+")"});
  var circle = elemEnter.append("circle")
    .attr("r", function(d){return d.r})
    .attr("fill", function(d) {return d.fill});
  var labels = elemEnter.append("text")
    .attr("dx", function(d){
      if(d.label < 0) {return -stateRadius/2.0}
      else {return -stateRadius/2.0 + 3.0}
    })
    .attr("dy", function(d){return 5})
    .attr("font-size", "14px")
    .attr("fill", fill.range()[19])
    .text(function(d){return d.label});

  var circle = svg.append("circle")
      .attr("r", 13)
      .attr("opacity",0.5)
      .attr("transform", "translate(" + path_collection[kThresh]["node"]["coord"] + ")");

  var prob_win = svg.append("text")
    .attr("dx", margin/2.0)
    .attr("dy", height/4.0)
    .attr("font-size", "14px")
    .attr("fill", fill.range()[16])
    .text(function(){return "Probability of reaching "+kThresh+" in infinitely many steps: "+Math.pow(Math.min(1.0,n_ex/n_in),kThresh);});

  var numFinish = 0;
  var numFail = 0;
  var steps = 0;

  var statistics = svg.append("text")
    .attr("dx", margin/2.0)
    .attr("dy", 3.0*height/4.0)
    .attr("font-size", "14px")
    .attr("fill", fill.range()[16])
    .text(function(){return "Number of times we reached "+kThresh+": "+numFinish;});

  var statistics_fail = svg.append("text")
    .attr("dx", margin/2.0)
    .attr("dy", 3.3*height/4.0)
    .attr("font-size", "14px")
    .attr("fill", fill.range()[16])
    .text(function(){return "Number of times we didn't reach "+kThresh+": "+numFail;});

  var statistics_summary = svg.append("text")
    .attr("dx", margin/2.0)
    .attr("dy", 3.6*height/4.0)
    .attr("font-size", "14px")
    .attr("fill", fill.range()[16])
    .text(function(){return "Estimated probability of reaching "+kThresh+" in "+max_steps+" steps: "+numFinish/(Math.max(1,numFail+numFinish));});


  transition(kThresh);

  function transition(state) {
    if(num_exp != trial) {
      return;
    }
    steps += 1;
    if(steps>max_steps) {
      steps = 0;
      d3.select(labels[0][0]).transition().duration(100)
        .text(-kThresh)
      numFail++;
      tick(numFinish/(numFinish+numFail));
      statistics_fail
        .text(function(){return "Number of times we didn't reach "+kThresh+": "+numFail;});
      statistics_summary
        .text(function(){return "Estimated probability of reaching "+kThresh+" in "+max_steps+" steps: "+numFinish/(numFail+numFinish);});
      transition(kThresh);
      return;
    }
    prob_win
    .text(function(){return "Probability of reaching "+kThresh+" in infinitely many steps: "+Math.pow(Math.min(1.0,n_ex/n_in),2*kThresh-state);});
    if(state <= 0) {
      circle
      .attr("opacity",0.1);
    }
    else {
      circle
        .attr("opacity",0.5);
    }
    if(state==xs.length-1) {
      histogram_data.push(steps-1);
      //console.log(histogram_data);
      update_histogram();
      numFinish++;
      tick(numFinish/(numFinish+numFail));
      steps = 0;
      statistics
        .text(function(){return "Number of times we reached "+kThresh+": "+numFinish;});
      statistics_summary
        .text(function(){return "Estimated probability of reaching "+kThresh+" in "+max_steps+" steps: "+numFinish/(numFail+numFinish);});
      transition(kThresh);
      return;
    }
    else if(state<0) {
      d3.select(labels[0][0]).transition().duration(100)
      .text(state-kThresh)
      .attr("dy", function(d){
      if (state-kThresh<-9){return 3;}
      else {return 5;}})
      .attr("font-size", function() {
      if (state-kThresh<-9){return "10px";}
      else {return "14px";}})
      .each("end",function() {
        if(Math.random() <= n_in/(n_ex+n_in)) {
          circle.transition()
            .duration(speed)
            .each("end", function(){transition(state-1);});
        }
        else {
          circle.transition()
            .duration(speed)
            .each("end", function() {transition(state+1);});
            }
       });
    }
    else {
      circle.transition()
      .duration(speed)
      .attr("transform", "translate(" + path_collection[state]["node"]["coord"] + ")")
      .each("end",function() {
        if(Math.random() <= n_in/(n_ex+n_in)) {
          if(state > 0) {
            circle.transition()
              .duration(2*speed)
              .attrTween("transform", translateAlong(path_collection[state]["backward"].node()))
              .each("end", function(){transition(state-1);});
          }
          else {
            transition(state-1);
            return;
          }
        }
        else {
          if(state == 0) {
            d3.select(labels[0][0]).transition().duration(speed)
              .text(state-kThresh);
          }
          circle.transition()
            .duration(2*speed)
            .attrTween("transform", translateAlong(path_collection[state]["forward"].node()))
            .each("end", function() {transition(state+1);});
            }
       });
    }
  }

  // Returns an attrTween for translating along the specified path element.
  function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
      return function(t) {
        var p = path.getPointAtLength(t * l);
        return "translate(" + p.x + "," + p.y + ")";
      };
    };
  }

  // Histogram of number of steps when process finishes
  // A formatter for counts.
  var margin_hist = {top: 10, right: 30, bottom: 30, left: 30};
  var heightHist = 500;
  var formatCount = d3.format(",.0f");
  var svgHist = d3.select("#hist").append("svg")
    .attr("width", width + margin_hist.left + margin_hist.right)
    .attr("height", heightHist + margin_hist.top + margin_hist.bottom)
  .append("g")
    .attr("transform", "translate(" + margin_hist.left + "," + margin_hist.top + ")");

  var numbins = max_steps;

  var x_scale = d3.scale.linear()
    .domain([1, max_steps])
    .range([0, width-margin_hist.right]);

  var xAxis = d3.svg.axis()
    .scale(x_scale)
    .orient("bottom");
  var bandSize = width/(2*numbins);

  
  function update_histogram() {
    numbins = max_steps;
    bandSize = width/(2*numbins);
    x_scale = d3.scale.linear()
      .domain([1, max_steps])
      .range([0, width-margin_hist.right]);
    xAxis = d3.svg.axis()
      .scale(x_scale)
      .orient("bottom");

    svgHist.selectAll("*").remove();
    var data_binned = d3.layout.histogram()
      .bins(x_scale.ticks(numbins))
      (histogram_data);
    var y_scale = d3.scale.linear()
      .domain([0, d3.max(data_binned, function(d) { return d.y; })])
      .range([heightHist, 0]);

    var bar = svgHist.selectAll(".bar")
      .data(data_binned)
    .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d) { return "translate(" + x_scale(d.x) + "," + y_scale(d.y) + ")"; });

    bar.append("rect")
      .attr("x", 1)
      .attr("width", width/numbins)
      .attr("height", function(d) { return heightHist - y_scale(d.y); });

    bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", width/(2*max_steps))
      .attr("text-anchor", "middle")
      .text(function(d) { return formatCount(d.y); });

    var visible_axis = svgHist.append("g")
      .attr("transform", "translate(-" + bandSize + "," + height + ")")
      .attr("class", "x axis")
      .attr("fill",d3.rgb(fill.range()[17]).darker(1))
      .attr("transform", "translate(0," + heightHist + ")")
      .call(xAxis)
      .selectAll("text")
       .style("text-anchor", "start")
       .attr("transform", "translate(" + bandSize + ", 0)");

  }
  update_histogram();
}

setup(trial);

function change_params() {
    speed = parseInt(document.getElementById('delay').value);
    n_ex = parseInt(document.getElementById('nodeCount').value);
    n_in = parseInt(document.getElementById('inodeCount').value);
    max_steps = parseInt(document.getElementById('maximumSteps').value);
    kThresh = parseInt(document.getElementById('kPerc').value);
    trial++;
    setup(trial);
    return;
}



var margin = {top: 20, right: 20, bottom: 20, left: 80};
var width = d3.select("#chain").node().getBoundingClientRect().width;
height = 500 - margin.top - margin.bottom;
var fill2 = d3.scale.category10();
var x = d3.scale.log().base(10)//.linear()
    //.domain([1, n-1])
    .domain([1, 1000])
    .range([0, width-100]);
var y = d3.scale.linear()
    .domain([0, 1])
    .range([height-30, 0]);
var line = d3.svg.line()
    //.x(function(d, i) { return x(i); })
    .x(function(d, i) { return x(d.x); })
    //.y(function(d, i) { return y(d); });
    .y(function(d, i) { return y(d.y); });
var svg = d3.select("#stats").append("svg")
    .attr("width", width)
    .attr("height", height+3*margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);
svg.append("g")
    .attr("class", "x axis")
    .style("fill", d3.rgb(fill.range()[17]).darker(1))
    .attr("transform", "translate(0," + y(0) + ")")
    .call(d3.svg.axis().ticks(3).scale(x).orient("bottom").innerTickSize(-height)
    .outerTickSize(0)
    .tickPadding(10));
svg.append("g")
    .attr("class", "y axis")
    .style("fill", d3.rgb(fill.range()[17]).darker(1))
    .call(d3.svg.axis().scale(y).orient("left").innerTickSize(-width)
    .outerTickSize(0)
    .tickPadding(10));
var graph_path = svg.append("g")
    .attr("clip-path", "url(#clip)")
  .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke",fill2(trial));

svg.append("text")
  .attr("text-anchor", "middle")
  .attr("transform", "translate("+ -50.0 +","+(height/2)+")rotate(-90)")
  .text("Value")
  .attr("fill",d3.rgb(fill.range()[17]).darker(1));

svg.append("text")
  .attr("text-anchor", "middle")
  .attr("transform", "translate("+ ((width-100)/2) +","+(height+15)+")")
  .text("Time")
  .attr("fill",d3.rgb(fill.range()[17]).darker(1));

var old_trial = trial;

function tick(new_data) {
  if(old_trial < trial) {
    old_trial = trial;
    graph_path = svg.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line)
      .attr("stroke",fill2(trial));
  }
  // push a new data point onto the back
  //console.log(new_data);
  var t = data.length;
  data.push({x:t+1,y:new_data});
  //data.push(new_data);
  // redraw the line, and slide it to the left
  graph_path
      .attr("d", line)
      .attr("transform", null);
    /*.transition()
      .duration(100)
      .ease("linear")
      .attr("transform", "translate(" + x(-1) + ",0)");*/
  // pop the old data point off the front
  //data.shift();
}
</script>


