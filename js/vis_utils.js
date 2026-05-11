/**
 * Created by Alex on 5/20/2015.
 * Modified by Haffi on 3/27/2016.
 */

function loadJSON(path, success, error) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        success(JSON.parse(xhr.responseText));
      }
      else {
        error(xhr);
      }
    }
  };
  xhr.open('GET', path, true);
  xhr.send();
}

function shadeColor2(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function blendColors(c0, c1, p) {
    var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
    return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
}

active_color = '#7BE141';

function synchronous_percolation(graph,K,time_step) {
  var step = 0;
  var loop = setInterval(function() {
    step += 1;
    if(!step_percolation(graph,K,step)) {
      clearInterval(loop);
    }
  }, time_step);
}

function step_percolation(graph,K,step_number) {
  var vxs = graph.nodes.get();
  var es = graph.edges.get();
  for(var i = 0; i < vxs.length; i++) {
    if(vxs[i].active && !vxs[i].processed) {
      for(var j = 0; j < es.length; j++) {
        if(es[j].from == vxs[i].id) {
          vxs[es[j].to].state += 1;
          graph.nodes.update(vxs[es[j].to]);
        }
        else if(es[j].to == vxs[i].id) {
          vxs[es[j].from].state += 1;
          graph.nodes.update(vxs[es[j].from]);
        }
      }
      vxs[i].label = String(step_number);
      vxs[i].processed = true;
      graph.nodes.update(vxs[i]);
    }
  }
  var added = 0;
  for(var i = 0; i < vxs.length; i++) {
    if(!vxs[i].active && vxs[i].state >= K) {
      vxs[i].active = true;
      vxs[i].color = blendColors(active_color,'#ffffcc', 1.0-1.0/(1.5*Math.sqrt(step_number)));
      graph.nodes.update(vxs[i]);
      for(var j = 0; j < es.length; ++j) {
        if(vxs[es[j].from].active || vxs[es[j].to].active) {
          es[j].color = active_color;
          graph.edges.update(es[j]);
        }
      }
      added += 1;
    }
  }
  return added > 0;
}

function create_bootstrap(nodes,edges,p_a) {
  for(var i = 0; i < nodes.length; i++) {
    var rand = Math.random();
    if(rand < p_a) {
      nodes.update({id: i,
      color: active_color,
      active: true});
    }
  }/*
  var edge_data = edges.get();
  for(var i = 0; i < edge_data.length; ++i) {
    if(nodes.get(edge_data[i].from).active || nodes.get(edge_data[i].to).active) {
      edge_data[i].color = active_color;
      edges.update(edge_data[i]);
    }
  }*/
}

function getRandomNetwork(nodeCount, p) {
  var nodes = new vis.DataSet();
  var edges = new vis.DataSet();

  // randomly create some nodes and edges
  for (var i = 0; i < nodeCount; i++) {
    nodes.add({
      id: i,
      label: '',
      active: false,
      processed: false,
      state: 0
    });
  }

  for (var i = 0; i < nodeCount; i++) {
    for (var j = i+1; j < nodeCount; j++) {
      var rand = Math.random();
      if(rand < p) {
        edges.add({
          from: i,
          to: j
        });
      }
    }
  }

  return {nodes:nodes, edges:edges};
}

function getScaleFreeNetwork(nodeCount) {
  var nodes = [];
  var edges = [];
  var connectionCount = [];

  // randomly create some nodes and edges
  for (var i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i,
      label: String(i)
    });

    connectionCount[i] = 0;

    // create edges in a scale-free-network way
    if (i == 1) {
      var from = i;
      var to = 0;
      edges.push({
        from: from,
        to: to
      });
      connectionCount[from]++;
      connectionCount[to]++;
    }
    else if (i > 1) {
      var conn = edges.length * 2;
      var rand = Math.floor(Math.random() * conn);
      var cum = 0;
      var j = 0;
      while (j < connectionCount.length && cum < rand) {
        cum += connectionCount[j];
        j++;
      }


      var from = i;
      var to = j;
      edges.push({
        from: from,
        to: to
      });
      connectionCount[from]++;
      connectionCount[to]++;
    }
  }

  return {nodes:nodes, edges:edges};
}

var randomSeed = 764; // Math.round(Math.random()*1000);
function seededRandom() {
  var x = Math.sin(randomSeed++) * 10000;
  return x - Math.floor(x);
}

function getScaleFreeNetworkSeeded(nodeCount, seed) {
  if (seed) {
    randomSeed = Number(seed);
  }
  var nodes = [];
  var edges = [];
  var connectionCount = [];
  var edgesId = 0;


  // randomly create some nodes and edges
  for (var i = 0; i < nodeCount; i++) {
    nodes.push({
      id: i,
      label: String(i)
    });

    connectionCount[i] = 0;

    // create edges in a scale-free-network way
    if (i == 1) {
      var from = i;
      var to = 0;
      edges.push({
        id: edgesId++,
        from: from,
        to: to
      });
      connectionCount[from]++;
      connectionCount[to]++;
    }
    else if (i > 1) {
      var conn = edges.length * 2;
      var rand = Math.floor(seededRandom() * conn);
      var cum = 0;
      var j = 0;
      while (j < connectionCount.length && cum < rand) {
        cum += connectionCount[j];
        j++;
      }


      var from = i;
      var to = j;
      edges.push({
        id: edgesId++,
        from: from,
        to: to
      });
      connectionCount[from]++;
      connectionCount[to]++;
    }
  }

  return {nodes:nodes, edges:edges};
}
