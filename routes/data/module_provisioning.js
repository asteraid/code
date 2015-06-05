var db = require('../../modules/db');
var moduleName = 'provisioning';

exports.list = function (req, res) {
  var query = 'SELECT `id`, `phone_model` `name` FROM `m_provisioning_models`';

  db.query(req, query, function(error, results) {
    if (!error)
      res.json({success: true, results: results});
    else
      res.json({success: false});
  });
};

exports.save = function(req, res) {
  var itemParams  = {};
  var files       = {};
  var params      = {};
  params.item_id  = req.param('item_id');
  params.module   = req.param('module');

  var query = [
    'START TRANSACTION;',
      'DELETE',
      'FROM',
        '`modules_values`',
      'WHERE',
        '`module_name` = ? AND',
        '`item_id` = ?;',
      'INSERT INTO',
        '`modules_values`',
        '(`module_name`, `item_id`, `name`, `value`)',
      'VALUES',
        '(?, ?, ?, ?), (?, ?, ?, ?);',
    'COMMIT;'
  ].join(' ');

  var values = [
    moduleName, params.item_id,
    moduleName, params.item_id, 'mac_address', params.module[moduleName].mac_address,
    moduleName, params.item_id, 'phone_model', params.module[moduleName].phone_model
  ];
  
  db.query(req, query, values, function(error, results) {
    if (!error) {
      getFiles();
    } else res.json({success: false, message: error.code});
  });
  
  /* getFiles() -> onGetFiles() -> onGetParams() -> createFiles() */
  
  function getFiles() {
    var query = [
      'SELECT',
        '*',
      'FROM',
        '`m_provisioning_models` `mpm`',
      'JOIN',
        '`m_provisioning_files` `mpf`',
      'ON',
        '(`mpm`.`id` = `mpf`.`model_id`)',
      'WHERE `mpm`.`id` = ?'
    ].join(' ');
    
    db.query(req, query, [params.module[moduleName].phone_model], onGetFiles);
  }
  
  function onGetFiles(error, results) {
    if (!error && results.length > 0) {
      files     = results;
      var query = [
        'SELECT',
          '`ext`, `name`, MD5(`secret`) `md5password`',
        'FROM',
          '`vExtensions`',
        'WHERE',
          '`extid` = ?'
      ].join(' ');
      
      db.query(req, query, [params.item_id], onGetParams);
    } else res.json({success: false, message: 'Files is empty'});
  }
  
  function onGetParams(error, results) {
    if (!error && results.length > 0) {
      itemParams = results;
      if (createFiles())
        res.json({success: true});
    } else res.json({success: false, message: 'No params'});
  }
  
  function createFiles() {
    var fs = require('fs');
    
    itemParams      = itemParams[0];
    itemParams.mac  = params.module[moduleName].mac_address;

    files.forEach(function(file, i) {
      //replace macro variable
      for(var index in itemParams) { 
        if (itemParams.hasOwnProperty(index)) {
          if (itemParams[index] === null)
            itemParams[index] = '';
          file.content = file.content.replace(new RegExp('%' + index + '%', 'gi'), itemParams[index]);
        }
      }
      
      file.filename = file.filename.replace(/%.*%/, itemParams.mac);
      
      fs.writeFileSync('temp/' + file.filename, file.content);
    });
    
    console.log('createFiles', files.length);
    
    return true;
  }
}

exports.load = function(req, res) {
  var params = {};
  params.item_id = req.param('id');
  
  var query = [
    'SELECT',
      '*',
    'FROM',
      '`modules_values`',
    'WHERE',
      '`item_id` = ?'
    ].join(' ');
  
  db.query(req, query, [params.item_id], function(error, results) {
    if (!error)
      res.json({success: true, data: results});
    else
      res.json({success: false});
  });
}