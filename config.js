config = {};
config.application_name = 'Plentystars';
config.db = {};
config.db.user = 'root';
config.db.password = 'root';
config.db.host = 'localhost';
config.db.database = 'a_conf_05032015';
config.db.port = 3306;
config.db.version = '0.2.01234';
config.cdr = {};
config.cdr.database = 'a_cdr_multi';
config.cdr.version = '1.0.0';
config.webserver = {};
config.webserver.port = 8443;
config.webserver.ip_allowed = ['0.0.0.0'];
config.webserver.logio_port = 28778;
config.webserver.tty_port = 8000;
config.phone_release_time = 108000;//30 mins number busy (registration)
config.soundpath = '/opt/store/sounds/custom';
config.exec_script_path = 'bin/';
config.rrd_path = '/opt/store/sysinfo.rrd';
config.store = {};
config.store.path = '/opt/store/';
config.multi = true;
config.server_hosts_file = "/etc/ansible/hosts";
module.exports = config;
