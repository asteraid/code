var RRDTool		= require('node-rrdtool-custom');
var path      = config.rrdDir;
var db        = require('../../modules/db');

exports.list = function(req, res) {
  getDashboardItems(req, res, function(error, results) {
    if (!error)
      res.json({success: true, rows: results});
    else
      res.json({success: false, message: error});
  });
}

var getDashboardItems = function(req, res, callback) {
  var query = "SELECT * FROM `user_settings` WHERE `module` = 'dashboard' AND `category` = 'chart'";

  db.query(req, query, function (err, results, fields) {
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
    } else callback(err.code, []);
  });
}

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
      if (files.length > 0)
        getRRDFetch(rrd, path + files[0], time.start, time.end, time.step, onGetRRDFetch);
      else
        res.json({success: false, message: "Files not found"});
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
      
      if (files.length > 0)
        getDashboardItems(req, res, function(error, results) {
          if (!error && results.length > 0) {
            results.forEach(function(item) {
              paramsCalc[item.name] = item.calculation;
            });
            
            getRRDInfo(rrd, path + files[0], onGetRRDInfo);
          } else
            res.json({success: false, message: error});
        });
      else 
        res.json({success: false, message: "Files not found"});
    }
  });
  
  var onGetRRDInfo = function(response) {
    var fileName = files.shift().split('.').slice(0, -1);

    if (params && response) {
      result[fileName] = {};
			params.forEach(function(item) {
				result[fileName][item] = response[item] ? response[item].last_ds : 0;
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