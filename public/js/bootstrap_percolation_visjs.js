var nodes = null;
var edges = null;
var network = null;
var data = null;

function destroy() {
  if (network !== null) {
    network.destroy();
    network = null;
  }
}

function parameter_check() {
  var nodeCount = document.getElementById('nodeCount').value;
  var nNeighbours = document.getElementById('nNeighbours').value;
  var pBootstrap = document.getElementById('pBootstrap').value;
  var kPerc = document.getElementById('kPerc').value;
  var time_step = document.getElementById('timeStep').value;
  if(+nodeCount < 0) {
    var warning = document.getElementById("message");
    warning.innerHTML = 'The number of nodes must be non-negative';
    warning.style.visibility = "visible";
    warning.style.display = 'block';
    return false;
  }
  else if((+nNeighbours < 0) || (+nNeighbours > +nodeCount)) {
    var warning = document.getElementById("message");
    warning.innerHTML = 'The number of neighbours must be from 0 to number of nodes';
    warning.style.visibility = "visible";
    warning.style.display = 'block';
    return false;
  }
  else if(+kPerc < 1) {
    var warning = document.getElementById("message");
    warning.innerHTML = 'Percolation threshold must be at least 1';
    warning.style.visibility = "visible";
    warning.style.display = 'block';
    return false;
  }
  else if((+pBootstrap > 1) || (+pBootstrap < 0)) {
    var warning = document.getElementById("message");
    warning.innerHTML = 'Bootstrap probability must be in the range [0,1]';
    warning.style.visibility = "visible";
    warning.style.display = 'block';
    return false;
  }
  else if(+timeStep < 0) {
    var warning = document.getElementById("message");
    warning.innerHTML = 'The time step must be non-negative';
    warning.style.visibility = "visible";
    warning.style.display = 'block';
    return false;
  }
  return true;
}

function draw(){
  document.getElementById("message").style.visibility = "hidden";
  document.getElementById("message").style.display = "none";
  destroy();
  if(!parameter_check()) {
    return;
  }
  var nodeCount = document.getElementById('nodeCount').value;
  var nNeighbours = document.getElementById('nNeighbours').value;
  // create a network
  var container = document.getElementById('mynetwork');
  //var data = getScaleFreeNetwork(nodeCount);
  data = getRandomNetwork(nodeCount,nNeighbours/nodeCount);
  var options = {
    physics: { stabilization: false },
    edges:{smooth:{type:'continuous'}},
    manipulation: {
      enabled: false,
      editNode: function(nodeData,callback) {
        callback(nodeData);
        },
      editEdge: function(edgeData,callback) {
        callback(edgeData);
      }
    }
  };
  var pBootstrap = document.getElementById('pBootstrap').value;
  create_bootstrap(data.nodes, data.edges, pBootstrap);
  network = new vis.Network(container, data, options);

  var vxs = data.nodes.get();
  var es = data.edges.get();
  var active_color = '#7BE141';
  var inactive_color = '#96c1f9', inactive_border = '#3c84e5';
  network.on("click", function (params) {
        if(params.nodes.length > 0) {
          if(!vxs[params.nodes[0]].active) {
            vxs[params.nodes[0]].state = 0;
            vxs[params.nodes[0]].active = true;
            vxs[params.nodes[0]].processed = false;
            vxs[params.nodes[0]].color = active_color;
            for(var j = 0; j < es.length; ++j) {
              if(vxs[es[j].from].active || vxs[es[j].to].active) {
                es[j].color = active_color;
                data.edges.update(es[j]);
              }
            }
          }
          else {
            vxs[params.nodes[0]].state = 0;
            vxs[params.nodes[0]].active = false;
            vxs[params.nodes[0]].processed = false;
            vxs[params.nodes[0]].color = inactive_color;
            vxs[params.nodes[0]].color.border = inactive_border;
            for(var j = 0; j < es.length; ++j) {
              if(!(vxs[es[j].from].active || vxs[es[j].to].active)) {
                es[j].color = inactive_border;
                data.edges.update(es[j]);
              }
            }
          }
          data.nodes.update(vxs[params.nodes[0]]);
          for(var j = 0; j < vxs.length; j++) {
            vxs[j].processed = false;
            vxs[j].state = 0;
            data.nodes.update(vxs[j]);
          }
        }
    });
}

function percolate() {
  var K = document.getElementById('kPerc').value;
  var time_step = document.getElementById('timeStep').value;
  synchronous_percolation(data,K,time_step);
}

if (window.addEventListener) { // Mozilla, Netscape, Firefox
  window.addEventListener('load', WindowLoad, false);
} else if (window.attachEvent) { // IE
  window.attachEvent('onload', WindowLoad);
}

function WindowLoad(event) {
  draw();
}
