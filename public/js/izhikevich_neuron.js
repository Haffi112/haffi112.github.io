// Main sources for this simulation
//    Live graphs in d3js, https://bost.ocks.org/mike/path/
//    Izhikevich neuron, http://www.izhikevich.org/publications/spikes.htm
//    Conductance based version of Izhikevich, https://github.com/fzenke/auryn/blob/master/src/auryn/IzhikevichGroup.cpp


var width = 100; //d3.select("#simulation").node().getBoundingClientRect().width;
var height = 100;

var input = {"x":width/4,"y":height/12};
var neuron = {"x":9*width/10,"y":height/12};
var neuronradius = width/100;

var a = 0.02, b = 0.2, c = -65, d = 8, dtpersec = 50, dt = 0.0001, delay=1;

var I = 0;

var fill = d3.scale.category20c();

var v = -65;
var u = v;


var tau_ampa = 5e-3, g_ampa = 0;
var tau_gaba = 10e-3, g_gaba = 0, e_rev_gaba = -80e-3;
var g_nmda = 0, tau_nmda = 100e-3, w_nmda = 0.0, max_g_nmda = 0.1;

var pos_weight = 0.2, neg_weight = 0.2;

var n = 2000;

var plot_margin = 10;

var on_current_value = 10;

var update_v_plot, update_u_plot, update_g_ampa_plot, update_current_plot, update_g_nmda_plot;

var V_text;

function rescale() {
  input = {"x":width/4,"y":height/12};
  neuron = {"x":9*width/10,"y":height/12};
  neuronradius = Math.min(height,width)/100;
  delay = ((delay/1000)/dt)/dtpersec; // Delay in seconds
  v = -65;
  u = b*v;
  g_ampa = 0;
  g_nmda = 0;
  g_gaba = 0;
}

function update_parameters(setting={}){
  if(!(Object.keys(setting).length === 0 && setting.constructor === Object)) {
    document.getElementById('aparam').value = setting.a;
    a = setting.a;
    document.getElementById('bparam').value = setting.b;
    b = setting.b;
    document.getElementById('cparam').value = setting.c;
    c = setting.c;
    document.getElementById('dparam').value = setting.d;
    d = setting.d;
  }
  else {
    a = parseFloat(document.getElementById('aparam').value);
    b = parseFloat(document.getElementById('bparam').value);
    c = parseFloat(document.getElementById('cparam').value);
    d = parseFloat(document.getElementById('dparam').value);
  }
  dtpersec = parseFloat(document.getElementById('dtpersec').value);
  dt = parseFloat(document.getElementById('resolution').value)/1000;
  delay = parseFloat(document.getElementById('delay').value);
  n = parseInt(document.getElementById('n_points').value);
  pos_weight = parseFloat(document.getElementById('ampa_weight').value);
  neg_weight = parseFloat(document.getElementById('gaba_weight').value);
  w_nmda = parseFloat(document.getElementById('nmda_weight').value);
  on_current_value = parseFloat(document.getElementById('current_weight').value);
  tau_ampa = parseFloat(document.getElementById('tau_ampa').value)/1000;
  tau_gaba = parseFloat(document.getElementById('tau_gaba').value)/1000;
  tau_nmda = parseFloat(document.getElementById('tau_nmda').value)/1000;
  max_g_nmda = parseFloat(document.getElementById('max_g_nmda').value)/1000;

  rescale();
}

// Default parameter settings
var rs  = {"a":0.02, "b":0.2,  "c": -65, "d": 8},
    ib  = {"a":0.02, "b":0.2,  "c": -55, "d": 4},
    ch  = {"a":0.02, "b":0.2,  "c": -50, "d": 2},
    fs  = {"a":0.1,  "b":0.2,  "c": -65, "d": 2},
    lts = {"a":0.02, "b":0.25, "c": -65, "d": 2},
    tc  = {"a":0.02, "b":0.25, "c": -65, "d": 0.05},
    rz  = {"a":0.1,  "b":0.26, "c": -65, "d": 2};

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

function add_play_button() {
  var excitatory = svg.append("g")
    .attr("class", "play");
  
  var inhibitory = svg.append("g")
    .attr("class", "play");

  var current = svg.append("g")
    .attr("class", "play");

  var md = function() {
    excitatory.classed("mousedown", true);
  }

  var mup = function(starty, fillcolor, ampa=true) {
    excitatory.classed("mousedown", false);
    // Message
    var marker = svg.append("circle");
    marker.attr({
        cx: input.x,
        cy: starty,
        fill: fillcolor,
        r: neuronradius,
        "z-index":-1
      });

    marker.transition()
      .duration(1000*delay)
      .ease("circle") // For more easing info check http://bl.ocks.org/hunzy/9929724
      .attr("cx",neuron.x)
      .attr("cy", neuron.y)
      .each("end", function(){
          if(ampa) {
            g_ampa += pos_weight;
          }
          else {
            g_gaba += neg_weight;
          }
        })
      .remove();
  }

  excitatory.append("circle")
    .attr("id", "inputbutton")
    .attr("r", neuronradius)
    .attr("stroke-width", ".5px")
    .attr("fill","green")
    .attr("transform", "translate(" + input.x + "," + (input.y - 4.75*neuronradius) + ")")
    .on("mousedown", md)
    .on("mouseup", function() {mup(input.y - 4.75*neuronradius, "green");});
  
  svg.append("text")
    .attr("text-anchor", "start")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("font-size", 9)
    .attr("transform", "translate("+ (width/6 + 10) +","+(input.y - 4.75*neuronradius)+")")  // text is drawn off the screen top left, move down and out and rotate
    .text("AMPA spike");
  
  inhibitory.append("circle")
    .attr("id", "inputbutton")
    .attr("r", neuronradius)
    .attr("stroke-width", ".5px")
    .attr("fill","red")
    .attr("transform", "translate(" + input.x + "," +(input.y - 2.25*neuronradius) + ")")
    .on("mousedown", md)
    .on("mouseup", function() {mup(input.y - 2.25*neuronradius, "red" ,false);});
  
  svg.append("text")
    .attr("text-anchor", "start")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("font-size", 9)
    .attr("transform", "translate("+ (width/6 + 10) +","+(input.y - 2.25*neuronradius)+")")  // text is drawn off the screen top left, move down and out and rotate
    .text("GABA spike");
  
  current.append("rect")
    .attr("id", "inputbutton")
    .attr("width", 2*neuronradius)
    .attr("height", 2*neuronradius)
    .attr("stroke-width", ".5px")
    .attr("style","fill:gold")
    .attr("transform", "translate(" + (input.x - neuronradius) + "," +(input.y + neuronradius) + ")")
    .on("mousedown", md)
    .on("mouseup", function() {
        if(I > 0) {
          I = 0;
        }
        else {
          I = on_current_value;
        }
    });
  
  svg.append("text")
    .attr("text-anchor", "start")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("font-size", 9)
    .attr("transform", "translate("+ (width/6 + 10) +","+(input.y + 2*neuronradius)+")")  // text is drawn off the screen top left, move down and out and rotate
    .text("DC current");
}

function draw_neuron() {
  var svgneuron = svg.append("g")
    .attr("class", "neuron");

  var neuroncircle = svgneuron.append("circle")
      .attr("r", neuronradius)
      .attr("fill",d3.rgb(fill.range()[8]).brighter(0))
      .attr("transform", "translate(" + neuron.x + "," + neuron.y + ")")
      .attr("opacity", 0.5);
}

function chart(data, domain, ydomain, yrange, interpolation, tick, axis=true) {
  var margin = {top: 6, right: 0, bottom: 6, left: 20};

  var x = d3.scale.linear()
      .domain(domain)
      .range([input.x, neuron.x]);

  var y = d3.scale.linear()
      .domain(ydomain)
      .range(yrange);

  var line = d3.svg.line()
      .interpolate(interpolation)
      .x(function(d, i) { return x(i); })
      .y(function(d, i) { return y(d); });
  
  if(axis) {
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate("+ (input.x - margin.left)+",0)")
        .call(d3.svg.axis().scale(y).ticks(10).orient("left"));
  }

  var path = svg.append("g")
      .attr("clip-path", "url(#clip)")
    .append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);
  
  return function() {
    tick(path, line, data, x);
  }
}

function v_plot() {
  var data = d3.range(n).map(function(){return v;});
  update_v_plot = chart(data, [0, n-1], [1000*e_rev_gaba - 20, 40], [2*height / 6 - plot_margin, 1 * height / 6 + plot_margin], "linear", function tick(path, line, data, x) {
    // push a new data point onto the back
    data.push(v);
    // redraw the line, and then slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
      .transition()
        .attr("transform", "translate(" + (x(-1) - input.x) + ")");

    // pop the old data point off the front
    data.shift();
  });

  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (input.x - 60) +","+(height/6 + height/12)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    .text("Voltage (mV)");
  
  V_text = svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (neuron.x + 30) +","+(height/6 + height/12 + 10)+")") 
    .attr("font-size", 10)
    .text(function() {
      return "" + (d3.format(",.2f")(v)) + " mV";
    });
}

function u_plot() {
  var data = d3.range(n).map(function(){return u;});
  update_u_plot = chart(data, [0, n-1], [- 20, 70], [3*height / 6 - plot_margin, 2 * height / 6 + plot_margin], "linear", function tick(path, line, data, x) {
    // push a new data point onto the back
    data.push(u);
    // redraw the line, and then slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
      .transition()
        .attr("transform", "translate(" + (x(-1) - input.x) + ")");

    // pop the old data point off the front
    data.shift();
  });

  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (input.x - 60) +","+(2*height/6 + height/12)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    .text("Adaptation");
}

function g_ampa_plot() {
  var data = d3.range(n).map(function(){return g_ampa;});
  update_g_ampa_plot = chart(data, [0, n-1], [0, 5*pos_weight], [4*height / 6 - plot_margin, 3 * height / 6 + plot_margin], "linear", function tick(path, line, data, x) {
    // push a new data point onto the back
    data.push(g_ampa);
    // redraw the line, and then slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
        .attr("style","stroke:green")
      .transition()
        .attr("transform", "translate(" + (x(-1) - input.x) + ")");

    // pop the old data point off the front
    data.shift();
  });

  var data2 = d3.range(n).map(function(){return g_gaba;});
  update_g_gaba_plot = chart(data2, [0, n-1], [0, 5*pos_weight], [4*height / 6 - plot_margin, 3 * height / 6 + plot_margin], "linear", function tick(path, line, data2, x) {
    // push a new data point onto the back
    data2.push(g_gaba);
    // redraw the line, and then slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
        .attr("style","stroke:red")
      .transition()
        .attr("transform", "translate(" + (x(-1) - input.x) + ")");

    // pop the old data point off the front
    data2.shift();
  }, false);

  var data3 = d3.range(n).map(function(){return g_nmda;});
  update_g_nmda_plot = chart(data3, [0, n-1], [0, 5*pos_weight], [4*height / 6 - plot_margin, 3 * height / 6 + plot_margin], "linear", function tick(path, line, data3, x) {
    // push a new data point onto the back
    data3.push(g_nmda);
    // redraw the line, and then slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
        .attr("style","stroke:blue")
      .transition()
        .attr("transform", "translate(" + (x(-1) - input.x) + ")");

    // pop the old data point off the front
    data3.shift();
  }, false);

  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (input.x - 60) +","+(3*height/6 + height/12)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    .text("Conductance");
}

function current_plot() {
  var data = d3.range(n).map(function(){return 0;});
  update_current_plot = chart(data, [0, n-1], [- 50, 100], [5*height / 6 - plot_margin, 4 * height / 6 + plot_margin], "linear", function tick(path, line, data, x) {
    // push a new data point onto the back
    data.push(-g_ampa * v  - g_gaba * (v - 1000*e_rev_gaba) + I);
    // redraw the line, and then slide it to the left
    path
        .attr("d", line)
        .attr("transform", null)
      .transition()
        .attr("transform", "translate(" + (x(-1) - input.x) + ")");

    // pop the old data point off the front
    data.shift();
  });

  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (input.x - 60) +","+(4*height/6 + height/12)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
    .text("Input current");
}

function time_step() {
  //console.log("-------------");
  //console.log(u);
  //console.log(v);
  //console.log(g_ampa);

  // We assume NMDA has reversal potential 0 mV (source: http://icwww.epfl.ch/~gerstner/SPNM/node16.html)
  var cur_ex = -(g_ampa + g_nmda) * v;
  var cur_in = g_gaba * (v - 1000*e_rev_gaba);

  v = v + 1000*dt*(0.04*Math.pow(v,2)+5*v+140-u+I + cur_ex - cur_in);
  u = u + 1000*dt*a*(b*v - u);

  V_text.remove();
  V_text = svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (neuron.x + 30) +","+(height/6 + height/12 + 10)+")") 
    .attr("font-size", 10)
    .text(function() {
      return "" + (d3.format(",.2f")(v)) + " mV";
    });

  g_ampa -= dt * g_ampa / tau_ampa;
  g_gaba -= dt * g_gaba / tau_gaba;
  g_nmda -= dt * g_nmda / tau_nmda;

  if(v >= 30) {
    v = c;
    u += d;
    g_nmda += w_nmda;
    g_nmda = Math.min(g_nmda,max_g_nmda);
  }

  update_v_plot();
  update_u_plot();
  update_g_ampa_plot();
  update_g_gaba_plot();
  update_g_nmda_plot();
  update_current_plot();

  setTimeout(time_step,1000/dtpersec);
}

function draw_time_scale_line() {
  var num_dt = n/5;
  var scale_line = svg.append("line")
                  .attr("x1", neuron.x - num_dt*((neuron.x - input.x)/(n)))
                  .attr("y1", height/6)
                  .attr("x2", neuron.x)
                  .attr("y2", height/6)
                  .attr("stroke-width", 2)
                  .attr("stroke", "black");
  
  svg.append("text")
    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr("transform", "translate("+ (neuron.x - 0.5*num_dt*((neuron.x - input.x)/(n))) +","+(height/6 + 20)+")")  // text is drawn off the screen top left, move down and out and rotate
    .text(""+(num_dt*dt*1000)+" ms");
}

function set_up_environment() {
  update_parameters();
  rescale();
  initialize_svg();
  add_play_button();
  draw_neuron();
  v_plot();
  u_plot();
  g_ampa_plot();
  current_plot();
  draw_time_scale_line();

  setTimeout(time_step,1000);
}

window.onload = function() {
  width = document.body.clientWidth;
  height = document.body.clientHeight;
  set_up_environment();

  window.onresize = function(){ location.reload(); }
};
