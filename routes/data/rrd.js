var RRDTool		= require('node-rrdtool');

exports.list = function(req, res) {
var db = new database(req, res);
    if(db.connect) {
        var query = "SELECT * FROM `user_settings` WHERE `module` = 'dashboard' AND `category` = 'chart'";
        db.connect.query(query, function (err, results, fields) {
			//console.log(results);
            if(!err) {
                if(results.length > 0) {
					var var_name	= [];
					var var_val		= {};
					var priority	= 0;

					results.forEach(function(item) {
						var_val		= JSON.parse(item.var_val);
						priority	= var_val.priority;

						var_val.name = item.var_name;
						var_name[priority] = var_val;
                    });
					
					//remove null elements from var_name
					var_name = var_name.filter(function(elem) {return elem !== null});
					
                    res.json({success: true, rows: var_name});
                    db.destroy();
                } else {
                    res.json({success: false, rows: [], message: 'Not found items'});
                    db.destroy();
                }
            } else res.json({success: false, rows: [], message: err.code });
        });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
}


exports.get_data_interval = function(req, res) {
	var rrd			= new RRDTool();
	var param		= req.param('param');
	
	//console.log(rrd, param);
	
	if (param) {
		getRRDFetch(rrd, config.rrd_path, '-1440min', '-1min', '60', function(response) {
			var result = {};
			result[param] = [];
			//console.log(response);
			
			if (response !== undefined) {
				var paramIndex = response.headers.indexOf(param);
			
				response.data.forEach(function(item) {
					if (isNaN(item[paramIndex]))
						item[paramIndex] = 0;
						
					result[param].push([item[0]*1000, item[paramIndex]]);
				});
			}
				
			res.json({success: true, result: result});
		});
	} else {
		res.json({success: false});
	}
}

exports.data_item = function (req, res) {
	var rrd			= new RRDTool();
	var type		= req.param('type');
	var params		= req.param('params');
	
	getRRDInfo(rrd, config.rrd_path, function(response) {
		var result = {};
		if (params && response)
			params.forEach(function(item) {
				result[item] = response[item].last_ds;
			});
		
		res.json({success: true, result: result});
	});
};

function getRRDInfo(rrdtool, file, callback) {
	rrdtool.info(file, function(error, response) {
		callback(response);
	});
}
	
function getRRDFetch(rrdtool, file, start, end, resolution, callback) {
	rrdtool.fetch(file, 'AVERAGE', start, end, resolution, function(error, response) {
		callback(response);
	});
}
