config_default = {};
config_default.application_name = 'Plentystars';
config_default['db_client'] = {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    db_config: 'a_conf',
    db_cdr: 'a_cdr'
};
config_default.webserver = {
    port: 8443,
    ip_allowed: "['0.0.0.0']",
    logio_port: 28778,
    tty_port: 8000
};
config_default.phone_release_time = 108000;
config_default.soundpath = '/opt/store/sounds/custom';
config_default.exec_script_path = 'bin/';
config_default.rrd_path = '/opt/store/sysinfo.rrd';
config_default.multi = true;
config_default.server_hosts_file = '/etc/ansible/hosts';
config_default.default = true;
module.exports = config_default;