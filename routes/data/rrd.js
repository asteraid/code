var RRDTool		= require('node-rrdtool-custom');
var path      = config.rrdDir;//'/opt/plentystars/store/rrd/';

exports.list = function(req, res) {
  getDashboardItems(req, res, function(error, results) {
    if (!error)
      res.json({success: true, rows: results});
    else
      res.json({success: false, message: error});
  });
}

/*exports.list = function(req, res) {
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
}*/

var getDashboardItems = function(req, res, callback) {
  var db = new database(req, res);

  if (db.connect) {
    var query = "SELECT * FROM `user_settings` WHERE `module` = 'dashboard' AND `category` = 'chart'";
    db.connect.query(query, function (err, results, fields) {
      if (!err) {
        if (results.length > 0) {
          var var_name	= [];
          var var_val		= {};
          var priority	= 0;

					results.forEach(function(item) {
						var_val		= JSON.parse(item.var_val);
						priority	= var_val.priority;

						var_val.name        = item.var_name;
						var_name[priority]  = var_val;
          });
					
					//remove null elements from var_name
					var_name = var_name.filter(function(elem) {return elem !== null});
					
          callback(null, var_name);
        } else {
          callback('Not found items', []);
        }
        db.destroy();
        
      } else callback(err.code, []);
    });
   } else callback('Error session', []);
}

/*exports.get_data_interval = function(req, res) {
	var rrd			= new RRDTool();
	var param		= req.param('param');
	
	if (param) {
		getRRDFetch(rrd, config.rrdDir, '-1440min', '-1min', '60', function(response) {
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

exports.test = function(req, res) {
  var fs = require('fs');
  fs.readdir(path, function(error, files) {
    console.log(error, files);
  });
  res.json({success: true});
}

exports.get_data_interval = function(req, res) {
  var fs      = require('fs');
	var rrd			= new RRDTool();
	var param		= req.param('param');
  var files;
  var result  = {};
  var time    = {};
    time.start = '-30min';
    time.end   = '-1min';
    time.step  = '60';
    
  fs.readdir(path, function(error, items) {
    if (error) res.json({success: false, message: error.message});
    else {
      files = items;
      getRRDFetch(rrd, path + files[0], time.start, time.end, time.step, onGetRRDFetch);
    }
  });

  var onGetRRDFetch = function(response) {
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
        getRRDFetch(rrd, path + files[0], time.start, time.end, time.step, onGetRRDFetch);
      } else {
        res.json({success: true, result: result});
      }
		}
  }
}

exports.data_item = function (req, res) {
  var fs          = require('fs');
  var files;
	var rrd         = new RRDTool();
  var params      = req.param('params');
  var paramsCalc  = {};
  var result      = {};
  var resultRaw   = {};
  
  fs.readdir(path, function(error, items) {
    if (error) res.json({success: false, message: error.message});
    else {
      files = items;
      
      getDashboardItems(req, res, function(error, results) {
        if (!error && results.length > 0) {
          results.forEach(function(item) {
            paramsCalc[item.name] = item.calculation;
          });
          
          getRRDInfo(rrd, path + files[0], onGetRRDInfo);
        } else
          res.json({success: false, message: error});
      });
    }
  });
  
  var onGetRRDInfo = function(response) {
    var fileName = files.shift().split('.').slice(0, -1);

    if (params && response) {
      result[fileName] = {};
			params.forEach(function(item) {
				result[fileName][item] = response[item] ? response[item].last_ds : 0;
        //console.log('response => ', response[item]);
			});
      
      if (files.length > 0) {
        getRRDInfo(rrd, path + files[0], onGetRRDInfo);
      } else {
        //agregate and convert data
        for (var index in result) { 
          if (result.hasOwnProperty(index)) {
          
            for (var prop in result[index]) {
              if (result[index].hasOwnProperty(prop)) {
                
                if (!resultRaw.hasOwnProperty(prop))
                  resultRaw[prop] = [];
                
                resultRaw[prop].push(1 * result[index][prop]);
              }
            }
          }
        }
        
        function NaNtoZero(a) {
          if (a instanceof Array)
            a.forEach(function(item, index) {
              a[index] = isNaN(item) ? 0 : item;
            });
          else
            a = isNaN(a) ? 0 : a;

          return a;
        }
        
        var obj = {};
        params.forEach(function(name) {
          switch (paramsCalc[name]) {
            case 'SUM':
              obj[name] = resultRaw[name].reduce(function(a, b) {return NaNtoZero(a) + NaNtoZero(b);}, 0);
            break;
            
            case 'AVG':
              obj[name] = resultRaw[name].reduce(function(a, b) {return NaNtoZero(a) + NaNtoZero(b);}, 0)/resultRaw[name].length;
            break;
            
            case 'MAX':
            default:
              obj[name] = Math.max.apply(null, NaNtoZero(resultRaw[name]));
            break;
          }
        });
        
        console.info('resultRaw=>', resultRaw, 'obj=>', obj);
        res.json({success: true, result: obj});
      }
		}
  }
}

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
