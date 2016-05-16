---
layout: post
title: Percolation with inhibition - part 1
custom_css:
- async_percolation
custom_js:
- d3/d3.min
- async_percolation_with_inhibition
---
In the previous posts we have discussed [synchronous]({% post_url
2016-03-27-bootstrap-percolation %}) and [asynchronous]({% post_url
2016-04-08-asynchronous-percolation %}) bootstrap percolation, processes
which model the dissemination of information in a graph.

In these previous models we only studied vertices which could excite
their neighbours. This is a good basic model for the spread of diseases
or gossip. However in other settings we might instead have competing
forces. For instance the messages might represent product
recommendations from friends. If all your friends recommend some brand
you might be triggered to buy it. However, if some of your friends
recommend another you might change your decision on what to buy or
simply be confused. Similarly in the brain some of the neurons are
excitatory and send positive messages while others are inhibitory and
send negative messages. The inhibitory neurons are quite important
because if excitation is abundant the activity can run out of control
which can lead to epileptic seizures.

Thus it becomes natural to study the question what happens if instead we
allowed some of the nodes to be negative? That is exactly what we did in
{% cite einarsson2014bootstrap %}. We made some interesting observations
which I will highlight in follow up posts.

Below you can see an implementation of asynchronous bootstrap
percolation with inhibition made with [d3js](https://d3js.org). The
green nodes send positive messages and the red nodes send negative
messages. Each vertex keeps track of how many positive messages it has
seen minus the number of negative vertices. We refer to this as the
*potential* of the vertex. A vertex turns active (and remains active) if
its potential ever reaches $$K$$. You can try to control which fraction
of the green vertices turn active by changing the number of negative
vertices. When the potential of a vertex becomes negative we color the
vertex blue. Vertices which reach this state have a lower chance of ever
turning active. They can but for most of them they are essentially
frozen.

<div id="simulation">
</div>

<form onsubmit="create_graph(); return false;" style="margin-bottom:20px">
  <input type="button" value="Build graph" onclick="create_graph()">
  <input type="button" value="Percolate" onclick="percolate()">
  <table style="max-width: 720px; font-size:75%; margin-bottom:10px">
  <tr>
    <td>
    <label for="nodeCount">Number of positive vertices (green)</label>
    </td>
    <td>
      <input id="nodeCount" type="text" value="30" style="width: 50px;">
    </td>
  </tr>
  <tr>
    <td>
    <label for="inodeCount">Number of negative vertices (red) </label>
    </td>
    <td>
      <input id="inodeCount" type="text" value="30" style="width: 50px;">
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
      <input id="delay" type="text" value="1.0" style="width: 50px;">
    </td>
  </tr>
</table>
</form>

<p class="message" id="message" style="visibility:hidden;">

</p>

## References

{% bibliography --cited %}

