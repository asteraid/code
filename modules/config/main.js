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
        webserver_logio_port:   conf.webserver_logio_port || config_default.webserver.logio_port,
        webserver_tty_port:     conf.webserver_tty_port || config_default.webserver.tty_port,

        phone_release_time:     conf.phone_release_time || config_default.phone_release_time,
        soundpath:              conf.soundpath || config_default.soundpath,
        exec_script_path:       conf.exec_script_path || config_default.exec_script_path,
        rrd_path:               conf.rrd_path || config_default.rrd_path,
        multi:                  conf.multi || config_default.multi,
        server_hosts_file:      conf.server_hosts_file || config_default.server_hosts_file
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