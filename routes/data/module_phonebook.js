var db        = require('../../modules/db');
var fs        = require('fs');
var scheduler = require('../../modules/scheduler');

var moduleName  = 'phonebook';
var table       = {};

table.columns   = '`m_phonebook_columns`';
table.items     = '`m_phonebook_items`';
table.values    = '`m_phonebook_values`';
table.settings  = '`modules_values`';


exports.test_d = function(req, res) {
  var path   = require("path");
  var appDir = path.dirname(require.main.filename);
  var module = require(appDir + "/routes/data/module_phonebook");
  var db     = require(appDir + "/modules/db");

  module._current_item(function(error, results) {
    if (error) callback(error);
    else {
      if (results.length > 0) {
        var settings = {};
        results.forEach(function(item) {
          settings[item.name] = item.value;
        });
        
        module._download(settings.url, function(error, result) {
          if (error) callback(error);
          else {
            
          }
          //res.json({error: error, result: result});
          //console.log(error, result);
        });
      } else callback({code: "Current item empty"});
    }
  });
}

exports.get_phone_book = function(req, res) {
  res.render('../views/module_phonebook_list',
    {
      title:      config.application_name,
      //itemId:     itemId,
      itemName:   '',
      req_params: req.query,
      multi:      config.multi
    }
  );
}

exports._current_item = function(callback) {
  var query = [
    'SELECT', 
      '*',
    'FROM',
      table.settings,
    'WHERE',
      '`module_name` = ?', 'AND',
      '`active` = ?'
  ].join(' ');
  db.query(db.getConfig(null, true), query, [moduleName, 1], function(error, results) {
    if (!error && results.length > 0)
      callback(error, results);
    else
      callback(error);
  });
}

exports.get_current_item = function(req, res) {
  _current_item(function(error, results) {
    if (error) res.json({success: false});
    else
      res.json({success: true, results: results});
  });
  /*var query = [
    'SELECT', 
      '*',
    'FROM',
      table.settings,
    'WHERE',
      '`module_name` = ?', 'AND',
      '`active` = ?'
  ].join(' ');
  db.query(db.getConfig(null, true), query, [moduleName, 1], function(error, results) {
    if (!error && results.length > 0)
      res.json({success: true, results: results});
    else
      res.json({success: false});
  });*/
}

exports.get_contacts = function(req, res) {
  var params = {};
  
  params.id = req.param('id');
  
  var query = [
    'SELECT',
      '`mpc`.`name`, `mpc`.`order`, `mpv`.`value`, `mpv`.`row`',
    'FROM',
      table.values + ' `mpv`',
    'JOIN',
      table.columns + ' `mpc`',
    'ON',
      '(`mpv`.`column_id` = `mpc`.`id`)',
    'WHERE',
      '`mpc`.`item_id` = ?'
  ].join(' ');
  
  db.query(db.getConfig(null, true), query, [params.id], function(error, results) {
    if (!error) {
      if (results.length > 0) {
        var data = [];
        results.forEach(function(item) {
          if (!data[item.row])
            data[item.row] = [];
          
          if (data[item.row][item.order])
            data[item.row].push(item);
          else
            data[item.row][item.order] = item;
        });
        
        var columns = [];
        if (data.length > 0)
          data[1].forEach(function(item) {
            columns.push(item.name);
          });
      }
      res.json({
        success: true,
        data_length: data.length,
        results_length: results.length,
        columns: columns,
        results: results,
        data: data
      });
    }
    else
      res.json({success: false});
  });
}

exports.save = function(req, res) {
  var params = {};
  params.id     = req.param('id');
  params.job_id = req.param('job_id');
  params.fields = req.param('fields');
  params.theme  = req.param('theme');
  params.update = req.param('update');
  params.header = req.param('header');
  params.url    = req.param('url');
  
  var codeExec  = [
    'var path   = require("path");', 
    'var appDir = path.dirname(require.main.filename);',
    'var module = require(appDir + "/routes/data/module_phonebook");',
    'var db     = require(appDir + "/modules/db");',

    'module._current_item(function(error, results) {',
      'if (error) callback(error);',
      'else {',
        'if (results.length > 0) {',
          'var settings = {};',
          'results.forEach(function(item) {',
            'settings[item.name] = item.value;',
          '});',
          'module._download(settings.url, function(error, result) {',
            'console.log(error, result);',
          '});',
        '} else callback({code: "Current item empty"});',
      '}',
    '});'
  ].join('');
  
  if (params.fields && params.fields.length > 0) {
    var mysql   = require('mysql');
    
    if (params.job_id > 0)
      updateJob();
    else
      createJob();
      
    function createJob() {
      var job = {
        module    : moduleName,
        schedule  : ['0', '*/' + params.update, '* * * *'].join(' '),
        execute   : codeExec,
        enable    : 1
      };
      
      scheduler.createJob(job, function(error, result) {
        if (!error) {
          params.job_id = result.id;
          
          saveColumns();
        }
      });
    }
    
    function updateJob() {
      scheduler.updateJob({
        id: params.job_id,
        schedule: ['0', '*/' + params.update, '* * * *'].join(' ')
      }, function(error) {});

      saveColumns();
    }
    
    function saveColumns() {
      var values  = [];
      
      params.fields.forEach(function(field) {
        values.push(mysql.format('(?, ?, ?, ?)', [field.id, params.id, field.name, field.show ? 1 : 0]));
      });
      
      var query = [
        'START TRANSACTION;',
        
          'INSERT INTO ' + table.columns,
            '(`id`, `item_id`, `name`, `show`)',
          'VALUES',
            values.join(','),
          'ON DUPLICATE KEY UPDATE',
            '`item_id` = VALUES(`item_id`),',
            '`name` = VALUES(`name`),',
            '`show` = VALUES(`show`)',
          ';',
          
          'DELETE FROM',
            table.settings,
          'WHERE',
            '`item_id` = ?', 'AND',
            '`module_name` = ?',
          ';',
          
          'UPDATE',
            table.settings,
          'SET active = ?',
          'WHERE item_id = ?',
          ';',
          
          'INSERT INTO',
            table.settings,
            '(module_name, item_id, name, value, active)',
          'VALUES',
            '(?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
          ';',
          
        'COMMIT;'
      ].join(' ');
      
      var valuesQuery = [
        params.id, moduleName,
        0, params.id,
        moduleName, params.id, 'theme', params.theme, 1,
        moduleName, params.id, 'url', params.url, 1,
        moduleName, params.id, 'update', params.update, 1,
        moduleName, params.id, 'header', params.header, 1,
        moduleName, params.id, 'job_id', params.job_id, 1
      ];
      
      db.query(req, query, valuesQuery, onSaveColumns);
    }
    
    function onSaveColumns(error, results) {
      if (!error) {
        var query = 'SELECT * FROM ' + table.values + ' WHERE `item_id` = ? LIMIT 1';
        db.query(req, query, [params.id], onSaveValues);              
      } else
        res.json({success: false, error: error});
    }
    
    function onSaveValues(error, results) {
      if (!error) {
        if (results.length == 0) {
        
          parse({id: params.id, header: params.header, req: req}, function(error, result) {
            if (!error) {
            
              var values = [];
              result.rows.forEach(function(row, rowIndex) {
                row.forEach(function(value, i) {
                  values.push(mysql.format('(?, ?, ?, ?)', [params.id, result.columns[i].id, rowIndex + 1, value]));
                });
              });

              var query = [
                'INSERT INTO',
                  table.values,
                  '(`item_id`, `column_id`, `row`, `value`)',
                'VALUES',
                  values.join(',')
              ].join(' ');
              
              db.query(req, query, function(error, results) {
                if (!error) {
                  res.json({success: true});
                } else
                  res.json({success: false});
              });
            } else
              res.json({success: false, error: error});
          });
        
        } else
          res.json({success: true});
      } else
        res.json({success: false, error: error});
    }
    
  } else {
    res.json({success: false, error: 'Not save'});
  }
}

/*exports._save = function(params, callback) {

    saveColumns();
    
    function saveColumns() {
      var values  = [];
      
      params.fields.forEach(function(field) {
        values.push(mysql.format('(?, ?, ?, ?)', [field.id, params.id, field.name, field.show ? 1 : 0]));
      });
      
      var query = [
        'START TRANSACTION;',
        
          'INSERT INTO ' + table.columns,
            '(`id`, `item_id`, `name`, `show`)',
          'VALUES',
            values.join(','),
          'ON DUPLICATE KEY UPDATE',
            '`item_id` = VALUES(`item_id`),',
            '`name` = VALUES(`name`),',
            '`show` = VALUES(`show`)',
          ';',
          
          'DELETE FROM',
            table.settings,
          'WHERE',
            '`item_id` = ?', 'AND',
            '`module_name` = ?',
          ';',
          
          'UPDATE',
            table.settings,
          'SET active = ?',
          'WHERE item_id = ?',
          ';',
          
          'INSERT INTO',
            table.settings,
            '(module_name, item_id, name, value, active)',
          'VALUES',
            '(?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)',
          ';',
          
        'COMMIT;'
      ].join(' ');
      
      var valuesQuery = [
        params.id, moduleName,
        0, params.id,
        moduleName, params.id, 'theme', params.theme, 1,
        moduleName, params.id, 'url', params.url, 1,
        moduleName, params.id, 'update', params.update, 1,
        moduleName, params.id, 'header', params.header, 1,
        moduleName, params.id, 'job_id', params.job_id, 1
      ];
      
      db.query(req, query, valuesQuery, onSaveColumns);
    }
    
    function onSaveColumns(error, results) {
      if (!error) {
        var query = 'SELECT * FROM ' + table.values + ' WHERE `item_id` = ? LIMIT 1';
        db.query(req, query, [params.id], onSaveValues);              
      } else
        res.json({success: false, error: error});
    }
    
    function onSaveValues(error, results) {
      if (!error) {
        if (results.length == 0) {
        
          parse({id: params.id, header: params.header, req: req}, function(error, result) {
            if (!error) {
            
              var values = [];
              result.rows.forEach(function(row, rowIndex) {
                row.forEach(function(value, i) {
                  values.push(mysql.format('(?, ?, ?, ?)', [params.id, result.columns[i].id, rowIndex + 1, value]));
                });
              });

              var query = [
                'INSERT INTO',
                  table.values,
                  '(`item_id`, `column_id`, `row`, `value`)',
                'VALUES',
                  values.join(',')
              ].join(' ');
              
              db.query(req, query, function(error, results) {
                if (!error) {
                  res.json({success: true});
                } else
                  res.json({success: false});
              });
            } else
              res.json({success: false, error: error});
          });
        
        } else
          res.json({success: true});
      } else
        res.json({success: false, error: error});
    }
}*/

exports._download = function(url, callback) {
  var request = require('request');
  var crypto  = require('crypto');
  var query   = '';

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //disable check expaired certificates

  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var md5Hash = crypto.createHash('md5').update(body).digest('hex');
      
      query = 'SELECT * FROM ' + table.items + ' WHERE `hash` = ? LIMIT 1';
      db.query(db.getConfig(null, true), query, [md5Hash], onCheckHash);
      
      function onCheckHash(error, results) {
        if (!error) {
          if (results.length > 0) {
          //if (results.length == 0) {
            query = 'INSERT INTO ' + table.items + ' (`hash`, `created`) VALUES (?, ?)';
            var values = [md5Hash, new Date().getTime() / 1000];
            
            db.query(db.getConfig(null, true), query, values, function(error, results) {
              if (!error) {
                var filename = ['temp/', results.insertId, '.csv'].join('');
              
                fs.writeFile(filename, body, {}, function(error) {
                  if (!error)
                    callback(error, {id: results.insertId});
                  else
                    callback({message: error.code});
                });
              } else callback({message: error.code});
            });
          } else callback({message: 'File already exists'});
        } else callback({message: error.code});
      }
    } else callback({message: error.code});
  });
}

exports.download = function(req, res) {
  _download(req.param('url'), function(error, result) {
    if (error) res.json({success: false, message: error.message});
    else
      res.json({success: true, id: result.id});
  });

  /*var request = require('request');
  var params  = {};
  var query   = '';

  params.url = req.param('url');
  
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //disable check expaired certificates

  request(params.url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var md5Hash = crypto.createHash('md5').update(body).digest('hex');
      
      query = 'SELECT * FROM ' + table.items + ' WHERE `hash` = ? LIMIT 1';
      db.query(req, query, [md5Hash], onCheckHash);
      
      function onCheckHash(error, results) {
        if (!error) {
          //if (results.length == 0) {
          if (results.length > 0) {
            query = 'INSERT INTO ' + table.items + ' (`hash`, `created`) VALUES (?, ?)';
            var values = [md5Hash, new Date().getTime() / 1000];
            
            db.query(req, query, values, function(error, results) {

              var filename = ['temp/', results.insertId, '.csv'].join('');
              
              fs.writeFile(filename, body, {}, function(error) {
                if (!error)
                  res.json({success: true, id: results.insertId});
                else
                  res.json({success: false});
              });
              
            });
          } else res.json({success: false, error: 'File already exists'});
        } else res.json({success: false});
      }
    } else res.json({success: false, error: error});
  });*/
}

exports.preview = function(req, res) {
  var params  = {};
  
  params.req      = req;
  params.id       = req.param('id');
  params.header   = req.param('header');
  params.preview  = true;

  parse(params, function(error, result) {
    if (!error) {
      res.json(result);
    } else
      res.json({success: false, error: error});
  });
}

function parse(params, callback) {
  var csv     = require('csv');
  var parser  = csv.parse({skip_empty_lines: false});

  var header  = [];
  var columns = 0;
  var rows    = [];
  var errors  = [];

  params.filename = params.id + '.csv';
  params.header   = params.header ? 1 : 0

  parser.on('data', function(data) {
    /*if (this.count > 2) {
      return ;
    }*/
    
    if (params.header > 0 && data.length > 0 && header.length === 0) {
      header = data;
      columns = data.length;
    } else {
      if (columns === 0)
        columns = data.length;

      if (data.length == columns)
        rows.push(data);
      else
        errors.push({message: 'Number of columns is not the same, error in line ' + this.count});
    }
  });
  
  parser.on('error', function(error) {});
  
  parser.on('finish', function() {
    var query = 'SELECT * FROM ' + table.columns + ' WHERE `item_id` = ?';
      
    db.query(params.req, query, [params.id], function(error, results) {
      if (!error) {
        callback(null, {
          success : true,
          header  : header,
          rows    : rows,
          columns : results,
          errors  : errors
        });

      } else
        callback(error);
    });
  });
  
  var streamOptions = {};
  if (params.preview)
    streamOptions = {start: 0, end: 2000};

  fs.createReadStream('temp/' + params.filename, streamOptions).pipe(parser);
}