//
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
			console.log("moduleUrl ", moduleUrl, "Access Allowed")
			return true;
		}
		else {
			console.log("moduleUrl ", moduleUrl, "Access Denied!!!");
			return false;
		}

	}
    else {
        return false;
	}
}

exports.ttt = function(req, res) {
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
    /*var multiRes = {};
    multiRes.view = {};
    multiRes.modal = {'template/edit': 'template/edit_multi'};*/

    var itemName = (typeof(req.param('itemName')) != 'undefined') ? req.param('itemName') : '';
    fs.existsSync = fs.existsSync || path.existsSync;
	
	
    // controller by default
    
    if (urlParts[0] === '') {
		if(typeof(user_type_id) != 'undefined' && user_type_id == 2){
			controller = 'rrd';
		}
		else if(typeof(user_type_id) != 'undefined' && user_type_id == 3){
			controller = 'rrd';
		}
		else {
			controller = 'rrd';
		}
    }
    console.log('controller', controller);
    // get ids from url
    urlParts.forEach(function(part) {
        if (part/part === 1) ids.push(part);
    });
    
    if (ids) itemId = ids[ids.length - 1];

    // without authorization
    if (noAuth.indexOf(controller) !== -1) {
        var file = require('./' + controller + '.js');
        //console.log(file);
        if(urlParts[1] === undefined || urlParts[1] === '') urlParts[1] = 'index';
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

        res.render(pathView,
          {
            title:      config.application_name,
            itemId:     itemId,
            itemName:   'gogo',
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
        if(!checkAuth(req, moduleUrl)){ 
			res.redirect('auth');
		}
        
        
        var style_css       = '/css/unicorn.grey.css';
        var socketio_src    = '/socket.io/socket.io.js';

        if(!fs.existsSync(baseDir + '/views/' + controller + '.jade')) res.send(404);
        
        function getMenuItems(callback) {

            var user_id = req.session.user_id;
			
			
			
			if(user_id == 1){
				
				var query = "SELECT CONCAT('{', '\"position\": ', m.position, ', ', '\"type\": \"', m.type, '\"',  ', ',  '\"name\": \"', m.name, '\"',  ', ', '\"icon\" :\"', m.icon, '\"',  ', ', '\"href\" :\"', m.href, '\"',  ', ', '\"class\" :\"', m.class, '\"',  IF(m.count = 1, CONCAT(', \"count\" : ', m.count), \"\"), '}') as var_val FROM modules m WHERE m.active > 0 ORDER BY m.position";
				
			}
			else {
				//TODO: if not authorized `user_id` is undefined
				var query = "SELECT us.id, CONCAT('{', '\"position\": ', m.position, ', ', '\"type\": \"', m.type, '\"',  ', ',  '\"name\": \"', m.name, '\"',  ', ', '\"icon\" :\"', m.icon, '\"',  ', ', '\"href\" :\"', m.href, '\"',  ', ', '\"class\" :\"', m.class, '\"',  IF(m.count = 1, CONCAT(', \"count\" : ', m.count), \"\"), '}') as var_val FROM `user_settings` us LEFT JOIN modules m ON us.module_id = m.id WHERE `module` = 'menu' AND `category` = 'item' AND `var_name` = 'settings' AND user_id = " + user_id + " ORDER BY m.position";
			}
            
            db.connect.query(query, function(err, results, fields) {
				
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
            db.connect.query(query, function(err, results, fields) {
                if (!err) err = results;
                callback(err);
            });
        };
        
        var db = new database(req, res, true);
        if(db.connect) {
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
                        
                        res.render(controller, { title: config.application_name
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
                            , statusBtnApply: req.cookies.statusBtnApply
                            , tty_port: config.webserver.tty_port
                        });
                        
                        db.destroy();
                    });
                }
            });
        }
    }
};

/*
exports.index = function(req, res, next){
  var socketio_src = '/socket.io/socket.io.js';
 
  //Проверяем стиль 
  var style = 'grey';

  if ( typeof(req.cookies.style) != 'undefined' ) {
      style = req.cookies.style;
  }
  var style_css = '/css/unicorn.'+style+'.css';
  
  var itemUrl = req.path;
  var itemId = ''; // раздел меню
  var itemName = ''; //название раздела
  var path  = '';
  var modal = false;

  if (typeof(req.param('itemId')) != 'undefined')
    itemId = req.param('itemId');

  if ( typeof(req.param('itemName')) != 'undefined' ) 
    itemName = req.param('itemName');
    
  var item = 'Under construction';
  var template = 'index';
  switch (itemUrl){
      case '/':
          item = 'Home Dashboard';
          //template = 'index';
		  template = 'rrd';
          break;
      case '/templates':
          item = 'Templates';
          template = 'templates';
          break;
      case '/extensions':
          item = 'Extensions';
          template = 'extensions';
          break;
      case '/callflows':
          item = 'Callflows';
          template = 'callflows';
          break;
      case '/callflows_list':
          item = 'Callflows';
          template = 'callflows_list';
          break;
      case '/trunks':
          item = 'Trunks';
          template = 'trunks';
          break;
      case '/contexts':
          item = 'Contexts';
          template = 'contexts';
          break;
        case '/rules':
          item = 'Rules';
          template = 'rules';
          break;
      case '/editor':
          item = 'Editor';
          template = 'editor';
          break;
      case '/callhistory':
          item = 'Call history';
          template = 'call_history';
          break;
      case '/logs':
          item = 'Logs';
          template = 'logs';
          break;
      case '/password':
          item = 'Password';
          template = 'password';
          break;          
      default:
		if(itemUrl.search(/^\/modal\//) >= 0) {
			modal = true;
			item = 'modal';
			template = itemUrl.replace(/^\//, '');
		} else {
			var current_item = exports.getCurrentItem(req);
			if(current_item.success) {
				itemId = current_item.itemId;
				item = current_item.item;
				template = current_item.template;
			}
		}
  }
		if(modal == false) {
			var db = new database(req, res);
			if(db.connect) {
				var items = [];
				var query = "SELECT `type`, COUNT(DISTINCT(`name`)) `count` FROM `vItems` WHERE `visible` = 1 GROUP BY `type`";
				db.connect.query(query, function (err, results, fields) {
					if(!err) {
						if(results.length>0)
							results.forEach(function(entry){
									items[entry.type] = entry.count;
							});

							res.render(template, { title: config.application_name
								, item: item
								, itemUrl: itemUrl
								, path: path
								, trunk_items: items.trunk
								, context_items: items.context
								, rule_items: items.rule
								, template_items: items.template
								, extention_items: items.ext
								, itemId: itemId
								, itemName: itemName
								, socketio_src: socketio_src
								, user: req.session.user
								, company: req.session.company
								, companyId: req.session.companyId
								, sessionID: req.sessionID
								, style_css: style_css
								, statusBtnApply: req.cookies.statusBtnApply
                                , tty_port: config.webserver.tty_port
							});
					}
					db.connect.destroy();
				});
			}
		} else {
			res.render(template, { title: config.application_name
				, itemId: itemId
				, itemName: itemName
			});
		}

};
*/
exports.getCurrentItem = function(req) {
    if(req.originalUrl.indexOf('contexts') != -1)
        return {success: true, itemId: exports.getLastId(req), item: 'Contexts', template: 'contexts'};

    else if(req.originalUrl.indexOf('callflows') != -1)
        return {success: true, itemId: exports.getLastId(req), item: 'Contexts', template: 'callflows'};

    else
        return {success: false};
};

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
};
