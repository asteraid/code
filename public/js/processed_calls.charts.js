/**
 * processed_calls charts
 * rrdtool xport --json -s -1h -e now --step 100 \
    DEF:x1=/var/lib/collectd/rrd/sarpbx01/asterisk/processed_calls.rrd:value:AVERAGE \
    XPORT:x1:'Processed Calls'
**/
$(document).ready(function(){
	
var rrdtool = { about: 'RRDtool xport JSON output',
  meta: {
    start: 1390470760,
    step: 140,
    end: 1390470760,
    legend: [
      'Processed Calls'
          ]
     },
  data: [
    [ 8.5714285714e-02 ],
    [ 7.8571428571e-02 ],
    [ 7.8214285714e-02 ],
    [ 5.6428571429e-02 ],
    [ 8.5000000000e-02 ],
    [ 1.2250000000e-01 ],
    [ 5.7142857143e-02 ],
    [ 1.1571428571e-01 ],
    [ 1.5571428571e-01 ],
    [ 8.9285714286e-02 ],
    [ 1.1071428571e-01 ],
    [ 9.0000000000e-02 ],
    [ 1.1928571429e-01 ],
    [ 5.9285714286e-02 ],
    [ null ],
    [ 1.0571428571e-01 ],
    [ 8.7142857143e-02 ],
    [ 1.0642857143e-01 ],
    [ 9.2857142857e-02 ],
    [ 1.3571428571e-01 ],
    [ 1.3982142857e-01 ],
    [ 1.0928571429e-01 ],
    [ 7.2142857143e-02 ],
    [ 5.9285714286e-02 ],
    [ 8.1428571429e-02 ],
    [ null  ]
  ]
};
var starttime = rrdtool.meta.start;
var step = rrdtool.meta.step;
var data = [];
var curtime = starttime
var offset = new Date().getTimezoneOffset() * 60 * 1000;
console.log(offset);
$.each(rrdtool.data,function(index, value){
    data.push([curtime*1000,value]);
    curtime += step;
});
console.log(data);
	// === Prepare the chart data ===/
	//var data = [ [1390470760*1000,8.5714285714e-02],[1390470900*1000, 7.8571428571e-02] ] ;

	// === Make chart === //
    var plot = $.plot($(".chart_calls"),
           [ { data: data, label: "Processed Calls", color: "#BA1E20"} ], {
               series: {
                   lines: { show: true },
                   points: { show: true }
               },
	       xaxis: {
		    mode: "time"
		    
		},
		yaxis: {
		  axisLabel: "Processed Calls"  
		},
               grid: { hoverable: true, clickable: true }
		   });
    
	// === Point hover in chart === //
    var previousPoint = null;
    $(".chart_calls").bind("plothover", function (event, pos, item) {
		
        if (item) {
            if (previousPoint != item.dataIndex) {
                previousPoint = item.dataIndex;
                
                $('#tooltip').fadeOut(200,function(){
					$(this).remove();
				});
                var x = (new Date(item.datapoint[0]+offset)).toTimeString().substring(0,8),
					y = item.datapoint[1].toFixed(2);
                    
                unicorn.flot_tooltip(item.pageX, item.pageY,item.series.label + " of " + x + " = " + y);
            }
            
        } else {
			$('#tooltip').fadeOut(200,function(){
					$(this).remove();
				});
            previousPoint = null;           
        }   
    });	
    
   
});


unicorn = {
		// === Tooltip for flot charts === //
		flot_tooltip: function(x, y, contents) {
			
			$('<div id="tooltip">' + contents + '</div>').css( {
				top: y + 5,
				left: x + 5
			}).appendTo("body").fadeIn(200);
		}
}
