var express   = require('express');
var routes    = require('./routes/index');
var dataStore = require('./routes/data');
var https     = require('https');
var http      = require('http');
var io        = require('socket.io');
var fs        = require('fs');
var hash      = require('./hash_table');
var path      = require('path');
var db        = require('./modules/db');
var scheduler = require('./modules/scheduler');
  
// Глобальные переменные
  global.cManager = scheduler.init(); //cron manager init or return object cron manager

  scheduler.getJobsList(function(error, results) {
    if (!error && results.length > 0) {
      results.forEach(function(job) {
        scheduler.addJob(job);
      });
    }
  });

config = fs.existsSync('./config.js') ? require('./config.js') : require('./modules/config/config_default.js');

if (fs.existsSync('./config.user.js'))
  require('./config.user.js');

if (fs.existsSync('./config.dev.js'))
  require('./config.dev.js');

//config          = require('./config.js');
config_default  = require('./modules/config/config_default.js');
operators       = new hash();
mysql           = require('mysql');
database        = function(req, res, sysuser) {
    this.success = false;
    
    var user;
    var password;
    
    if (sysuser) {
      user      = sysuser.user ? sysuser.user : config.db.user;
      password  = sysuser.password ? sysuser.password : config.db.password;
    } else {
      user      = req.session.dbuser;
      password  = req.session.password;
    }

    if(user !== undefined && password !== undefined) {
        this.success = true;
        var conf = {};
        
        conf.user       = user;
        conf.password   = password;
        conf.host       = config.db.host;
        conf.database   = config.db.database;
        conf.port       = config.db.port;
        conf.multipleStatements = true; //Multiple statement queries
        
        if (!this.connect) {
          this.connect = mysql.createConnection(conf);
        }

        this.connect.connect(function(err) {
          // connected! (unless `err` is set)
        });
    } else this.connect = false;
    
    this.destroy = function() {
        if(this.connect)
            this.connect.destroy();
    }
}

getSQL = function(p) {
    this.save_item = function() {
        //default values
        if(p.id === undefined) p.id = 0;
        if(p.parent_id === undefined) p.parent_id = 0;
        if(p.node === undefined) p.node = 'ALL';
        if(p.filename === undefined) p.filename = '';
        if(p.comment === undefined) p.comment = '';
        if(p.out_1 === undefined) p.out_1 = '@result';
        if(p.out_2 === undefined) p.out_2 = '@id_trunk';
        if(p.params === undefined) p.params = '';
        if(p.values === undefined) p.values = '';
        if(p.custom_type === undefined) p.custom_type = 0;
        if(p.commented === undefined) p.commented = 0;
        p.commented == 'yes' ? p.commented = 1 : p.commented = 0;
        //

        for(var key in p) {
            if(p.hasOwnProperty(key)) {
                if(typeof p[key] === 'string')
                    if(!p[key].match(/^(@)/))
                        p[key] = "'" + p[key] + "'";
            }
        }
        //console.log('---------->', p.commented, '<------------');
        return "call save_item(" + [p.id, p.parent_id, p.itemtype, p.filename, p.name, p.comment, p.node, p.custom_type, p.commented, p.params, p.values, p.out_1, p.out_2].join(',') + ");"; 
    }
}

// MemoryStore
var MemoryStore = express.session.MemoryStore
    ,sessionsStore = new MemoryStore();

var opts = {
		  // Specify the key file for the server
		  key: fs.readFileSync('./cert/ccc-key.pem'),
		  // Specify the certificate file
		  cert: fs.readFileSync('./cert/ccc-cert.pem'),
		  rejectUnauthorized: true
	   };

app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('portssl', process.env.PORTSSL || config.webserver.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set("jsonp callback", true );
  app.use(express.favicon(__dirname + '/public/favicon.ico', { maxAge: 2592000000 }));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
      secret: 'ccc', 
      key: 'ccc.sid',
     // cookie: { maxAge: new Date(Date.now() + 1200000) } , // 20 min
      store: sessionsStore
    }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(req,res){
    res.render('404.jade',{ title: 'MAGUI'
                      , item: req.url.substr(1)
                      , itemUrl: req.url
                      , callflow_items: []
                      , context_items: []
                      , itemId: ''
                      , itemName: ''
                      });
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*function restrict(req, res, next) {
  if ( req.session.user ) {
    next();
  } else {
    res.redirect('/auth');
  }
}*/

//app.all('/auth', );
//app.all('*', restrict);
app.all('*', routes.ttt);

/*
app.get('/',restrict, routes.index);
app.get('/templates',restrict, routes.index);
app.get('/extensions',restrict, routes.index);
app.get(/^\/callflows/, restrict, routes.index);
app.get('/callflows_list',restrict, routes.index);
app.get('/servers',restrict, routes.index);
app.get('/trunks',restrict, routes.index);
app.get('/rules',restrict, routes.index);
app.get(/^\/contexts/, restrict, routes.index);
app.get(/^\/modal/, restrict, routes.index);
app.get('/items',restrict, routes.index);
app.get('/logs',restrict, routes.index);
app.get('/password',restrict, routes.index);

app.post('/data/items/getparents', dataStore.items.getparents);

app.get('/callhistory',restrict, routes.index);
app.get('/editor',restrict, routes.index);
app.get('/editor/list_configs',restrict, routes.editor.list_configs);
app.get('/editor/get_config',restrict, routes.editor.get_config);
app.get('/editor/save_config',restrict, routes.editor.save_config);
app.get('/editor/get_context_id', restrict, routes.editor.get_context_id);
app.get('/ring_groups',restrict, routes.index);
app.get('/time_conditions',restrict, routes.index);
app.get('/queues',restrict, routes.index);
app.get('/sounds',restrict, routes.index);
app.get('/conferences',restrict, routes.index);
app.get('/network',restrict, routes.index);
app.get('/storage',restrict, routes.index);
app.get('/lifeboat',restrict, routes.index);
app.get('/reboot',restrict, routes.index);
app.get('/shutdown',restrict, routes.index);

app.get('/auth', routes.auth.auth);
app.get('/import', routes.auth.import);
app.get('/data/installer', dataStore.installer.create);
app.post('/data/installer', dataStore.installer.create);

app.post('/sendsms', routes.auth.sendsms);
app.post('/registration', routes.auth.registration);
app.post('/login',routes.route.login);
app.get('/set_sid', routes.route.set_sid);
app.get('/sip_reload', routes.route.sip_reload);
app.get('/module_reload', routes.route.module_reload);
app.get('/logout', routes.route.logout);
app.get('/incPhones', routes.route.incPhones);

app.get('/data/extensions/list', dataStore.extensions.list);
app.get('/data/rrd/list', dataStore.rrd.list);
app.get('/data/rrd/data_item', dataStore.rrd.data_item);

app.get('/data/rules/list', dataStore.rules.list);
app.get('/data/rules/dialingRules', dataStore.rules.dialingRules);
app.get('/data/rules/numberRules', dataStore.rules.numberRules);

app.get('/data/contexts/list', dataStore.contexts.list);

app.get('/data/callflow/get_callflow', dataStore.callflow_load.get_callflow);
app.get('/data/callflow/get_callflow_structure', dataStore.callflow_load.get_callflow_structure);
app.get('/data/callflow/list', dataStore.callflows.list);

app.get('/data/callflow/get_module_class', dataStore.callflow_modules.get_module_class);
app.get('/data/callflow/get_list_view', dataStore.callflow_modules.get_list_view);

app.get('/data/ringgroup/get_ringgroup', dataStore.ringgroup.get_ringgroup);

app.get('/data/callflow/get_sounddir', dataStore.callflows.get_sounddir);
app.get('/data/callflow/get_soundfile', dataStore.callflows.get_soundfile);

app.post('/data/callflow/rename', dataStore.callflows.rename);
app.post('/data/callflow/save_callflow', dataStore.callflow_save.save);
app.post('/data/callflow/delete_callflow', dataStore.callflows.delete_callflow);
app.post('/data/callflow/new_callflow', dataStore.callflows.new_callflow);
app.post('/data/callflow/insert_callflow', dataStore.callflow_save.insert_callflow);
app.post('/data/callflow/insert_config_relation', dataStore.callflow_save.insert_config_relation);

app.get('/data/ringgroup/get_ringgroup', dataStore.ringgroup.get_ringgroup);

app.get('/data/callflow/get_sounddir', dataStore.callflows.get_sounddir);
app.get('/data/callflow/get_soundfile', dataStore.callflows.get_soundfile);

app.get('/export_xls', dataStore.export_xls.cdr_to_xls);

app.post('/data/trunks/save-trunk', dataStore.trunks.save_trunk);
app.post('/data/trunks/delete_trunk', dataStore.trunks.delete_trunk);
app.post('/data/trunks/load_trunk', dataStore.trunks.load_trunk);
app.post('/data/trunks/get_itemid', dataStore.trunks.get_itemid);

app.post('/data/extensions/save-ext', dataStore.extensions.save_ext);
app.post('/data/extensions/load_ext', dataStore.extensions.load_ext);
app.post('/data/extensions/delete_ext', dataStore.extensions.delete_ext);
app.post('/data/extensions/on_off_ext', dataStore.extensions.on_off_ext);

app.post('/data/contexts/save_context', dataStore.contexts.save_context);
app.post('/data/contexts/load_context', dataStore.contexts.load_context);
app.post('/data/contexts/include', dataStore.contexts.include);
app.post('/data/contexts/delete_included', dataStore.contexts.delete_included);
app.post('/data/contexts/delete', dataStore.contexts.delete);
app.post('/data/contexts/get_path', dataStore.contexts.get_path);
app.post('/data/contexts/order_update', dataStore.contexts.order_update);

app.post('/data/callflow/rename', dataStore.callflows.rename);
app.post('/data/callflow/save_callflow', dataStore.callflow_save.save);
app.post('/data/callflow/delete_callflow', dataStore.callflows.delete_callflow);
app.post('/data/callflow/new_callflow', dataStore.callflows.new_callflow);
app.post('/data/callflow/insert_callflow', dataStore.callflow_save.insert_callflow);
app.post('/data/callflow/insert_config_relation', dataStore.callflow_save.insert_config_relation);
app.post('/data/ringgroup/save_ringgroup', dataStore.ringgroup.save_ringgroup);
app.post('/data/ringgroup/del_ringgroup', dataStore.ringgroup.del_ringgroup);

app.get('/data/items/list', dataStore.items.list);
app.get('/data/items/list_category_config', dataStore.items.list_category_config);

app.post('/data/rules/save', dataStore.rules.save);
app.post('/data/rules/load', dataStore.rules.load);
app.post('/data/rules/delete', dataStore.rules.delete);
app.post('/data/rules/is_included', dataStore.rules.is_included);

app.get('/data/templates/list', dataStore.templates.list);
app.post('/data/templates/load', dataStore.templates.load);
app.post('/data/templates/save', dataStore.templates.save);
app.post('/data/templates/delete', dataStore.templates.delete);

app.post('/exec/apply_config', routes.exec.apply_config);

app.post('/exec/save_server_comment', routes.exec.save_server_comment);
app.post('/exec/accept_server', routes.exec.accept_server);
app.post('/exec/delete_server', routes.exec.delete_server);
app.post('/exec/reject_server', routes.exec.reject_server);
app.post('/exec/restart_asterisk', routes.exec.restart_asterisk);
app.post('/exec/restart_server', routes.exec.restart_server);

app.post('/upload/sound', routes.upload.sound);

app.post('/save_view_setting', routes.route.save_view_setting);

app.post('/data/password/check_password', dataStore.password.check_password);
app.post('/data/password/save_password', dataStore.password.save_password);

*/

// for debug
/*app.get('/sessions', function (req, res) {
    res.json(sessionsStore);
});*/

var serverssl = https.createServer(opts,app).listen(app.get('portssl'), function(){
	console.log("Express server listening on port " + app.get('portssl'));
});

/*
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/

var parseCookie = require('cookie');
var parseSignedCookie = require('connect').utils.parseSignedCookie;

io = io.listen(serverssl);

io.set('transports', ['xhr-polling', 'jsonp-polling']);
io.set('transportOptions','{"xhr-polling": {timeout: 30000},"jsonp-polling": {timeout: 30000}');

var Session = require('connect').middleware.session.Session;
//socket.io
io.configure(function (){
	  io.set('authorization', function (data, callback) {
		console.log('autorization');
		if (data.headers.cookie) {
			data.cookie = parseCookie.parse(data.headers.cookie,{secure:true});
			data.sessionID = parseSignedCookie(data.cookie['ccc.sid'],'ccc');
                        data.sessionStore = sessionsStore;
			sessionsStore.get(data.sessionID, function(err, session){
                            if (err) {
                                     return callback('Error in session store.', false);
                                } else if (!session) {
                                     return callback('Session not found.', false);
                                }
                            // success! we're authenticated with a known session.
                            data.session = new Session(data, session);
                            console.log(session);
                            return callback(null, true);
                        });
		}
		else{
			console.log('error cookie');
			callback('Session cookie required.', false); // error first callback style
		}
	  });
	});

io.sockets.on('connection', function (socket) {
 console.log('Operator socketId: '+socket.id + ' connected, sessionID: '+socket.handshake.sessionID);
 //console.log('A socket with sessionID ' + socket.handshake.sessionID + ' connected!');
          var hs = socket.handshake;
          // Освежаем сессию
          var intervalFreshID = setInterval(function(){
             console.log('session fresh');
             hs.session.reload( function () { 
            // "touch" it (resetting maxAge and lastAccess)
            // and save it back again.
                     hs.session.touch().save();
             });
          }, 60000);
 	  
 	 // socket.emit('news', { hello: 'world' });
	  socket.on('my other event', function (data) {
		  //console.log('my other event');
		  console.log(data);
		  console.log(socket.id);
	  });
	  
	  socket.on('disconnect', function() {
                   // удаляем сессию ;
                  clearInterval(intervalFreshID);
                   
		  console.log('клиент отключился - удаляем оператора по сессии '+socket.handshake.sessionID);
		  var ind = operators.find_sid(socket.handshake.sessionID);
			if ( ind != -1 ){
				operators.remove(ind);
			}
			else
				console.log('Оператор с такой сессией не найден '+socket.handshake.sessionID);
			console.log(operators.get_hash());
	  });
});
// -- socket.io
