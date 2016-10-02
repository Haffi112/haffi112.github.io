var threshold = 3;
// Random graph
var e_num = 50;
var i_num = 50;
var p = 2*threshold/e_num;
var p_bootstrap = 0.2;
var excitatory_color = "#96F387";
var inhibitory_color = "#FF948E" ;
var inactive_color = "#4F4949"; //C4C4C4
var width = 500,
    height = 500;
var rate = 1.0; // For the exponential
var ldist = height/2;
var time_unit = 1000;

var percolate;
var num_percolate = 0;

var fill, force, svg, rect, nodes, links, node, link;

var adj_list, bootstrap, adj_list_edge_copies;

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
  num_percolate++;
  // Set parameters
  threshold = parseInt(document.getElementById('kPerc').value);
  e_num = parseInt(document.getElementById('nodeCount').value);
  i_num = parseInt(document.getElementById('inodeCount').value);
  p = parseFloat(document.getElementById('nNeighbours').value)/e_num;
  p_bootstrap = parseFloat(document.getElementById('pBootstrap').value);

  fill = d3.scale.category20c();

  // Force graph layout
  force = d3.layout.force()
      .size([width, height])
      .nodes([{}]) // initialize with a single node
      .linkDistance(ldist)
      .linkStrength(0.05)
      //.charge(-50)
      .on("tick", tick);
 
  //console.log(d3.select("#simulation").node().getBoundingClientRect().width);
  // Location of display
  if(typeof svg == 'undefined') {
    svg = d3.select("#simulation")
        .append("svg")
        .attr("height", height)
        .attr("width", width)

    rect = svg.append("rect")
        .attr("height", height)
        .attr("width", width);
        //.attr("height", height);
  }
  else {
    d3.select("#simulation").selectAll("*").remove();
    svg = d3.select("#simulation").append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height);
  }

  // Globals
  nodes = force.nodes();
  links = force.links();
  node = svg.selectAll(".node");
  link = svg.selectAll(".link");

  nodes[0].state = 0;
  nodes[0].processed = false;
  nodes[0].signal = 1;
  restart();


  // Vertices
  for(var i = 1; i < e_num; ++i) {
    nodes.push({x: 0.25*Math.random()*width+0.25*width, y: 0.5*Math.random()*height+height/4.0, state: 0, processed: false, signal: 1});
  }
  for(var i = 0; i < i_num; ++i) {
    nodes.push({x: 0.25*Math.random()*width + width/2, y: 0.5*Math.random()*height+height/4.0, state: 0, processed: false, signal: -1});
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

  bootstrap = [];
  // Bootstrap
  var itemsProcessed = 0;
  nodes.forEach(function(vertex) {
    if(Math.random() <= p_bootstrap) {
      vertex.state = threshold;
      bootstrap.push(vertex.index);
    }
    itemsProcessed++;
    if(itemsProcessed === nodes.length) {
      restart();
    }
  });
}

function tick(e) {
    var k = 15 * e.alpha;

    /*nodes.forEach(function(o, i) {
      //o.y += i & 1 ? k : -k;
      o.x += o.signal>0 ? -k : k;
    });*/

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
        /*.attr("opacity", function(d) {if(d.source.processed || d.target.processed) {
          return 0.25;
        }
        else {
          return 0.75;
        }});*/

    node.attr("cx", function(d) { d.x += d.signal>0 ? -k : k; return d.x; })
        .attr("cy", function(d) { return d.y; });
  }

function restart() {
    link = link.data(links);

    link.enter().insert("line", ".node")
        .attr("class", "link");

    node = node.data(nodes);

    // Update the color based on the state
    // TODO: Change inactive color to match type as well!
    node.attr("fill", function(d){
          if(d.state >= threshold && d.signal > 0){
            return fill.range()[10];
          }
          else if(d.state >= threshold && d.signal < 0) {
            return fill.range()[6];
          }
          return fill.range()[18];
        }).
      attr("stroke",function(d){
          if(d.state >= threshold && d.signal > 0){
            return fill.range()[8];
          }
          else if(d.state >= threshold && d.signal < 0) {
            return fill.range()[4];
          }
          return fill.range()[16];
        });
    node.attr("r",function(d) {
          return 5 + 5*Math.min(threshold,Math.max(0,d.state))/threshold;
    });

    // Adds new nodes
    node.enter().insert("circle", ".cursor")
        .attr("class", "node")
        .attr("id", function(d){
          if(d.state >= threshold){
            return "active";
          }
          return "inactive";
        })
        .attr("r", 5)
        .call(force.drag);


    force.start();
  }
function expose_vertex(source) {
  nodes[source].processed = true;
    //node = node.data(nodes);
    d3.select(node[0][source])
      .transition()
      .attr("r",20)
      .duration(100)
      .transition()
      .attr("r",10)
      .duration(100)
      .transition()
      .attr("fill",function(d) {
        if(d.state >= threshold && d.signal > 0){
            return fill.range()[10];
          }
          else if(d.state >= threshold && d.signal < 0) {
            return fill.range()[6];
          }
          return fill.range()[18];
      })
      .duration(1000)
      .attr("stroke",function(d){
          if(d.state >= threshold && d.signal > 0){
            return fill.range()[8];
          }
          else if(d.state >= threshold && d.signal < 0) {
            return fill.range()[4];
          }
          return fill.range()[16];
        });
    adj_list[source].forEach(function(target,idx) {
      if(!nodes[target].processed) {
        /* Create particle */
        var delay = (-Math.log(Math.random())/rate)*time_unit;
        var marker = svg.append("circle");
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
        var tmp_perc = num_percolate;
        setTimeout(function() {
          // This condition is just to prevent old signals from
          // activating vertices if the user presses the restart button
          // while the process is still running.
          if(tmp_perc == num_percolate) {
            nodes[target].state += nodes[source].signal;
            if(!nodes[target].processed) {
              d3.select(node[0][target])
              .transition()
              .attr("r",5 + 5*Math.min(threshold,Math.max(0,nodes[target].state))/threshold)
              .duration(50)
              .each("end",function() {
                if(!nodes[target].processed && nodes[target].state >= threshold) {
                  expose_vertex(target);
                }
                else if(!nodes[target].processed && nodes[target].state < 0) {
                  d3.select(node[0][target])
                    .transition()
                    .attr("fill", function() {
                         return d3.rgb(fill.range()[1]).darker(-nodes[target].state-2);
                    })
                }
                else if (!nodes[target].processed) {
                  d3.select(node[0][target])
                    .transition()
                    .attr("fill",function() {
                          return fill.range()[18];
                    });
                }
              });
            }
          }
        }
        ,delay);
      }
    });
  }

window.onload = function() {
  width = d3.select("#simulation").node().getBoundingClientRect().width;
  create_graph();

  restart();

  percolate = function percolate() {
    time_unit = 1000.0*document.getElementById('delay').value;
    bootstrap.forEach(function(source){
      setTimeout(function() {expose_vertex(source);},500);
    });
  }

  var aspect = width / height;
  d3.select(window)
    .on("resize", function() {
      var targetWidth = d3.select("#simulation").node().getBoundingClientRect().width;
      svg.attr("width", targetWidth);
      rect.attr("width", targetWidth);
    });
};
