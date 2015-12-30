var db = require('../modules/db');

function checkAuth(req, moduleUrl) {
	var user_id = req.session.user_id;
  var userTypeId = req.session.user_type_id;

	//For index page
	if(moduleUrl === ''){
		moduleUrl = '/';
	}
	
    if(req.session.user){
		var user_modules_by_href = [];
		var user_modules = req.session.user_modules;
		
		if(user_modules.length){
			for(var i in user_modules){
				user_modules_by_href[user_modules[i]['href']] = user_modules[i];
			}

		}
		

		if(userTypeId == 1 || moduleUrl =='index' || moduleUrl =='/' || typeof(user_modules_by_href['/' + moduleUrl]) != 'undefined'){
			//console.log("moduleUrl ", moduleUrl, "Access Allowed")
			return true;
		}
		else {
			//console.log("moduleUrl ", moduleUrl, "Access Denied!!!");
			return false;
		}

	}
    else {
        return false;
	}
}

exports.index = function(req, res) {
    var fs          = require('fs');
    var path        = require('path');
    var baseDir     = path.dirname(require.main.filename);
    var pathToFile  = path.join(baseDir, '/public', req.path);
    var urlParts    = req.path.split('/').slice(1);
    var itemId      = typeof(req.param('itemId')) !== undefined ? req.param('itemId') : '';
    var controller  = urlParts[0];
    var noAuth      = ['auth', 'install'];
    var ids         = [];
    var item        = '';
    var moduleUrl	= urlParts[0];
    var user_type_id = req.session.user_type_id;
  
    var transPath = require('../modules/trans_path');

    var itemName = (typeof(req.param('itemName')) != 'undefined') ? req.param('itemName') : '';
    fs.existsSync = fs.existsSync || path.existsSync;
	
	
    // controller by default
    
    if (urlParts[0] === '') {
      if (typeof(user_type_id) != 'undefined' && user_type_id == 2) {
        controller = 'rrd';
      } else if (typeof(user_type_id) != 'undefined' && user_type_id == 3) {
        controller = 'rrd';
      } else {
        controller = 'rrd';
      }
    }
    
    // get ids from url
    urlParts.forEach(function(part) {
      if (part/part === 1) ids.push(part);
    });
    
    if (ids) itemId = ids[ids.length - 1];

    // without authorization
    if (noAuth.indexOf(controller) !== -1) {
      var file = require('./' + controller + '.js');
      if (urlParts[1] === undefined || urlParts[1] === '') urlParts[1] = 'index';

      file[urlParts[1]](req, res);
    // modal window
    } else if (controller === 'modal') {

        var partsView = urlParts[1] + '/' + urlParts[2];

        if (transPath.modal[partsView])
          partsView = transPath.modal[partsView];

        var pathView = controller + '/' + partsView;

        if(!fs.existsSync(baseDir + '/views/' + pathView + '.jade')) {
          res.send(404);
          return;
        }
        
        var tabs = {};
        tabs.root = [baseDir, '/views/', controller, '/', urlParts[1], '/tabs/'].join('');
        // if exist directory tabs
        if (fs.existsSync(tabs.root)) {
          tabs.nav      = [tabs.root, 'nav/'].join('');
          tabs.content  = [tabs.root, 'content/'].join('');

          var partial = require('../modules/render_partial');
          
          var renderHtml = function(path, params) {
          
            var result = '';
            
            if (fs.existsSync(path)) {
              var list = fs.readdirSync(path);
              if (list)
                list.forEach(function(item) {
                  result += partial.render([path, item].join(''), params);
                });
            }
            
            return result;
          }
          
          res.render(pathView,
            {
              title:      config.applicationName,
              itemId:     itemId,
              html:       {
                nav: renderHtml(tabs.nav),
                content: renderHtml(tabs.content, {req_params: req.query})
              },
              itemName:   '',
              req_params: req.query,
              multi:      config.multi
            }
          );
        } else
          res.render(pathView,
            {
              title:      config.applicationName,
              itemId:     itemId,
              itemName:   '',
              req_params: req.query,
              multi:      config.multi
            }
          );
    // data store
    } else if (controller === 'data') {
        var dataStore = [];
        fs.readdirSync(baseDir + '/routes/data').forEach(function(file) {
          dataStore[file.slice(0, -3)] = require(baseDir + '/routes/data/' + file);
        });

        urlParts.slice(1).forEach(function(item) {
          dataStore = dataStore[item];
        });

        dataStore(req, res);
    // all files: js, css, etc
    } else if (urlParts[0] !== '' && fs.existsSync(pathToFile)) {
        res.sendfile(pathToFile);
    // render view in views directory
    } else {
        if (!checkAuth(req, moduleUrl)) { 
          res.redirect('auth');
        }

        var style_css       = '/css/unicorn.grey.css';
        var socketio_src    = '/socket.io/socket.io.js';

        if (!fs.existsSync(baseDir + '/views/' + controller + '.jade')) {
          res.send(404);
          return ;
        }
        
        function getMenuItems(callback) {

            var user_id = req.session.user_id;
			
			
			
			if(user_id == 1){
				
				var query = "SELECT CONCAT('{', '\"position\": ', m.position, ', ', '\"type\": \"', m.type, '\"',  ', ',  '\"name\": \"', m.name, '\"',  ', ', '\"icon\" :\"', m.icon, '\"',  ', ', '\"href\" :\"', m.href, '\"',  ', ', '\"class\" :\"', m.class, '\"',  IF(m.count = 1, CONCAT(', \"count\" : ', m.count), \"\"), '}') as var_val FROM modules m WHERE m.active > 0 AND m.hidden <> 1 ORDER BY m.position";
				
			}
			else {
				//TODO: if not authorized `user_id` is undefined
				var query = "SELECT us.id, CONCAT('{', '\"position\": ', m.position, ', ', '\"type\": \"', m.type, '\"',  ', ',  '\"name\": \"', m.name, '\"',  ', ', '\"icon\" :\"', m.icon, '\"',  ', ', '\"href\" :\"', m.href, '\"',  ', ', '\"class\" :\"', m.class, '\"',  IF(m.count = 1, CONCAT(', \"count\" : ', m.count), \"\"), '}') as var_val FROM `user_settings` us LEFT JOIN modules m ON us.module_id = m.id WHERE `module` = 'menu' AND `category` = 'item' AND `var_name` = 'settings' AND user_id = " + user_id + " ORDER BY m.position";
			}
            
            db.query(req, query, function(err, results, fields) {
				
				//Add Home Dashboard
				if(results){
					results.unshift({ id: 2, user_id: null, module: 'menu',	category: 'item', var_name: 'settings', var_val: '{"position":1, "name": "Home Dashboard", "icon": "icon icon-home", "href": "/", "class": ""}'});
				}
				
                if (!err) err = results;
                callback(err);
            });
        };
        
        function getMenuItemsCount(callback) {
            var query = "SELECT `type`, COUNT(DISTINCT(`name`)) `count` FROM `vItems` WHERE `visible` = 1 GROUP BY `type`";
            db.query(req, query, function(err, results, fields) {
                if (!err) err = results;
                callback(err);
            });
        };
        
        //var db = new database(req, res, true);
        //if(db.connect) {
            getMenuItems(function(result) {
                var sidebar_items = [];
                if(result.length > 0) {
                    var menuItems = result;
                    
                    getMenuItemsCount(function(result) {
                        var menuItemsCount = [];
                        if (result.length > 0)
                            result.forEach(function(row) {
                                menuItemsCount[row.type] = row.count;
                            });
                            

                        menuItems.forEach(function(row) {
                            var settings = JSON.parse(row.var_val);
                            var position = settings.position;
                            
                            if ('/' + urlParts[0] == settings.href) {
                                settings.class = 'active';
                                item = settings.name;
                            }

                            if (settings.count)
                                settings.count = menuItemsCount[settings.type] || 0;
                            
                            if (position) {
                                var offset = sidebar_items[position] !== undefined ? 1 : 0;
                                sidebar_items[position + offset] = settings;
                            } else
                                sidebar_items.push(settings);
                        });

                        db.query(req, 'SELECT `config_need_update`.`need_update` FROM `a_conf`.`config_need_update`', function(err, results, fields) {
                            res.render(controller, { title: config.applicationName
                                , item: item
                                //, itemUrl: 'test'
                                , path: ''
                                , sidebar_items: sidebar_items
                                , itemId: itemId
                                , itemName: itemName
                                , socketio_src: socketio_src
                                , user: req.session.user
                                , company: req.session.company
                                , companyId: req.session.companyId
                                , sessionID: req.sessionID
                                , style_css: style_css
                                , statusBtnApply: results[0].need_update
                                , multi: (config.multi === 'true')
                            });
                        });
                        //db.destroy();
                    });
                }
            });
        //}
    }
};

exports.getCurrentItem = function(req) {
    if(req.originalUrl.indexOf('contexts') != -1)
        return {success: true, itemId: exports.getLastId(req), item: 'Contexts', template: 'contexts'};

    else if(req.originalUrl.indexOf('callflows') != -1)
        return {success: true, itemId: exports.getLastId(req), item: 'Contexts', template: 'callflows'};

    else
        return {success: false};
}

exports.getLastId = function(req) {
    var params_in = req.originalUrl.split('/'),
        params_out = [];

    for(i = 0; i < params_in.length; i++)
        if(!isNaN(parseInt(params_in[i])))
            params_out.push(params_in[i]);

    if(params_out.length > 0) {
        //идентификатор равен последнему идентификатору из набора /1/2/3/4/5
        return params_out[params_out.length - 1];
    } else return false;
}