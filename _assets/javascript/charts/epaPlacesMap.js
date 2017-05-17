'use strict';

var epaPlacesMap = Class.extend({
  init: function(containerId){
    var margin = {top: 10, right: 10, bottom: 10, left: 10};
    
    this.data = null;
    this.pop = null;
    this.epa = null;
    this.width = d3.select(containerId).node().clientWidth - margin.left - margin.right;
    this.height = this.width * 0.8 - margin.top - margin.bottom;
    this.padding = 4;

    this.svg = d3.select(containerId).append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
  },
  getData: function() {
    d3.queue()
      .defer(d3.json, '/data/es-municipalities.v1.json')
      .defer(d3.json, '/data/income.json')
      .await(function(error, es, pop) {
        this.data = es;
        this.pop = pop;
        
        this.data.objects.municipalities.geometries.forEach(function(d) {
          d.id = +d.id;
          return d
        })
        
        this.updateRender();
      }.bind(this));
  },
  render: function() {
    if (this.data === null) {
      this.getData();
    } else {
      this.updateRender();
    }
  },
  updateRender: function(callback) {
    var ccaa = topojson.feature(this.data, this.data.objects.autonomous_regions);
    var places = topojson.feature(this.data, this.data.objects.municipalities);
    var provinces = ccaa.features;
    
    var cities = [
      {
        'id': '13',
        'name': 'Madrid',
        'coords': [-3.6808241, 40.4078974]
      },
      {
        'id': '09',
        'name': 'Barcelona',
        'coords': [2.1487679, 41.3947901]
      },
      {
        'id': '01',
        'name': 'Sevilla',
        'coords': [-5.9270774, 37.3629559]
      },
      {
        'id': '10',
        'name': 'Valencia',
        'coords': [-0.3615113, 39.4077853]
      },
      {
        'id': '16',
        'name': 'Bilbao',
        'coords': [-2.9334981, 43.2633224]
      },
      {
        'id': '12',
        'name': 'Santiago',
        'coords': [-8.5468296, 42.8859281]
      }
    ];
    
    var popObj = [];
    this.pop.forEach(function(d) {
      popObj[d.location_id] = d;
    });
    
    var projection = d3.geoConicConformalSpain()
      .fitSize([this.width, this.height], ccaa)
    
    var color = d3.scaleThreshold()
      .domain([12, 14, 16, 18, 20, 22, 24, 26])
      .range(['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a']);

    var path = d3.geoPath()
      .projection(projection);
      
    this.svg.append("path")
      .datum(topojson.mesh(this.data, this.data.objects.nation))
      .attr("class", "nation")
      .attr("d", path);
    
    this.svg.append("path")
      .datum(topojson.mesh(this.data, this.data.objects.provinces, function(a, b) { return a !== b; }))
      .attr("class", "border")
      .attr("d", path);
  
    var triangleScale = d3.scaleQuantile()
      .range([1, 4, 8, 12, 16, 20])
      .domain([10396, 61643])
      // .clamp(true)
      
    this.svg.append('g')
      .attr('class', 'ccaa')
      .selectAll('path')
      .data(places.features)
      .enter()
      .append('path')
      .attr('class', 'triangles')
      .attr('d', function(d) { 
        var x = projection(d3.geoCentroid(d)), y = projection(d3.geoCentroid(d));
        if (popObj[d.id]) {
          return 'M ' + x +' '+ y + ' l 3 ' + triangleScale(popObj[d.id].value) + ' M ' + x + ' ' + y + ' l -3 ' + triangleScale(popObj[d.id].value);
        }
      })
      // .attr('stroke', '#111')
      .attr('stroke', function(d) {
        if (popObj[d.id]) {
          return popObj[d.id].value > 24602 ? 'steelblue' : 'darkred';
        }
      })
    
    var citiesLabels = this.svg.append('g')
      .attr('class', 'cities')
      .selectAll('g')
      .data(cities)
      .enter();
      
    var city = citiesLabels
      .append('g')
      .attr('class', 'city')
      .attr('transform', function(d) {
        return 'translate(' + projection(d.coords)[0] + ',' + projection(d.coords)[1] + ')'
      })
      
    // city.append('rect')
    //   .attr('width', 6)
    //   .attr('height', 6)
    //   .attr('stroke', 'black')
    //   .style('fill', 'white')
      
    city.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .style('fill', 'white')
      .style('text-shadow', '1px 1px 0 #111, -1px -1px 0 #111, 1px -1px 0 #111, -1px 1px 0 #111')
      .text(function(d) { return d.name; });
    
    // Canary islands path
    this.svg.append('path')
      .style('fill','none')
      .style('stroke','black')
      .attr('d', projection.getCompositionBorders());
      
    var legend = this.svg.append('g')
      .attr('transform', 'translate(' + (this.width - 225) + ',' + (this.height - 40) + ')')
      .attr('class', 'legend');
      
    legend.selectAll('rect')
      .data(color.range())
      .enter()
      .append('rect')
      .attr('x', function(d, i) {
        return i * 25
      })
      .attr('width', 25)
      .attr('height', 10)
      .attr('fill', function(d) {
        return d;
      })
    
    legend.selectAll('text')
      .data(color.domain())
      .enter()
      .append('text')
      .attr('dx', 19)
      .attr('dy', '25')
      .attr('x', function(d, i) {
        return i * 25;
      })
      .text(function(d) {
        return d;
      })
    
    legend.append('text')
      .attr('class', 'legend-title')
      .text('Tasa de paro (%)')
      .attr('dy', -8);
      
  },
});
