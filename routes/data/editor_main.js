var db = require('../../modules/db');

exports.list_configs = function(req, res) {
  var query = "SELECT DISTINCT `filename` FROM `vConfigAll` ORDER BY `editortabname` ASC";
  
  db.query(req, query, function (err, results, fields) {
    var configs         = [];
    var custom_configs  = ['extensions.conf', 'extensions-custom.conf', 'sip-custom.conf'];
    
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }

    if (results.length == 0) {
      res.json({success: true, configs: custom_configs});
      return;
    }
		
    results.forEach(function(row){
      configs.push(row['filename']);
    });
		
    // check if config files have customs
    custom_configs.forEach(function(custom_config){
      var custom_config_exists = false;

      results.forEach(function(row){
        if(row['filename'] == custom_config){
          custom_config_exists = true;
          return;
        }
      });
    
      // append custom config if not exists
      if (!custom_config_exists) {
        configs.push(custom_config);
        configs.sort();
      }
    });

    if (results.length > 0)
      res.json({success: true, configs: configs});
  });
}

exports.get_context_id = function(req, res) {
  var context_name  = req.param('context_name');
  var query         = 'SELECT `id` FROM `config_items` WHERE `type`= ? AND `name`= ?';

  db.query(req, query, ['context', context_name], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (results.length > 0) {
      res.json({success: true, id: results[0].id});
      return;
    }
    
    var sql = new getSQL({
      itemtype  : "context",
      name      : context_name,
      out_2     : "@id_tmpl"
    });

    query = sql.save_item() + '; ' + 'SELECT @result, @id_tmpl';

    db.query(req, query, function(err, results, fields) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }
    
      var result  = results[1][0]['@result'];
      var id_tmpl = results[1][0]['@id_tmpl'];

      if (result)
        res.json({success: true,  id: id_tmpl});
      else
        res.json({success: false});
          
    });    
  });
}

exports.get_config = function(req, res) {
  var config_name = req.param('config_name');
  var query;

  if (config_name == 'extensions.conf' || config_name == 'extensions-custom.conf')
    query = "SELECT * FROM `vExtensionsConfAll` WHERE editortabname = ? ORDER BY `cat_metric`, `var_metric`";
  else if (config_name == 'sip.conf' || config_name == 'sip-custom.conf')
    query = "SELECT * FROM `vSipConfAll` WHERE `editortabname`= ? ORDER BY `cat_metric`, `var_metric`";
  else
    query = "SELECT * FROM `vConfigAll` WHERE `editortabname`= ? ORDER BY `cat_metric`, `var_metric`";

  db.query(req, query, [config_name], function (err, results, fields) {
    var editor              = '';
    var category            = '';
    var old_category        = '';
    var key_val_separator   = ' = ';
    var msg_attention       = ' \
; ------------------------------ ATTENTION ---------------------------\n \
; This configuration is automatically created. You can not change it manually.\n \
; But you can OVERRIDE any section of this configuration in the *-custom.conf\n \
; window by section created with the same name. Or you can create a section\n \
; with a new name and it will be available for the system. Section with names\n \
; begins with __ (double underscore) are not available for the include menu\n \
; ---------------------------------------------------------------------\n \
\n\n';
    if (err) {
      res.json({success: false, message: err.code, 'err': err, query: query});
      return;
    }
    
    var prep_inc    = '';
    var post_inc    = '';
    var contexts_id = [];

    switch(config_name) {
      case 'extensions.conf':
        prep_inc = msg_attention;
        post_inc = '\n\n#include extensions-custom.conf\n\n';
      break;
      case 'sip.conf':
        prep_inc = msg_attention;
        post_inc = '\n\n#include sip-custom.conf\n\n';
      break;
    }

    if (results.length > 0) {
      results.forEach(function(row){
        if (old_category != row['category']) {
          if (old_category != '') category = '\n';

          category += '['+row['category']+']\n';
          old_category = row['category'];

          if (config_name == 'extensions-custom.conf')
            contexts_id.push({name: row['category'], id: row['cat_metric']});
        } else category = '';
          
        switch(row['var_name']) {
          case 'exten':
          case 'same':
          case 'include':
            key_val_separator = ' => ';
          break;
          default:
            key_val_separator = ' = ';
        }

        editor += category + row['var_name'] + key_val_separator + row['var_val'] + '\n';
      });
    }
    
    res.json({success: true, config_name: config_name, contexts_id: contexts_id, content: editor});
  });
}

exports.save_config = function(req, res) {
  var mysql = require('mysql');
  var param = {
    data    : req.param('data'),
    deleted : req.param('deleted')
  };
  
  var isSuccess = (param.data && param.data.name && param.data.node && param.data.rows && param.data.rows.length > 0);
  
  if (isSuccess) {
    
    function NextRow() {
      var i               = 0;
      var lastCatMetric   = 0;
      var lastVarMertic   = 0;
      var lastCategory;
      var data            = param.data.rows;

      return function() {
        var item = data && data[i] ? data[i] : null;
        
        if (!item) return ;
        
        if (item.category !== lastCategory) {
          lastCatMetric++;
          lastVarMetric = 0;
          lastCategory  = item.category;
        }

        item.cat_metric  = lastCatMetric;
        item.var_metric  = lastVarMetric++;
        
        var values = [
          param.data.name, 0, 0,
          item.category,
          item.var_name,
          item.var_val,
          item.cat_metric,
          item.var_metric,
          param.data.node
        ];
        
        item.sql = mysql.format('(?, ?, ?, ?, ?, ?, ?, ?, ?)', values);
        
        i++;
        
        return item;
      }
    }
    
    var Row     = NextRow();
    var query  = [];
    var row;
    
    while (row = Row()) {
      query.push(row.sql);
    }
    
    var values = [query.join(','), param.data.name.replace('-custom', ''), param.data.node];
    query = mysql.format('CALL insert_config (?, ?, ?, @result)', values);

    db.query(req, query, function(error, results) {
      if (error)
        res.json({success: false, message: err.code});
      else {
        if (results[0][0]['result'] === 1) {
          if (param.deleted && param.deleted != 0) {delete_contexts();}
          res.json({success: true, message: "Config saved"});
        } else
          res.json({success: true, message: "Config not saved"});
      }
    });

  } else
    res.json({success: false, message: "Required parameters are empty"});
	
  function delete_contexts() {
    var query = "call editor_context_delete(?, @result)";
    db.query(req, query, param.deleted, function(error, results){
      if (error) { 
        return;
      }
    });
  }
}
