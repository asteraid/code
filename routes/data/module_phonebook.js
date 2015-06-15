var db = require('../../modules/db');
var fs = require('fs');

var moduleName  = 'phonebook';
var table       = {};

table.columns   = '`m_phonebook_columns`';
table.items     = '`m_phonebook_items`';
table.values    = '`m_phonebook_values`';
table.settings  = '`modules_values`';

exports.get_current_item = function(req, res) {
  var query = [
    'SELECT', 
      '*',
    'FROM',
      table.settings,
    'WHERE',
      '`module_name` = ?'
  ].join(' ');
  db.query(req, query, [moduleName], function(error, results) {
    if (!error && results.length > 0)
      res.json({success: true, results: results});
    else
      res.json({success: false});
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
      '`mpc`.`item_id` = ?'
  ].join(' ');
  
  db.query(req, query, [params.id], function(error, results) {
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
  params.fields = req.param('fields');
  params.theme  = req.param('theme');
  params.update = req.param('update');
  params.header = req.param('header');
  params.url    = req.param('url');
  
  if (params.fields && params.fields.length > 0) {
    var mysql   = require('mysql');
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
        'INSERT INTO',
          table.settings,
          '(`module_name`, `item_id`, `name`, `value`)',
        'VALUES',
          '(?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)',
        ';',
      'COMMIT;'
    ].join(' ');
    
    var valuesQuery = [
      params.id, moduleName,
      moduleName, params.id, 'theme', params.theme,
      moduleName, params.id, 'url', params.url,
      moduleName, params.id, 'update', params.update,
      moduleName, params.id, 'header', params.header
    ];
    
    db.query(req, query, valuesQuery, onSaveColumns);
    
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

exports.download = function(req, res) {
  var request = require('request');
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
  });
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
    //console.log('end or finish!!!');
    //console.log('rows.length => ', rows.length);
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
        //result.columns = results;
        //res.json(result);
      } else
        callback(error);
        //res.json({success: false, error: error});
    });
  });
  
  var streamOptions = {};
  if (params.preview)
    streamOptions = {start: 0, end: 2000};

  fs.createReadStream('temp/' + params.filename, streamOptions).pipe(parser);
}