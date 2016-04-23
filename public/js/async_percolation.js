var threshold = 3;
// Random graph
var n_num = 100;
var p = 2*threshold/n_num;
var p_bootstrap = 0.2;
var active_color = "#96F387";
var inactive_color = "#FF948E";
var width = 500,
    height = 500;
var rate = 1.0; // For the exponential
var ldist = 100;
var time_unit = 5000;

var percolate;
var num_percolate = 0;

var fill, force, svg, rect, nodes, links, node, link;

var adj_list, bootstrap;

function translateAlongLine(u,v) {
    var l = ldist;
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
  num_percolate++;
  // Set parameters
  threshold = document.getElementById('kPerc').value;
  n_num = document.getElementById('nodeCount').value;
  p = document.getElementById('nNeighbours').value/n_num;
  p_bootstrap = document.getElementById('pBootstrap').value;

  fill = d3.scale.category20();

  // Force graph layout
  force = d3.layout.force()
      .size([width, height])
      .nodes([{}]) // initialize with a single node
      .linkDistance(ldist)
      .charge(-50)
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
  restart();


  // Vertices
  for(var i = 1; i < n_num; ++i) {
    nodes.push({x: width/2, y: height/2, state: 0, processed: false});
  }
  // Edges
  adj_list = [];
  for(var i = 0; i < n_num; ++i) {
    adj_list.push([]);
  }
  // TODO: Make more efficient?
  for(var i = 0; i < n_num; ++i) {
    for(var j = i+1; j < n_num; ++j) {
      if(Math.random() <= p) {
        var edge = {source: nodes[i], target: nodes[j]};
        links.push(edge);
        adj_list[i].push(j);
        adj_list[j].push(i);
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

function tick() {
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
    node.attr("fill", function(d){
          if(d.state >= threshold){
            return active_color;
          }
          return inactive_color;
        });
    node.attr("r",function(d) {
          return 5 + 5*Math.min(threshold,d.state)/threshold;
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
      .attr("fill",active_color)
      .duration(1000);
    adj_list[source].forEach(function(target) {
      if(!nodes[target].processed) {
        /* Create particle */
        var delay = (-Math.log(Math.random())/rate)*time_unit;
        var marker = svg.append("circle");
        marker.attr("r", 3)
          .attr("opacity", 0.5)
          .attr("fill", "green")
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
            nodes[target].state += 1;
            if(!nodes[target].processed) {
              d3.select(node[0][target])
              .transition()
              .attr("r",5 + 5*Math.min(threshold,nodes[target].state)/threshold)
              .duration(50)
              .each("end",function() {
                if(!nodes[target].processed && nodes[target].state >= threshold) {
                  expose_vertex(target);
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
