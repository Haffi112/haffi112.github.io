---
layout: post
title: Asynchronous Bootstrap Percolation
custom_css:
- async_percolation
custom_js:
- d3/d3.min
- async_percolation
---
In the [previous post]({% post_url 2016-03-27-bootstrap-percolation %})
we discussed bootstrap percolation, a process which models the
disseminaiton of information in a graph. In this post we will see a
slight variation of the process. Percolation is traditionally defined to
be round based. However, in reality processes such as rumor spreading,
disease transmission and neural signals are usually not synchronous.
This leads to an asynchronous variant of the process (scroll down if you
are eager to see the visualisation).

As before, when a vertex turns active, you can think of it as sending a
message to all its neighbours notifying them of its new state (or
infecting them with some disease). The messages do not arrive instantly.
In the synchronous setting  we had to wait for one round until they
arrived, corresponding to a time delay of 1. In the asynchronous setting
these delays can be arbitrary. In {% cite einarsson2014bootstrap %} we
studied for instance the case when all the edges draw their delay from
an exponential distribution with expected delay 1. Recall that as in {%
cite janson2012bootstrap %} we studied the process on $$G_{n,p}$$, the
Erdős–Rényi [random
graph](https://en.wikipedia.org/wiki/Erdős–Rényi_model) model. As it
turned out, such a slight modification had an interesting quantitative
effect on the process. The activity percolated much faster!

We showed that asymptotically such a process requires only constant time
in expectation to activate all the vertices whereas the synchronous
process can require up to $$\sim\log\log(np)$$ rounds in expectation.
This improved speed is due to the fact that once enough many messages
are being delivered almost certainly some of them will be extremely fast
which further fuels the process. You can think of the process in terms
of three phases, the *startup phase*, which decides if the activity
survives or not, the *explosion phase* where almost all the vertices
turn active (and is the main contributor to the double exponential speed
of the round based process) and finally the *clean up phase* where the
last few vertices turn active. In our setting the explosion phase is
instantaneous, formally it takes time $$o(1)$$ (less than constant) to
activate almost all the vertices (after the initial hurdle of getting
the process started).

Below you can see an implementation of asynchronous bootstrap
percolation where the expected delay of a message is initially set to
five seconds (you can play with the parameters in the box below, be
warned though, too many vertices can slow down the performance). If you
choose the parameters nicely you will notice that the slow messages are
usually too slow to make any difference. The simulation was made using
[d3js](https://d3js.org). Since javascript is asynchronous it is a
perfect candidate to perform these simulations.

<div id="simulation">
</div>

<form onsubmit="create_graph(); return false;" style="margin-bottom:20px">
  <input type="button" value="Build graph" onclick="create_graph()">
  <input type="button" value="Percolate" onclick="percolate()">
  <table style="max-width: 720px; font-size:75%; margin-bottom:10px">
  <tr>
    <td>
    <label for="nodeCount">Number of vertices (<i>n</i>)</label>
    </td>
    <td>
      <input id="nodeCount" type="text" value="50" style="width: 50px;">
    </td>
  </tr>
  <tr>
    <td>
    <label for="nNeighbours">Expected degree (<i>np</i>), average number
    of neighbors</label>
    </td>
    <td>
      <input id="nNeighbours" type="text" value="6" style="width: 50px;">
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
    <label for="delay">Expected edge delay (seconds)</label>
    </td>
    <td>
      <input id="delay" type="text" value="5.0" style="width: 50px;">
    </td>
  </tr>
</table>
</form>

<p class="message" id="message" style="visibility:hidden;">

</p>

## References

{% bibliography --cited %}

