var db          = require('../../modules/db');
var fs          = require('fs');
var scheduler   = require('../../modules/scheduler');
var token       = 'password';

var moduleName  = 'phonebook';
var table       = {};

table.columns   = '`m_phonebook_columns`';
table.items     = '`m_phonebook_items`';
table.values    = '`m_phonebook_values`';
table.settings  = '`modules_values`';

exports.test_rr = function(req, res) {
  res.json({success: '!!!'});
}

exports.task_function = function(req, res) {
  var request = require('request');
  var token   = 'token';
  var url     = ['https://', 'localhost', ':', config.webserver.port, '/data/module_phonebook/autoupdate_phonebook', '?token=', token].join('');

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; /*disable check expaired certificates*/

  request(url, function (error, response, body) {
    callback(error);
  });
}

exports.autoupdate_phonebook = function(req, res) {
  if (req.param('token') !== token)
    res.json({success: false, error: {message: "Wrong token"}});
  else {

    var settings  = {};

    _current_item(function(error, results) {
      if (error)
        res.json({error: error});
      else {
        //if (results.length == 0) {
        if (results.length > 0) {
          settings.item_id = results[0].item_id;
          
          results.forEach(function(item) {
            settings[item.name] = item.value;
          });

          _download(settings.url, function(error, result) {
            if (error)
              res.json({error: error});
            else {
              settings.new_id = result.id;
              var query = [];
              
              db.query(db.getConfig(null, true), _getSqlInsertColumns({current_id: settings.item_id, new_id: settings.new_id}), onInsertColumns);
              
              function onInsertColumns(error, results) {
                if (error)
                  res.json({error: error});
                else
                  _getSqlInsertValues({id: settings.new_id, header: settings.header}, onInsertValues);
              }
              
              function onInsertValues(error, sql) {
                if (error)
                  res.json({error: error});
                else {
                  query.push('START TRANSACTION');
                  query.push(sql);
                  query.push(_getSqlUpdateSettings({new_id: settings.new_id, current_id: settings.item_id}));
                  query.push('COMMIT');
                  query = query.join(';');
                  
                  db.query(db.getConfig(null, true), query, function(error, result) {
                    if (error) 
                      res.json({error: error, result: result, query: query});
                    else
                      res.json({success: true, result: result});
                  });
                }
              }
            }
          });
        } else res.json({error: {message: "Current item empty"}});
      }
    });
  }
}

/*exports.test_d = function(req, res) {
  var path      = require("path");
  var appDir    = path.dirname(require.main.filename);
  var module    = require(appDir + "/routes/data/module_phonebook");
  var db        = require(appDir + "/modules/db");
  var settings  = {};

  module._current_item(function(error, results) {
    if (error) callback(error);
    else {
      //if (results.length  0) {
      if (results.length > 0) {
        settings.item_id = results[0].item_id;
        
        results.forEach(function(item) {
          settings[item.name] = item.value;
        });

        module._download(settings.url, function(error, result) {
          if (error) callback(error);
          else {
            settings.new_id = result.id;
            var query = [];
            
            db.query(db.getConfig(null, true), module._getSqlInsertColumns({current_id: settings.item_id, new_id: settings.new_id}), onInsertColumns);
            
            function onInsertColumns(error, results) {
              if (error) callback(error);
              else
                module._getSqlInsertValues({id: settings.new_id, header: settings.header}, onInsertValues);
            }
            
            function onInsertValues(error, sql) {
              if (error) callback(error);
              else {
                query.push('START TRANSACTION');
                query.push(sql);
                query.push(module._getSqlUpdateSettings({new_id: settings.new_id, current_id: settings.item_id}));
                query.push('COMMIT');
                db.query(db.getConfig(null, true), query.join(';'), function(error, result) {
                  if (error) res.json({error: error, result: result, query: query.join(';')});//callback(error);
                  else
                    res.json({success: true, result: result});
                });
              }
            }
            
          }
        });
      } else callback({code: "Current item empty"});
    }
  });
}*/

/*
  params: {current_id: <int>, new_id: <int>}
*/
var _getSqlInsertColumns = function(params) {
  var mysql = require('mysql');
  var query = [
    'INSERT INTO', table.columns, '(`item_id`, `name`, `show`)',
      'SELECT ?, `name`, `show`',
      'FROM', table.columns, 
      'WHERE `item_id` = ?'
  ].join(' ');
  return mysql.format(query, [params.new_id, params.current_id]);
}

/*
  params: {current_id: <int>, new_id: <int>}
*/
var _getSqlUpdateSettings = function(params) {
  var mysql = require('mysql');
  var query = [
    'INSERT INTO', table.settings, '(`module_name`, `item_id`, `name`, `value`, `active`)',
      'SELECT `module_name`, ?, `name`, `value`, `active`',
      'FROM', table.settings,
      'WHERE `item_id` = ? AND `module_name` = ?',
    ';',
    'UPDATE', table.settings, 'SET `active` = ?',
    'WHERE `item_id` = ? AND `module_name` = ?'
  ].join(' ');
  return mysql.format(query, [params.new_id, params.current_id, moduleName, 0, params.current_id, moduleName]);
}

/*
  params = {id: <string|int>, header: <null|string>}
*/
var _getSqlInsertValues = function(params, callback) {
  var mysql = require('mysql');
  
  parse(params, function(error, result) {
    if (error) callback(error);
    else {

      var values = [];
      result.rows.forEach(function(row, rowIndex) {

        row.forEach(function(value, i) {
          values.push(mysql.format('(?, ?, ?, ?)', [params.id, result.columns[i] ? result.columns[i].id : null, rowIndex + 1, value]));
        });
      });

      var query = [
        'INSERT INTO',
          table.values,
          '(`item_id`, `column_id`, `row`, `value`)',
        'VALUES',
          values.join(',')
      ].join(' ');
      
      callback(null, query)
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

var _current_item = function(callback) {
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
      '`mpc`.`item_id` = ?', 'AND', '`mpc`.`show` = 1'
  ].join(' ');

  db.query(db.getConfig(null, true), query, [params.id], function(error, results) {
    if (!error) {
      var data = [];
      if (results.length > 0) {
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

  var codeExec = [
    'var request = require("request");',
    'var url     = ["https://", "localhost", ":", config.webserver.port, "/data/module_phonebook/autoupdate_phonebook", "?token=", "password"].join("");',

    'process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; /*disable check expaired certificates*/',

    'request(url, function (error, response, body) {',
      'callback(error);',
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
        //db.query(req, query, [params.id], onSaveValues);
        db.query(req, query, [params.id], function(error, results) {
          if (error) res.json({success: false, error: error});
          else {
            // values not updated, but updated columns, settings
            if (results.length > 0)
              res.json({success: true, message: "Saved success"});
            else {

              _getSqlInsertValues(params, function(error, sql) {
                if (error)
                  res.json({success: false, error: error, sql: sql});
                else
                  db.query(req, sql, function(error) {
                    if (error)
                      res.json({success: false, error: error});
                    else
                      res.json({success: true, message: "Saved success"});
                  });
              });
            }
          }
        });
      } else
        res.json({success: false, error: error});
    }
  } else {
    res.json({success: false, error: {message: "Not saved. Empty required fields"}});
  }
}

var _download = function(url, callback) {
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
          //if (results.length > 0) {
          if (results.length == 0) {
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
    } else callback({message: "File not found"});
  });
}

exports.download = function(req, res) {
  _download(req.param('url'), function(error, result) {
    if (error) res.json({success: false, error: error});
    else
      res.json({success: true, id: result.id});
  });
}

exports.preview = function(req, res) {
  var params  = {};
  params.id       = req.param('id');
  params.header   = req.param('header');
  params.preview  = true;

  if (params.id && params.id > 0) {
    parse(params, function(error, result) {
      if (!error) {
        res.json(result);
      } else
        res.json({success: false, error: error});
    });
  } else
    res.json({success: false});
}

var parse = function(params, callback) {
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
      
    db.query(db.getConfig(null, true), query, [params.id], function(error, results) {
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