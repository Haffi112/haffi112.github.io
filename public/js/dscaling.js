var threshold = 3;
// Random graph
var e_num = 50;
var i_num = 50;
var p = 2*threshold/e_num;
var p_bootstrap = 0.2;
var timescale = 1000;
var excitatory_color = "#96F387";
var inhibitory_color = "#FF948E" ;
var inactive_color = "#4F4949"; //C4C4C4
var width = 500,
    height = 1000;
var rate = 1.0; // For the exponential
var ldist = 100;

var percolate;
var num_percolate = 0;

var fill, force, svg, rect, nodes, links, node, link;

fill = d3.scale.category20c();

var adj_list, unexposed_vertices, just_activated, adj_list_edge_copies;

var darkred = fill.range()[4], darkgreen = fill.range()[8], lightred = fill.range()[6], lightgreen = fill.range()[10];

function fill_node(d) {
  var cl;
  if(d.processed) {
    cl = (d.signal > 0)? darkgreen: darkred; 
  }
  else {
    cl = (d.signal > 0)? lightgreen: lightred;
  }
  //return (d.state <= threshold && !d.processed) ? d3.rgb(cl).darker(0.0) : d3.rgb(cl).brighter(0.5);
  return cl;
}

function stroke_node(d) {
  if(d.state >= threshold && d.processed) {
    return fill_node(d);
  }
  if(d.signal > 0){
    return fill.range()[10]; //8
  }
  else if(d.signal < 0) {
    return fill.range()[6]; //4
  }
}

function radius_node(d) {
  return (d.state >= 0) ? 10 + 10*Math.min(threshold,Math.max(0,d.state))/threshold : 10*Math.pow(1.1,d.state);
}

function set_svg(){
  svg = d3.select("#simulation")
        .append("svg")
        .attr("height", "90%")
        .attr("width", "100%");

    rect = svg.append("rect")
        .attr("height", "100%")
        .attr("width", "100%");
}

function translateAlongLine(u,v) {
    return function(i) {
      return function(t) {
        var x = (1-t)*u.x + t*v.x;
        var y = (1-t)*u.y + t*v.y;
        //var p = path.getPointAtLength(t * l);
        return "translate(" + x + "," + y + ")";//Move marker
      }
    }
  }

function create_graph() {
  width = d3.select("#simulation").node().getBoundingClientRect().width;
  height = 0.9*d3.select("body").node().getBoundingClientRect().height;
  ldist = height*30/(200*(1+e_num + i_num));
  console.log(ldist);
  
  num_percolate++;
  // Set parameters
  threshold = parseInt(document.getElementById('kPerc').value);
  e_num = parseInt(document.getElementById('nodeCount').value);
  i_num = parseInt(document.getElementById('inodeCount').value);
  p = parseFloat(document.getElementById('nNeighbours').value)/e_num;
  p_bootstrap = parseFloat(document.getElementById('pBootstrap').value);
  timescale = 1000*parseFloat(document.getElementById('delay').value);

  
  // Force graph layout
   force = d3.layout.force()
      .size([width, height])
      .nodes([{}]) // initialize with a single node
      .linkDistance(ldist)
      .linkStrength(1)
      .charge(-5000)
      .gravity(0.9)
      .on("tick", tick);
  // Location of display
  if(typeof svg != 'undefined') {
    d3.select("#simulation").selectAll("*").remove();
  }
  set_svg();

  // Globals
  nodes = force.nodes();
  links = force.links();
  node = svg.selectAll(".node");
  link = svg.selectAll(".link");

  nodes[0].state = 0;
  nodes[0].this_round_state = 0;
  nodes[0].processed = false;
  nodes[0].signal = 1;
  restart();


  // Vertices
  for(var i = 1; i < e_num; ++i) {
    nodes.push({x: 0.25*Math.random()*width+0.25*width, y: 0.5*Math.random()*height+height/4.0, state: 0, this_round_state: 0, processed: false, signal: 1});
  }
  for(var i = 0; i < i_num; ++i) {
    nodes.push({x: 0.25*Math.random()*width + width/2, y: 0.5*Math.random()*height+height/4.0, state: 0, this_round_state: 0, processed: false, signal: -1});
  }
  // Edges
  adj_list = [];
  adj_list_edge_copies = [];
  for(var i = 0; i < e_num + i_num; ++i) {
    adj_list.push([]);
    adj_list_edge_copies.push([]);
  }
  for(var i = 0; i < Math.floor(e_num) + Math.floor(i_num); ++i) {
    for(var j = i+1; j < e_num + i_num; ++j) {
      if(Math.random() <= p) {
        var edge = {source: nodes[i], target: nodes[j]};
        links.push(edge);
        adj_list[i].push(j);
        adj_list[j].push(i);
        adj_list_edge_copies[i].push(edge);
        adj_list_edge_copies[j].push(edge);
      }
    }
  }
  restart();

  unexposed_vertices = [];
  just_activated = [];
  // Bootstrap
  var itemsProcessed = 0;
  nodes.forEach(function(vertex) {
    if(Math.random() <= p_bootstrap) {
      vertex.state = threshold;
      just_activated.push(vertex.index);
    }
    itemsProcessed++;
    if(itemsProcessed === nodes.length) {
      restart();
    }
  });
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
    node.attr("fill", fill_node).attr("stroke",stroke_node).attr("r",radius_node);

    // Adds new nodes
    node.enter().insert("circle", ".cursor")
        .attr("class", "node")
        .attr("r", radius_node)
        .call(force.drag);

    force.start();
  }
function expose_vertex(source,cb=0) {
    nodes[source].processed = true;
    d3.select(node[0][source])
      .transition()
      .attr("r",40)
      .duration(100)
      .transition()
      .attr("r",radius_node)
      .duration(100)
      .transition()
      .attr("fill",fill_node)
      .duration(timescale*0.95)
      .attr("stroke",stroke_node)
      .each("end",function(){
        if(cb!=0) {
          cb();
        }
      });
    adj_list[source].forEach(function(target,idx) {
      if(!nodes[target].processed) {
        /* Create particle */
        var delay = timescale;
        var marker = svg.append("circle");
        nodes[target].this_round_state += nodes[source].signal;
        marker.attr("r", 3)
          .attr("opacity", 0.65)
          .attr("fill", function() {
            if(nodes[source].signal>0){
              return fill.range()[8];
            }
            else {
              return fill.range()[5];
            }})
          .attr("transform", "translate(" + nodes[source].x +","+nodes[source].y  + ")");
        marker.transition()
          .duration(delay)
          .attrTween("transform", translateAlongLine(nodes[source],nodes[target]))
          .remove();
      }
    });
  }

window.onload = function() {
  width = d3.select("#simulation").node().getBoundingClientRect().width;
  create_graph();

  restart();

  update_states_after_round = function update_states(cb) {
    let updated = nodes.map((vertex) => {
        return new Promise((resolve) => {
          vertex.state += vertex.this_round_state;
          vertex.state = (vertex.state > threshold)? threshold : vertex.state;
          if(!vertex.processed && vertex.state >= threshold) {
            just_activated.push(vertex.index);
          }
          if(!nodes[vertex.index].processed && vertex.this_round_state != 0) {
            // Change vertex look (size or color)
            d3.select(node[0][vertex.index])
              .transition()
              .attr("r",radius_node)
              .duration(50)
              .each("end",function() {
                if(!nodes[vertex.index].processed && nodes[vertex.index].state < 0) {
                  d3.select(node[0][vertex.index])
                    .transition()
                    .attr("fill", fill_node)
                    .attr("stroke", stroke_node)
                }
              });
          }
          vertex.this_round_state = 0;
          resolve();
        });
      });
    Promise.all(updated).then(() => setTimeout(cb,timescale));
  }

  // Percolation is recursive
  // 1. We expose all vertices in 'just_activated'
  // 2. We update the states of all vertices and add newly active to 'just_activated'
  percolate = function percolate() {
    timescale = 1000*parseFloat(document.getElementById('delay').value);
    if(just_activated.length > 0) {
      unexposed_vertices = just_activated;
      just_activated = [];

      let exposures = unexposed_vertices.map((item) => {
        return new Promise((resolve) => {
          expose_vertex(item,resolve);
        })
      });
      Promise.all(exposures).then(() => update_states_after_round(percolate));
    }
  }

  var aspect = width / height;
  d3.select(window)
    .on("resize", function() {
      width = d3.select("#simulation").node().getBoundingClientRect().width;
      height = d3.select("svg").node().getBoundingClientRect().height;
      var targetWidth = width;
      var targetHeight = height;
      force.size([width,height]);
    });
};
