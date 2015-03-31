var RRDTool		= require('node-rrdtool');
var path      = '/opt/plentystars/store/rrd/';

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


/*exports.get_data_interval = function(req, res) {
	var rrd			= new RRDTool();
	var param		= req.param('param');
	
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
}*/

exports.get_data_interval = function(req, res) {
  var fs      = require('fs');
	var rrd			= new RRDTool();
	var param		= req.param('param');
  var files   = fs.readdirSync(path);
  var result  = {};
  var time    = {};
    time.start = '-1440min';
    time.end   = '-1min';
    time.step  = '60';
  
  var callbackFunc = function(response) {
    var fileName = files.shift().split('.').slice(0, -1);

    if (param && response !== undefined) {
      result[fileName] = {};
      result[fileName][param] = [];
      
      var paramIndex = response.headers.indexOf(param);
      
      response.data.forEach(function(item) {
        if (isNaN(item[paramIndex]))
          item[paramIndex] = 0;
          
        result[fileName][param].push([item[0]*1000, item[paramIndex]]);
      });
      
      if (files.length > 0) {
        getRRDFetch(rrd, path + files[0], time.start, time.end, time.step, callbackFunc);
      } else {
        res.json({success: true, result: result});
      }
		}
  };
  
  getRRDFetch(rrd, path + files[0], time.start, time.end, time.step, callbackFunc);
	
  /*
	if (param) {
		getRRDFetch(rrd, config.rrd_path, '-1440min', '-1min', '60', function(response) {
			var result = {};
			result[param] = [];
			
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
  */
}

exports.data_item = function (req, res) {
  var fs      = require('fs');
  var files   = fs.readdirSync(path);
	var rrd     = new RRDTool();
  var params  = req.param('params');
  
  var result = {};
  
  /*files.forEach(function(item) {
    result[item.split('.').shift()] = {};
  });*/
  
  //console.log(result);
  //res.json({success: false});
  
  var callbackFunc = function(response) {
    var fileName = files.shift().split('.').slice(0, -1);

    if (params && response) {
      result[fileName] = {};
			params.forEach(function(item) {
				result[fileName][item] = response[item].last_ds;
			});
      
      if (files.length > 0) {
        getRRDInfo(rrd, path + files[0], callbackFunc);
      } else {
        var count = Object.keys(result).length;
        
        // sum every param
        var obj = {};
        for (var index in result) { 
          if (result.hasOwnProperty(index)) {
            var attr = result[index];
            
            for (var prop in result[index]) {
              if (result[index].hasOwnProperty(prop)) {
                if (obj.hasOwnProperty(prop))
                  obj[prop] = 0;

                obj[prop] += 1 * result[index][prop];
              }
            }
          }
        }
        
        //average value
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            obj[i] = obj[i]/count;
          }
        }
        
        res.json({success: true, result: obj});
      }
		}
  };
  
  getRRDInfo(rrd, path + files[0], callbackFunc);
  
  /*getRRDInfo(rrd, '/home/andrew/git/ps-projects/test/rrd/hosts/' + files[0], function(response) {
    var fileName = files.shift().split('.').slice(0, -1);
    
    if (params && response) {
      result[fileName] = {};
			params.forEach(function(item) {
				result[fileName][item] = response[item].last_ds;
			});
      
      if (files.length > 0) {}
		}*/ //else {
      //res.json({success: true, result: result});
    //}
    
    //console.log(result);
    
    //res.json({success: false});
		/*if (params && response) {
			params.forEach(function(item) {
				result[item] = response[item].last_ds;
			});
		} else {
      res.json({success: true, result: result});
    }
		res.json({success: true, result: result});*/
  //});
  
  
  /*
	var type		= req.param('type');
	var params		= req.param('params');
	
	getRRDInfo(rrd, config.rrd_path, function(response) {
		var result = {};
		if (params && response)
			params.forEach(function(item) {
				result[item] = response[item].last_ds;
			});
		
		res.json({success: true, result: result});
	});*/
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
