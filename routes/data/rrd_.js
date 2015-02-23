exports.list = function(req, res) {
var db = new database(req, res);
    if(db.connect) {
        var query = "SELECT * FROM `user_settings` WHERE `module` = 'dashboard' ORDER BY 'category'";
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length > 0) {
                    var categories = {};

					results.forEach(function(item) {
						if(!categories[item.category]) categories[item.category] = {};
						categories[item.category][item.var_name] = item.var_val;
                    });
					
                    res.json({success: true, rows: categories});
                    console.info(categories);
                    db.destroy();
                } else {
                    res.json({success: false, rows: [], message: 'Not found items'});
                    db.destroy();
                }
            } else res.json({success: false, rows: [], message: err.code });
        });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
}


exports.data_item = function (req, res) {

	var RRDTool = require('node-rrdtool'),
		filename = req.param('filename'),
		type = req.param('type'),
		period = req.param('period'),
		labels = req.param('labels') ? req.param('labels').split(';') : [];
	var rrd = new RRDTool();

	var query = {};
	query.end = 'now';
	query.step = null;

	switch(period) {
		case 'day':
			query.start = 'now-1d';
		break;
		case 'week':
			query.start = 'now-1w';
		break;
		case 'month':
			query.start = 'now-1m';
		break;
		case 'year':
			query.start = 'now-11m';
			//query.step = 60 * 60 * 24 * 5;
		break;
		default:
			//query.start = 'now-1w';
            query.start = 'now-1d';
	}
	
    console.log(config.rrd_path + filename);
	//rrd.fetch(config.rrd_path + filename, 'AVERAGE', 'now-1h' /*query.start*/, 'now' /*query.end*/, query.step, function(error, response) {
	//var category = 'df';
	//var cat = "df";
	var cat = "memory";
	var st = {
		"type":"pie",
		"files":
			[
				{"name":"memory-free.rrd", "fields":["value"]},
				{"name":"memory-used.rrd", "fields":["value"]},
			],
		"label":"Used RAM"
	};
	/*var st = {
		"type":"pie",
		"files":
			[
				{"name":"df-root.rrd", "fields":["free", "used"]}
			],
		"label":"Used disk"
	};*/

	switch(st.files.length) {
		case 1:
			var file = st.files[0];
			var fileRRD = config.rrd_path + cat + '/' + file.name;
			getRRDInfoPie(rrd, fileRRD, function(response) {
				var val1 = response[file.fields[0]].last_ds;
				var val2 = response[file.fields[1]].last_ds;
				var result = 100*(val2/val1);
			});
		break;
		case 2:
			var file1 = st.files[0];
			var file2 = st.files[1];
			var fileRRD1 = config.rrd_path + cat + '/' + file1.name;
			var fileRRD2 = config.rrd_path + cat + '/' + file2.name;
			
			getRRDInfoPie(rrd, fileRRD1, function(response) {
				var val1 = response[file1.fields[0]].last_ds;
				getRRDInfoPie(rrd, fileRRD2, function(response) {
					var val2 = response[file2.fields[0]].last_ds;
					var result = 100*(val2/val1);
					console.log(result);
				});
			});
		break;
	}
	if (st.files.length == 1) {
		
	}

	function getRRDInfoPie(rrdtool, file, callback) {
		rrdtool.info(file, function(error, response) {
			callback(response);
		});
	}
	
	/*rrd.fetch(config.rrd_path + filename, 'AVERAGE', query.start, query.end, query.step, function(error, response) {
        console.log(error, response);
		if(!error) {
			//convert to javascript time
			var length = response.data.length;
			for(i=0; i<length; i++)
				response.data[i][0] *= 1000;
			
			if(type == 'pie') {
				response.data = response.data[length-2];
				response.data = [
                    {label: labels[0], data: 100 - response.data[1]},
                    {label: labels[1], data: response.data[1]}
                ];
			}

            console.log(response.data);
			res.json({success: true, rows: response.data, message: ''});
		} else
			res.json({success: false, rows: [], message: ''});
	});*/
};