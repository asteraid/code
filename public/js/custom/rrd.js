var charts = getListChart();
var chartMain;
var chartsPie = [];
var chartsLine = [];
var chartsValue = [];
var plot;
var scale;
var options = {
        legend: { show: true, position: "ne" },
        grid: {
          show: true,
          aboveData: true,
          color:'#3f3f3f',
          labelMargin: 15,
          axisMargin: 0, 
          borderWidth: 0,
          borderColor:null,
          minBorderMargin: 0,
          clickable: true, 
          hoverable: true,
          autoHighlight: true,
          mouseActiveRadius: 20
        },
        series: {
          grow: {active:false},
          lines: {
            show: true,
            fill: true,
            lineWidth: 2,
            steps: false
            }/*,
          points: {
            show:true,
            radius: 4,
            symbol: "circle",
            fill: true,
            borderColor: "#fff"
          }*/
        },
        xaxis: {mode: "time", timeformat: "%d.%m %h:%M"},
        yaxis: {min: 0},
        zoom: {
          interactive: true
        },
        pan: {
          interactive: true
        },
        navigationControl: {
          position: { left: "30px", top: "20px" },
          display: "block"
        },
        colors: ["#AFD8F5"]
      };

$.each(charts, function(index, chart) {
  if (chart.main) chartMain = chart.name;
  
  switch (chart.type) {
    case 'pie':
      chartsPie.push(chart.name);
      var html = $('<div class="easy-pie-item clicking"><div id="pie-' + chart.name + '" class="easy-pie-chart" data-percent="0"><span>0%</span></div><label>' + chart.label + '</label></div>').bind('click', function() {updateChartMain(chart.name);});
      $('.easy-pie-items').append(html);
    break;
    
    case 'value':
      chartsValue.push(chart.name);
      var html = $('<li id="value-' + chart.name + '" class="clicking" style="display: block;"><button class="btn btn-large span12" style="margin-bottom: 10px;"><span>' + chart.label + '</span>: <span class="chart-value" chart-format="' + chart.format + '"></span></button></li>').bind('click', function() {updateChartMain(chart.name);});
      $('.chart-values').append(html);
    break;			
  }
});

$('.flot-items').append('<div param-name="' + chartMain + '" class="chart-line" id="flot"></div>');

$('.easy-pie-chart').easyPieChart({
  animate: 1000,
  onStep: function(from, to, currentValue) {
    $(this.el).find('span').html(~~currentValue + '%');
  },
  lineWidth: 7,
  scaleColor: '#aaa',
  trackColor: '#eee'
});

updatePieCharts();
updateValueCharts();
updateChartMain();

function updatePieCharts() {
  var data = getDataCharts('pie', chartsPie);
  $.each(data, function(index, value) {
    var color	= '#FF3300';
    
    if (value < 70) color = '#009900';
    else if (value > 70 && value < 90) color = '#FFFF33';
    
    $('#pie-' + index).data('easyPieChart').update(value);
    $('#pie-' + index).data('easyPieChart').options['barColor'] = color;
  });
}

function updateChartMain(param) {
  //return ;
  if (plot) {
    var opt		= plot.getOptions();
    var axes	= plot.getAxes();

    //zoom, zoomOut, change position chart -> not update
    if (!
      (
        (opt.dxaxis.max === axes.xaxis.max) && (opt.dxaxis.min === axes.xaxis.min) && 
        (opt.dyaxis.max === axes.yaxis.max) && (opt.dyaxis.min === axes.yaxis.min)
      )
    ) return false;
  }

  var flot_id = '#flot';
  
  if (!param) param = chartMain;

  var chartInfo	= getChartInfo(param);
  var data		= getDataInterval(param);
  //console.info(chartInfo);
  if (plot) {plot.destroy(); plot = null;}
  $(flot_id).attr('param-name', param);
  
  var dataResult = [];
  $.each(data, function(name, obj) {
  
    $.each(obj, function(index, values) {
      dataResult.push({label: chartInfo.label + ' ' + name, data: values});
    });
    //if (plot) plot.destroy();
    //console.info('index', index);
    //$(flot_id).attr('param-name', param);
    /*
    var lines = [];
    $.each(value, function(i, values) {
      //console.info(index, values);
      //lines.push({label: chartInfo.label + ' - ' + index, data: values});
      lines = [{label: chartInfo.label + ' - ' + index, data: values}];
    });
    
    console.info(lines);
    */
    //plot = $.plot(flot_id, [{label: chartInfo.label, data: value}], options);
    
    //plot = $.plot(flot_id, [{data: [[3,3],[4,4]], lines: {show: true, fill: true}}, {data: [[1,1],[2,2]], bars: { show: true }}]);
    
    

    //add options params for goHome button on FlotControl
    //plot.getOptions().dxaxis = { min: plot.getAxes().xaxis.min, max: plot.getAxes().xaxis.max };
    //plot.getOptions().dyaxis = { min: plot.getAxes().yaxis.min, max: plot.getAxes().yaxis.max};
  });
  //console.info(dataResult);
  plot = $.plot(flot_id, dataResult, options);
  //dataResult = null;
  
  //add options params for goHome button on FlotControl
  plot.getOptions().dxaxis = { min: plot.getAxes().xaxis.min, max: plot.getAxes().xaxis.max };
  plot.getOptions().dyaxis = { min: plot.getAxes().yaxis.min, max: plot.getAxes().yaxis.max};
  
  chartMain = param;
}

function updateValueCharts() {
  var data = getDataCharts('value', chartsValue);
  $.each(data, function(index, value) {
    var html	= '';
    var obj		= $('#value-' + index + ' .chart-value');
    var format	= obj.attr('chart-format');

    switch(format) {
      case 'time':
        var time = convertSeconds(value);
        html = [time.d, 'd<span class="blink">:</span>', time.h, 'h<span class="blink">:</span>', time.m, 'm'].join('');						
      break;
      case 'nubmer':
      default:
        html = value;
      break;
    }
    
    obj.html(html);
  });
  
  blink('.blink');
}

function getChartInfo(name) {
  var response = {};
  
  $.each(charts, function(index, data) {
    if (data.name === name)
      response = data;
  });
  
  return response;
}

function blink(selector) {
  $(selector).fadeOut('slow',function() {
    $(this).fadeIn('slow',function() {
      blink(this);
    });
  });
}

setInterval(updatePieCharts, 20000);
setInterval(updateValueCharts, 20000);
setInterval(updateChartMain, 20000);

function getListChart() {
  var response = '';			
  $.ajax({
    type: 'GET',
    url: '/data/rrd/list',
    dataType: 'json',
    async: false,
    success: function(data) {
      if(data.success)
        response = data.rows;
    }
  });
  
  return response;
}

function getDataInterval(param) {
  var response = 0;
  $.ajax({
    type: "GET",
    url: '/data/rrd/get_data_interval',
    data: {param: param},
    dataType: "json",
    async: false,
    success: function(data) {
      if (data.success)
        response = data.result;
    }
  });
  
  return response;
}

function getDataCharts(type, params) {
  var response = 0;
  $.ajax({
    type: "GET",
    url: '/data/rrd/data_item',
    data: {params: params},
    dataType: "json",
    async: false,
    success: function(data) {
      if (data.success)
        response = data.result;
    }
  });
  
  return response;
}

function convertSeconds(s) {
  var d, h, m;
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;
  return { d: d, h: h, m: m, s: s };
};