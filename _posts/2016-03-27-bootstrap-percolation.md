---
layout: post
title: Bootstrap percolation
custom_js:
- vis.min
- vis_utils
- bootstrap_percolation_visjs
---
If you have ever heard about
*[percolation](https://en.wikipedia.org/wiki/Percolation "Percolation on
Wikipedia")* it might have been in the context of making coffee. That
is, when brewing by filtering water through grinded coffee beans it is a
desireable feature that the water can eventually pass through.
Consequently the particles need to be large enough for the material to
be porous and for the water to *percolate* through. This article is not
about brewing coffee unless you want to get really creative but bear in
mind that copious amounts of caffeine were part of its creative process
regardless.

*So what kind of percolation are you talking about then? Please explain
like I'm five.*

Imagine that your friend just got a new shiny toy. He shows it to you
and you want it. You ask your parents but they say no. In time more of
your friends get the toy and you still want it. Still your parents say
no but they realise this will be a great gift and they buy the toy for
your next birthday.

<!---
and you express to your parents how your whole mental
model of what is important in the world has radically changed. You
parents resist, you are torn and broken but life goes on. Suddenly more
of your friends get this new toy. The situation becomes different, you
are now a social outcast, your status has been reduced to that of a
pawn. Nobody plays with you anymore, you are a tribe of one, the old
toys are worthless. You are now dressing in black and wearing white make
up. The staff at the kindergarten start getting worried when you start
chanting dark summoning rituals in recess. Eventually, after realising
antidepressants are not an efficient treatment for this condition, your
parents give in to societal pressures and buy you the new toy. The
balance of the world is restored.
-->

You probably already made the connection of how this short example
relates to brewing coffee. If not let me explain. Think of yourself as
an empty cell defined by the finely grained coffee bean particles around
you. If it is not too disturbing you can think of your friends as
adjacent cells. When one of your friends got a new toy in this analogy
their cell was filled with water. For a single adjacent cell full of
water the pressure is not sufficient for the water to enter your cell
but once enough many adjacent cells get filled yours gets filled as
well.

So you see, percolation has something to do with the dissemination of
information in a network. Some other good examples are gossip and rumor
spreading as well as advertising campaigns -- it is important to know
which individuals in a social network one should pay to advertise a
product in order to reach as many potential customers as possible (you
can start throwing your free products at me now). It is also valuable to
know if a banking network is stable and how many individuals need to
default on their loans for the network to collapse {% cite
amini2014inhomogeneous %}. Another great example is the spread of
diseases. For every encounter with an infected individual the chances
of becoming infected increase. My favorite example of bootstrap
percolation is the way neurons communicate in the brain. Neurons
communcate by sending
[spikes](https://en.wikipedia.org/wiki/Neural_coding) to their
neighbors. If a neuron receives a couple of spike signals it will also
spike and thus inform all of its neighbors, quite amazing. Finally
percolation can be described by a [cellular
automaton](https://en.wikipedia.org/wiki/Cellular_automaton) which is
the setting in which it was first studied {% cite chalupa1979bootstrap
%} (but motivated by physics) and since then it has been extensively
studied on the grid in arbitrarily many dimensions {% cite
balogh2012sharp %}.

As you might have realised percolation is literally everywhere around
us. It is therefore not surprising how interest in it has percolated.
Below I will define more formally the process. This is where things
start to get just slightly technical. In case you want to skip the
technical parts just scroll down to the bottom of the article to play
with the javascript simulation.

*Bootstrap percolation* (also known as iterative retrieval) is a simple
model for the spread of activity in a graph/network. The vertices in the
process have two states, either they are *active* or *inactive*. The
process traditionally proceeds in rounds. Let *K*>0 be a threshold
parameter. In any given round all inactive vertices turn active which
have at least *K* active neighbours from previous rounds. Once a vertex
turns active it remains active for the rest of the process. The
*bootstrap* just refers to the set of initially active vertices and
*percolation* refers to this spread of activity.

This is the most common definition but there are also some variations of
the process which I will not cover in this post. When a vertex turns
active in the description above you can think of it as the vertex
telling all its neighbours that it turned active and this *message*
takes one round to be delivered.

Generally the process is studied formally on some specific graph classes
where as I mention above the lattice was the first candidate. I've been
fortunate to work with some amazing people on a couple of projects
involving bootstrap percolation {% cite einarsson2014bootstrap %} which
will be the topic of a future post. Our study was sparked by the results
by Janson, Luczak, Turova and Vallier {% cite janson2012bootstrap %}
which analysed bootstrap percolation, the process above, on the [Erdös
Renyi random graph](https://en.wikipedia.org/wiki/Erdős–Rényi_model).
The random graph is quite simple, each edge is present independently
with some probability *p* which is a parameter of the model. For *n*
vertices the expected number of neighbors is thus *np*. Janson et. al
discovered that percolation has a *threshold property* on the random
graph. If the bootstrap is below the threshold then almost no additional
vertices turn active. But if it is above the threshold the activity
percolates, that is almost every vertex turns active.

You can play with the process on the random graph below. The parameters
can be chosen below and additionally you can turn the vertices between
an active and an inactive state by clicking on them. The simulation was
made with [visjs](http://visjs.org) and the code is available on my
github page. Please note that at the moment the code scales
quadratically in *n* so simulations for large values of *n* will be
slow. Additionally the network layout has a hard time converging to a
stable state when there are many vertices and the graph is not sparse.

The [next post]({% post_url 2016-04-08-asynchronous-percolation %})
discusses a variation of the process which is not round based.

<div id="mynetwork" style="max-width: 720px; height: 720px;border: 1px solid lightgray;"></div>

<form onsubmit="draw(); return false;" style="margin-bottom:20px">
<table style="max-width: 720px; font-size:75%; margin-bottom:10px">
<tr>
  <td>
  <label for="nodeCount">Number of vertices (<i>n</i>)</label>
  </td>
  <td>
    <input id="nodeCount" type="text" value="25" style="width: 50px;">
  </td>
</tr>
<tr>
  <td>
  <label for="nNeighbours">Expected degree (<i>np</i>), average number
  of neighbors</label>
  </td>
  <td>
    <input id="nNeighbours" type="text" value="5" style="width: 50px;">
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
  <label for="pBootstrap">Probability of being in the bootstrap</label>
  </td>
  <td>
    <input id="pBootstrap" type="text" value="0.2" style="width: 50px;">
  </td>
</tr>
<tr>
  <td>
  <label for="timeStep">Time step length in milliseconds (1000 <i>ms</i> = 1 second)</label>
  </td>
  <td>
    <input id="timeStep" type="text" value="1000" style="width: 50px;">
  </td>
</tr>
</table>
  <input type="button" value="Build graph" onclick="draw()">
  <input type="button" value="Percolate" onclick="percolate()">
</form>

<p class="message" id="message" style="visibility:hidden;">

</p>

## Acknowledgements
Thanks to [Guðmundur](http://www2.compute.dtu.dk/~guei/) for reading a
draft of this post.

## References

{% bibliography --cited %}

