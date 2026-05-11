var width = d3.select("#neuron").node().getBoundingClientRect().width;
var height = 300;
var delay = 250;
var neuronradius = 15;
var msgradius = 5;

var m_V = -70.0E-3; // Membrane voltage
var g_E = 0.0; // Excitatory synaptic conductance
var t_delta = 1E-4; // 0.1 ms, so we need to update every 10 ms

var spike_effect = 1.0E-3;
var membrane_capacitance = 250E-12; // Capacity of the membrance
var E_E= 0.0; // Excitatory reversal potential
var E_L = -70E-3;   // Leak reversal potential
var g_L = 16.6667E-9; // Leak conductance, nS
var V_T = -55E-3    // Threshold potential
var V_reset = -60E-3 // Reset potential
var t_ref = 2.5E-3 // Refractory period
var weight = 1E-7;
var t_syn = 0.2E-3;

var realTimeDelay = 10;
var realTimeRefractoryPeriod = 1000;

var started = false;
var spiking = false;
var blowup = 3000;

var thresholdradius = neuronradius + (V_T - E_L)*blowup;
var resetradius = neuronradius + (V_reset-E_L)*blowup;

var fill = d3.scale.category20c();


var svg = d3.select("#neuron").append("svg")
    .attr("width", width)
    .attr("height", height);

var play = svg.append("g")
    .attr("class", "play");

play.append("circle")
    .attr("r", neuronradius)
    .attr("stroke-width", ".5px")
    .attr("transform", "translate(" + width / 4 + "," + height / 2 + ")")
    .on("mousedown", function() {
      play.classed("mousedown", true);
      d3.select(window).on("mouseup", function() { play.classed("mousedown", false);
        // Input spike
        var input_spike = svg.append("circle");
        input_spike.attr({
            cx: width/4.0,
            cy: height/2.0,
            fill: fill.range()[8],
            r: neuronradius + (m_V-E_L)*blowup,
            opacity:1.0
          })
        input_spike.transition()
          .duration(150)
          .ease("linear") // For more easing info check http://bl.ocks.org/hunzy/9929724
          .attr("r",200)
          .attr("opacity",0)
          .remove();
        // Message
        var marker = svg.append("circle");
        marker.attr({
            cx: width/4.0,
            cy: height/2.0,
            fill: fill.range()[8],
            r: neuronradius,
            opacity:0.5
          })
        marker.transition()
          .duration(delay)
          .ease("circle") // For more easing info check http://bl.ocks.org/hunzy/9929724
          .attr("cx",3*width/4.0)
          .attr("r",msgradius)
          .each("end", function(){
            if(!spiking) {
              g_E += weight;
            }
            if(!started) {
              started=true;
              setTimeout(update,10);
            }
           })
          .remove();
      });
    })
    .on("click", function() {
      });

var neuron = svg.append("g")
  .attr("class", "neuron");

var neuron_threshold = neuron.append("circle")
    .attr({fill:"none",
        "stroke-width":"1.5px",
        stroke:"#000",
        "stroke-linejoin":"round",
        "opacity": 0.5,
        "stroke-dasharray":"10,10"})
    .attr("r", neuronradius + (V_T - E_L)*blowup)
    .attr("transform", "translate(" + 3*width / 4 + "," + height / 2 + ")");

var neuron_reset = neuron.append("circle")
    .attr({fill:"none",
        "stroke-width":".5px",
        stroke:"#000",
        "stroke-linejoin":"round"})
    .attr("r", resetradius)
    .attr("transform", "translate(" + 3*width / 4 + "," + height / 2 + ")");

var neuroncircle = neuron.append("circle")
    .attr("r", neuronradius)
    .attr("fill",d3.rgb(fill.range()[8]).brighter((m_V-E_L)*150))
    .attr("transform", "translate(" + 3*width / 4 + "," + height / 2 + ")")
    .attr("opacity", 0.5);

function update() {
  spiking = false;
  //console.log(m_V);
  //console.log(g_E);
  g_E = g_E - (t_delta/t_syn)*g_E;
  m_V = m_V + (t_delta/membrane_capacitance)*( -g_L*(m_V - E_L) - g_E*(m_V - E_E));
  neuroncircle.transition().duration(0).attr("r",neuronradius + (m_V-E_L)*blowup)
  .attr("fill",d3.rgb(fill.range()[8]).brighter((m_V-E_L)*150));

  if(!spiking && m_V > V_T) {
    spiking = true;
    m_V = V_reset;
    neuroncircle.transition().duration(0)
      .attr("r",neuronradius + (m_V-E_L)*blowup)
      .attr("fill",fill.range()[4]);
    var marker = svg.append("circle");
    marker.attr({
        cx: 3*width/4.0,
        cy: height/2.0,
        fill: fill.range()[8],
        r: neuronradius + (m_V-E_L)*blowup,
        opacity:1.0
      })
    marker.transition()
      .duration(500)
      .ease("linear") // For more easing info check http://bl.ocks.org/hunzy/9929724
      .attr("r",200)
      .attr("opacity",0)
      .remove();
    setTimeout(update,realTimeRefractoryPeriod);
  }
  else if(m_V - E_L < 0.0005) {
    started = false;
  }
  else {
    setTimeout(update,realTimeDelay);
  }
}

var arc_margin = 1.1;
var arc_margin2 = 1.05;

// Threshold label

//Create an SVG path
svg.append("path")
	.attr("id", "threshold_radius_margin") //very important to give the path element a unique ID to reference later
	.attr("d", "M "+((3*width/4.0)-arc_margin*thresholdradius)+","+height/2.0+" A "+arc_margin*thresholdradius+","+arc_margin*thresholdradius+" 0 0,1 "+((3*width/4.0)+arc_margin*thresholdradius)+","+height/2.0+"") //Notation for an SVG path, from bl.ocks.org/mbostock/2565344
	.style("fill", "none");

//Create an SVG text element and append a textPath element
svg.append("text")
  .classed("unselectable",true)
  .append("textPath") //append a textPath to the text element
	.attr("xlink:href", "#threshold_radius_margin") //place the ID of the path here
	.style("text-anchor","middle") //place the text halfway on the arc
	.attr("startOffset", "50%")
  .text("Spiking threshold")
  .attr("font-size",14);

// Reset potential label
svg.append("path")
	.attr("id", "reset_radius_margin") //very important to give the path element a unique ID to reference later
	.attr("d", "M "+((3*width/4.0)-arc_margin2*resetradius)+","+height/2.0+" A "+arc_margin2*resetradius+","+arc_margin2*resetradius+" 0 0,1 "+((3*width/4.0)+arc_margin2*resetradius)+","+height/2.0+"") //Notation for an SVG path, from bl.ocks.org/mbostock/2565344
	.style("fill", "none");

//Create an SVG text element and append a textPath element
svg.append("text")
  .classed("unselectable",true)
  .append("textPath") //append a textPath to the text element
	.attr("xlink:href", "#reset_radius_margin") //place the ID of the path here
	.style("text-anchor","middle") //place the text halfway on the arc
	.attr("startOffset", "50%")
  .text("Reset potential")
  .attr("font-size",11);

play.append("text").attr("text-anchor", "middle")
  .attr("x",width/4.0)
  .attr("dy",4*height/5.0)
  .classed("unselectable",true)
  .text("Input neuron")
  .attr("font-size",14);

neuron.append("text").attr("text-anchor", "middle")
  .attr("x",3*width/4.0)
  .attr("dy",4*height/5.0)
  .classed("unselectable",true)
  .text("Output neuron")
  .attr("font-size",14);
