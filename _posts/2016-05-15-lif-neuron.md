---
layout: post
title: Leaky integrate and fire neurons (LIF)
custom_css:
- lifneuron
custom_js:
- d3/d3.min
---
<p class="message">
This post assumes basic understanding of neurons. For a short
introduction to neurons please see <a
href="https://simple.wikipedia.org/wiki/Neuron">this</a> Wikipedia
article.
</p>

There are
[multiple](https://en.wikipedia.org/wiki/Biological_neuron_model)
existing models for biological neurons, some which even contradict each
other. In this post we explore the *leaky-integrate and fire* neuron
model (LIF) which is commonly used in simulations which mimic neural
networks found in the brain. It has the advantage of being simple while
also capturing the large scale dynamics of how a single neuron
functions.

Note that not all of the cells in our brains *spike* (i.e.
transmit digital signals) and behave like the one we discuss below. Most
of the cells which we call neurons do spike however. It is commonly
acknowledged that the signals they send amongst themselves form the
basis of information dissemination and computation in the brain.

The LIF neuron corresponds to what is called a *membrane voltage* model.
It is inspired by
[experiments](https://en.wikipedia.org/wiki/Squid_giant_axon), first
carried out by
[Hodgin](https://en.wikipedia.org/wiki/Alan_Lloyd_Hodgkin) and
[Huxley](https://en.wikipedia.org/wiki/Andrew_Huxley) in the 1950s,
which measure the voltage difference inside and outside a neuron. The
model is quite simple, we can give some input to the neuron, in the form
of an electrical current, and we can observe how the voltage across the
membrane changes over time.

Before the experiments of Hodgin and Huxley the *integrate-and-fire*
neuron model (note that the *leaky* part is missing) had already been
proposed. It is in fact a variant of the model we have used in the
previous posts on [bootstrap percolation]({% post_url
2016-04-25-percolation-with-inhibition %}). In that model a neuron never
*forgets* the input it received in the past. If it requires two input
spikes in order to spike itself it is even allowed that these two spikes
come a year apart from each other. In reality this is a different story
and any trace of the first spike would vanish a few milliseconds later.
Do note however that integrate-and-fire models are still useful, for
example when modelling phenomena which occurs at a very short timescale.

The fact that neurons forget old spikes corresponds to the *leaky* part
in the name. You can think of a neuron as a bucket. When it receives
input a bit of water gets added to the bucket. When the bucket is full
it spikes and that spike corresponds to adding a bit of water to all the
neighbouring buckets. However, there is a catch, the bucket has a hole
in the bottom so the water leaks out.

If you want to skip the math part now is the time to scroll down to the
bottom to see a live, interactive simulation of a LIF neuron.

The water level in the bucket corresponds to the membrane voltage of the
neuron. The neuron prefers to be a bit polarised and its *resting
potential* (corresponding to an empty bucket) is at around $$-70$$ mV.
Whenever the neuron receives an input spike some channels will open on
the membrane and ions will flow through which depolarises the neuron.
The neuron has some ion pumps on the membrane which actively pump these
ions back out which corresponds to the *leak*.

Since the membrane voltage changes over time we can model it using a
differential equation. Such an equation tells us how the membrane
voltage changes in one moment. We denote the voltage at time $$t$$ by
$$V(t)$$ and we denote the resting potential by $$E_L$$ (also known as the
*leak reversal potential*). Additionally we denote the input to the
neuron at time $$t$$ by $$g_e(t)$$ and the excitatory reversal potential
by $$E_E$$ which is the membrane voltage which the input is driving the
neuron towards.

For a short time interval $$\Delta t$$ the voltage changes as follows

$$
\begin{align*}
V(t+\Delta t) =& V(t)\\& - \Delta t \cdot A\cdot g_L\cdot (V(t)-E_L) \\
&- \Delta t\cdot B \cdot g_e(t)\cdot (V(t)-E_E)
\end{align*}
$$

where $$A$$ and $$B$$ are positive constants. So you see that on the one
hand the voltage, $$V(t)$$ is drawn towards $$E_L$$ via the constant
leak and on the other hand it is drawn towards $$E_E$$ via the input
current (here modelled as conductance). One popular approach to model
the input conductance is via exponential decay, the conductance then
simply behaves as

$$
\begin{align*}
g_e(t+\Delta t) =& g_e(t) -\Delta t\cdot C\cdot g_e(t)
\end{align*}
$$

where $$C$$ is also some positive constant. We additionally increase
$$g_e(t)$$ by some value $$w$$ whenver the neuron receives an input
where $$w$$ corresponds to the weight of the incoming synapse. This
still does not capture how the neuron spikes. As in the
integrate-and-fire model it just needs to cross some threshold, which we
denote by $$V_{th}$$. So whenever $$V(t)$$ exceeds $$V_{th}$$ the neuron
emits a spike. Following the spike the neuron enters a *refractory
period* where it ignores all incoming spikes. After that period the
membrane voltage is reset to a fixed value, denoted by
$$V_{\text{reset}}$$ which is called the *reset potential*.

Below you can see an interactive simulation of a LIF neuron following
the dynamics described above. You can press the input neuron on the left
to send a spike to the output neuron on the right. You can visualise the
membrane potential of the target neuron via the radius of the circle
representing it. The dynamics of the membrane potential are 100 times
slower than in reality (otherwise you would not see much happening) and
the parameters as seen above are set to somewhat realistic values. Note
however that the time to deliver the spike between the two neurons and
the time in the refractory period is exaggarated for demonstration
purposes. If you want to run large scale simulations using this type of
neuron you can do so using the
[nest-simulator](http://www.nest-initiative.org/) and the
[$$\mathtt{iaf\_cond\_exp}$$](https://github.com/nest/nest-simulator/blob/master/models/iaf_cond_exp.cpp)
neuron model (the parameters chosen are from there).

<div id="neuron"></div>

<script>
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

</script>


