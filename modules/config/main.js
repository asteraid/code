var params = {};

function initParams(conf) {
    if(conf === undefined) conf = {};
    
    params = {
        application_name:       conf.application_name || config_default.application_name,
        
        db_user:                conf.db_user || config_default.db_client.user,
        db_password:            conf.db_password || config_default.db_client.password,
        db_host:                conf.db_host || config_default.db_client.host,
        //db_database:            conf.db_database || config_default.db_client.db_config,
        db_port:                conf.db_port || config_default.db_client.port,
        db_name_config:         conf.db_name_config || config_default.db_client.db_config,
        db_name_cdr:            conf.db_name_cdr || config_default.db_client.db_cdr,

        webserver_port:         conf.webserver_port || config_default.webserver.port,
        webserver_ip_allowed:   conf.webserver_ip_allowed || config_default.webserver.ip_allowed,

        /*
        multi:                  conf.multi || config_default.multi,
        */
    };
}

function generate(conf) {
    initParams(conf);

    var path = require('path'), fs = require('fs'), jade = require('jade'),
        app_dir, file, fn,
        output_file = 'config.js',
        template = 'template.jade',
        content = '';

    if(file = fs.readFileSync(__dirname + '/' + template)) {
        app_dir = path.dirname(require.main.filename)
        fn = jade.compile(file);
        content = fn(params);
        
        if(fs.writeFileSync(app_dir + '/' + output_file, content) == null) return true;
        else return false;
    } else return false;
}

exports.generate = generate;