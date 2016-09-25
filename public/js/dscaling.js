var theta = 3;
var d = 30;
var d1 = Math.min(d,2*theta);
var gamma = 0.95;
var tl = -0.5, th = 0.5;
var p01 = 0.5, p10 = 0.5;
var upl = 1; // up phase length (s)
var potential = 0, early = [];
var lbs = [], ubs = [], ms_visual = [];
var hw = 1.0; // Heavy weight
var loop = false;

var width = 500,height = 1000, ldist = 100;

var start_process, pause_process, restart_process;

var fill, force, svg, rect, nodes, links, node, link;

// Requirement: d3.js
fill = d3.scale.category20c();

var adj_list, unexposed_vertices, just_activated, adj_list_edge_copies, ms, ws;

var darkred = fill.range()[4],
    darkgreen = fill.range()[8],
    lightred = fill.range()[6],
    lightgreen = fill.range()[10],
    gray = fill.range()[18];

function fill_node(d) {
  return gray;
}

function initialize_svg(){
  if(typeof svg != 'undefined') {
    // Clears out old simulation
    d3.select("#simulation").selectAll("*").remove();
  }
  svg = d3.select("#simulation")
        .append("svg")
        .attr("height", "100%")
        .attr("width", "100%");

  rect = svg.append("rect")
        .attr("height", "100%")
        .attr("width", "100%");
}

function vertex(idx=0) {
  return {
      x: 4*width/5.0, 
      y: height*0.5, 
      fixed: true,
      index: idx,
      synapse: false
    };
}

function create_vertex(i,index,input=true) {
  var vx = vertex(index);
  vx.x = width/5.0;
  vx.y = height*((1/5.0)*(1 + 3*i/d));
  if(!input) {
    vx.x += 1.5*vx.x;
  }
  return vx;
}

function radius() {
  return 0.3 * 3 * height / (5.0*d);
}

function node_radius(d) {
  if(!d.synapse) {
    return radius();
  }
  return 0;
}

function coinflip(p) {
  if(Math.random() < p) {
    return true;
  }
  return false;
}

function update_memory(signal,v_idx,cb) {
  ms[v_idx-1].memory = signal + gamma * ms[v_idx-1].memory;
  var mx = nodes[v_idx].x + (1+ms[v_idx-1].memory)*(nodes[d+v_idx].x - nodes[v_idx].x)/2.0;
  var lby = nodes[v_idx].y;
  //ms_visual[v_idx-1].transition().attr("x1",mx).attr("x2",mx);
  ms_visual[v_idx-1].transition().attr("transform", "translate(" + mx +","+lby  + ")")
    .each("end",function(){
      update_weight(v_idx,cb);
    });
}

function update_weight(v_idx,cb) {
  var was_updated = false;
  var violation = false;
  if(ms[v_idx-1].memory > th && ws[v_idx-1].weight < hw) {
    if(coinflip(p01)) {
      ws[v_idx-1].weight = hw;
      was_updated = true;
      
    }
    else {
      violation = true;
    }
  }
  else if(ms[v_idx-1].memory < tl && ws[v_idx-1].weight > 0.0) {
    if(coinflip(p10)) {
      ws[v_idx-1].weight = 0.0;
      was_updated = true;
    }
    else {
      violation = true;
    }
  }

  // Note that we do not go all the way to the bottom of the call sequence.
  // This means that we shouldn't make the code run arbitrarily fast.
  cb();

  if(was_updated) {
    ms[v_idx-1].memory = (th+tl)/(2.0*gamma);
    var mx = nodes[v_idx].x + (1+ms[v_idx-1].memory)*(nodes[d+v_idx].x - nodes[v_idx].x)/2.0;
    var lby = nodes[v_idx].y;
    ms_visual[v_idx-1]
      .transition()
      .attr("transform", "translate(" + mx +","+lby  + ")")
      .attr("fill","black")
      .each("end",function(){
        if(ws[v_idx-1].weight > 0.0) {
          draw_threshold(v_idx-1,true);
        }
        else {
          draw_threshold(v_idx-1,false);
        }
      });
  }
  else if(violation) {
    ms_visual[v_idx-1].transition().attr("fill","red");
  }
  else {
    ms_visual[v_idx-1].transition().attr("fill","black");
  }
  
  return;
}

function translateAlongLine(u,v) {
  return function(i) {
    return function(t) {
      var x = (1-t)*u.x + t*v.x;
      var y = (1-t)*u.y + t*v.y;
      return "translate(" + x + "," + y + ")";
    }
  }
}

function update_global_params() {
  // Set parameters
  theta = parseInt(document.getElementById('kPerc').value);
  d_old = parseInt(document.getElementById('nodeCount').value);
  d1 = parseInt(document.getElementById('startd').value);
  tl = parseFloat(document.getElementById('tl').value);
  th = parseFloat(document.getElementById('th').value);
  p01 = parseFloat(document.getElementById('p01').value);
  p10 = parseFloat(document.getElementById('p10').value);
  upl = parseFloat(document.getElementById('upl').value);
  delay = 1000*parseFloat(document.getElementById('delay').value);

  update_thresholds();

  d = d_old;
}

var lineFunction = d3.svg.line()
                      .x(function(d) { return d.x; })
                      .y(function(d) { return d.y; })
                      .interpolate("linear");

function create_linear_path(pathdata) {
  var line = svg.append("path")
                  .attr("d", lineFunction(pathdata))
                  .attr("stroke-width", 2)
                  .attr("stroke", "black")
                  .attr("fill", "none");
  return line;
}

function create_line(x1,y1,x2,y2) {
  var line = svg.append("line")
                  .attr("x1", x1)
                  .attr("y1", y1)
                  .attr("x2", x2)
                  .attr("y2", y2)
                  .attr("stroke-width", 2)
                  .attr("stroke", "black");
  return line;
}

function draw_threshold(i,left) {
  var x = nodes[1+i].x + (nodes[1+d+i].x - nodes[1+i].x)/2.0;
  x += (left? tl: th)*(nodes[1+d+i].x - nodes[1+i].x)/2.0;
  var y = nodes[1+i].y;
  var r = left? radius(): -radius();
  var pathdata = [{"x": x+r,"y": y+radius()},{"x": x,"y": y},{"x": x+r,"y": y-radius()}];
  var newthreshold = create_linear_path(pathdata);
  if(!left) {
    ubs[i].remove();
    lbs[i].remove();
    lbs[i] = newthreshold;
  }
  else {
    lbs[i].remove();
    ubs[i].remove();
    ubs[i] = newthreshold;
  }
}

// This function draws the thresholds!
function update_thresholds() {
  for(var i = 0; i < ubs.length; ++i) {
    if(ws[i].weight > 0.0) {
      draw_threshold(i,true);
    }
    else {
      draw_threshold(i,false);
    }
  }
}

function create_graph() {
  width = d3.select("#simulation").node().getBoundingClientRect().width;
  //height = 0.9*d3.select("body").node().getBoundingClientRect().height;
  height = document.body.clientHeight;
  
  update_global_params();
  
  // Force graph layout
  force = d3.layout.force()
      .size([width, height])
      .nodes([vertex()]) // initialize with a single node which is the target vertex!
      .on("tick", tick);
  
  initialize_svg();

  // Globals
  nodes = force.nodes();
  links = force.links();
  node = svg.selectAll(".node");
  link = svg.selectAll(".link");

  restart();

  // Input vertices
  for(var i = 0; i < d; ++i) {
    vx = create_vertex(i,i);
    nodes.push(vx);
  }
  // synapse vertices
  for(var i = 0; i < d; ++i) {
    vx = create_vertex(i,i,false);
    vx.synapse = true;
    nodes.push(vx);
  }

  // Memory thresholds
  var svgContainer = d3.select("svg");
  lbs = [], ubs = [];
  ms_visual = [];


  ms = []; // Memory
  ws = []; // Weight
  for(var i = 0; i < d; ++i) {
    var e1 = {source: nodes[1+i], target: nodes[1+d+i], memory: 0.0};
    links.push(e1);
    ms.push(e1);
    var e2 = {source: nodes[1+d+i], target: nodes[0], weight: 0.0};
    if(i < d1) {
      e2.weight = hw;
    }
    links.push(e2);
    ws.push(e2);
  }

  restart();

  
  for(var i = 0; i < d; ++i) {
    ubs.push({"remove":function(){this.delete}});
    lbs.push({"remove":function(){this.delete}});
    
    var lby = nodes[1+i].y;
    lbx = nodes[1+i].x + (nodes[1+d+i].x - nodes[1+i].x)/2.0;
    var memorymarker = svg.append("circle");
    memorymarker
      .attr("r",function(){return 0.5*radius()})
      .attr("transform", "translate(" + lbx +","+lby  + ")");
    ms_visual.push(memorymarker);
  }
  update_thresholds();

}

function tick(e) {
    var k = 15 * e.alpha;

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

function restart() {
    link = link.data(links);

    link.enter().insert("line", ".node")
        .attr("class", "link");

    node = node.data(nodes);

    // Update the color based on the state
    node.attr("fill", fill_node).attr("stroke", fill_node).attr("r",node_radius);

    // Adds new nodes
    // Multi shapes here!
    //    http://bl.ocks.org/mbostock/1062383
    node.enter().insert("circle")
        .attr("class", "node")
        .attr("r", node_radius)
        .call(force.drag);

    force.start();
    svg.selectAll(".node").on('mousedown.drag', null);
  }

function spike_animation(v_idx) {
  d3.select(node[0][v_idx])
      .transition()
      .attr("r",function(){ return 2*radius();})
      .duration(150)
      .transition()
      .attr("r",node_radius)
      .duration(150)
      .transition()
      .attr("fill",fill_node)
      .duration(150)
      .attr("stroke",fill_node);
}

function signal_animation(v_idx,t,cb) {
  var marker = svg.append("circle");
  marker.attr("r", function() {return 0.9*radius();})
    .attr("opacity", 1.0)
    .attr("fill", function(){
        if(ws[v_idx - 1].weight > 0)
        {
          return "green";
        }
        return "black";
      })
    .attr("transform", "translate(" + nodes[v_idx].x +","+nodes[v_idx].y  + ")");
  setTimeout(function(){
    marker.transition()
      .ease("linear")
      .duration(delay)
      .attrTween("transform", translateAlongLine(nodes[v_idx],nodes[d+v_idx]))
      /*.each("end",function(){
        marker.attr("fill", function(){
        if(ws[v_idx - 1].weight > 0)
        {
          return "green";
        }
        return "black";
      })})*/
      .transition()
      .duration(delay)
      .attrTween("transform", translateAlongLine(nodes[d+v_idx],nodes[0]))
      .remove()
      .each("end",cb);
  },t);
}

function backwards_signal(v_idx, signal_type, cb) {
  var marker = svg.append("circle");
  marker.attr("r", function() {return 0.9*radius();})
    .attr("opacity", 1.0)
    .attr("fill", function(){
      if(signal_type > 0) {
        return "green";
      }
      return "red";
    })
    .attr("transform", "translate(" + nodes[0].x +","+nodes[0].y  + ")");
  marker.transition()
    .ease("linear")
    .duration(delay)
    .attrTween("transform", translateAlongLine(nodes[0],nodes[d+v_idx]))
    .each("end",function() {
      //ms[v_idx-1].memory = signal_type + gamma * ms[v_idx-1].memory;
      update_memory(signal_type,v_idx,cb);
      //var mx = nodes[v_idx].x + (1+ms[v_idx-1].memory)*(nodes[d+v_idx].x - nodes[v_idx].x)/2.0;
      //ms_visual[v_idx-1].transition().attr("x1",mx).attr("x2",mx);
    })
    .remove();
}

function update_target_vertex(source_idx,cb) {
  if(potential < theta && potential + ws[source_idx-1].weight >= theta) {
    // spike
    cb();
    early.push(source_idx);
    early.forEach(function(v_idx,index) {backwards_signal(v_idx,(1-gamma),function(){});});
    d3.select(node[0][0])
      .transition(delay/theta)
      .attr("r",node_radius);
  }
  else if(potential >= theta) {
    backwards_signal(source_idx,-(1-gamma),cb);
  }
  else {
    cb();
    early.push(source_idx);
    d3.select(node[0][0])
      .transition(delay/theta)
      .attr("r",function(){ return (1 + 10*potential/theta)*radius();});
  }
  potential += ws[source_idx-1].weight;
}

function signal_transmission(v_idx,t,cb=function(){}) {
  // Spike animation
  setTimeout(function(){spike_animation(v_idx);},t);
  signal_animation(v_idx, t, function(){
      update_target_vertex(v_idx,cb);
    });
}


function up_phase() {
  update_global_params();
  potential = 0;
  early = [];
  // Select spike time for all vertices
  var drange = Array.apply(null, {length: d}).map(Number.call, Number);
  let processing = drange.map((i) => {
    return new Promise((resolve) => {
      signal_transmission(i+1,Math.random()*upl*1000,resolve);
    })
  });
  Promise.all(processing).then(function() {
    if(loop) {
      up_phase()}
  });
  Promise.all(processing).then(function(){
    // example to use http://bl.ocks.org/mbostock/1933560
    var data = ms.map(function(d){return d.memory});
  });
}

function up_phase_loop() {
  loop = !loop;
  if(loop) {
    d3.select("#btn1").attr("disabled",true);
    d3.select("#btn2").attr("disabled",true);
    d3.select("#btn3").attr("value","Stop up phase loop");
    up_phase();
  }
  else {
    //document.getElementById('btn1').disabled = false;
    // Property replaces attr if value is not a string, like boolean
    d3.select("#btn1").property("disabled",false);
    d3.select("#btn2").property("disabled",false);
    d3.select("#btn3").attr("value","Start up phase loop");
  }
}

function faster() {
  document.getElementById('delay').value = 0.9*parseFloat(document.getElementById('delay').value);
  document.getElementById('upl').value = 0.9*parseFloat(document.getElementById('upl').value);
}

function slower() {
  document.getElementById('delay').value = (1/0.9)*parseFloat(document.getElementById('delay').value);
  document.getElementById('upl').value = (1/0.9)*parseFloat(document.getElementById('upl').value);
}


window.onload = function() {
  width = d3.select("#simulation").node().getBoundingClientRect().width;
  height = document.body.clientHeight;
  create_graph();

  restart();

  var aspect = width / height;
  d3.select(window)
    .on("resize", function() {
      width = d3.select("#simulation").node().getBoundingClientRect().width;
      height = document.body.clientHeight;
      var targetWidth = width;
      var targetHeight = height;
      force.size([width,height]);
    });
};
