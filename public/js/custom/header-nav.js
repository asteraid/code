
$(document).ready(function () {
    if (statusBtnApply == "1") changeBtnApply(1);

    /*$('#user-nav #execApply').on('click', function(event) {
     event.preventDefault();
     $('body').mask(opts);
     $.post("/data/exec/apply_config", {}, function(data) {
     $('body').unmask();
     if ( data.success ){
     showDialog('Apply command', "<p>Apply command executed</p>", 300, 'auto');
     changeBtnApply(2);
     }
     else
     showDialog('Apply command', "<p>"+data.message+"</p>", 'auto', 'auto');
     });
     });*/

    $('#execModuleReload').on('click', function (event) {

        event.preventDefault();
        $('body').mask(opts);

        $.ajax({
            type: 'POST',
            url: '/data/exec/send_config',
            data: {type: 'reload'},
            dataType: 'json',
            success: function (data) {
                $('body').unmask();
                if (data.success) {
                    modal({
                        title: 'Information',
                        body: 'Reloaded!',
                        width: '300',
                        height: '200'
                    });
                    changeBtnApply(2);
                } else
                    modal({
                        title: 'Error',
                        body: data.message,
                        width: '300',
                        height: '200'
                    });
            }
        });

    });

    $('#execAsteriskRestart').on('click', function (event) {

        event.preventDefault();
        $('body').mask(opts);

        $.ajax({
            type: 'POST',
            url: '/data/exec/asterisk_restart',
            dataType: 'json',
            success: function (data) {
                $('body').unmask();
                if (data.success)
                    modal({
                        title: 'Apply command',
                        body: '<p>Asterisk restart command executed</p>',
                        width: 300,
                        height: 'auto'
                    });
                else
                    modal({
                        title: 'Asterisk restart command',
                        body: '<p>' + data.message + '</p>',
                        width: 'auto',
                        height: 'auto'
                    });
            }
        });

    });

    $('#execSendConfig').on('click', function (event) {
        event.preventDefault();

        applySend();

        function applySend() {
            $('body').mask(opts);

            $.ajax({
                type: 'post',
                url: '/data/exec/send_config',
                data: {type: 'send'},
                dataType: 'json',
                //async     : false,
                success: function (data) {
                    $('body').unmask();
                    if (data.success) {
                        getModalReload();
                    } else {
                        if (data.type == 'confirm') {
                            modal({
                                title: 'Information',
                                body: data.message,
                                width: '300',
                                height: '200',
                                buttons: [
                                    {
                                        text: "Ignore",
                                        "class": 'btn btn-primary',
                                        click: function () {
                                            getModalReload();
                                        }
                                    },
                                    {
                                        text: 'Try again',
                                        "class": 'btn btn-primary',
                                        click: function () {
                                            applySend();
                                        }
                                    }
                                ]
                            });
                        } else
                            modal({
                                title: 'Error',
                                body: data.message,
                                width: '300',
                                heigth: '200'
                            });
                    }
                }
            });
        }

        function getModalReload() {
            modal({
                title: 'Information',
                body: 'Are you sure you want to reload Asterisk?',
                width: '300',
                height: '200',
                buttons: [
                    {
                        text: "Yes",
                        "class": 'btn btn-primary',
                        click: function () {
                            $('body').mask(opts);

                            $.ajax({
                                type: 'post',
                                url: '/data/exec/send_config',
                                data: {type: 'reload'},
                                dataType: 'json',
                                //async     : false,
                                success: function (data) {
                                    $('body').unmask();

                                    if (data.success) {
                                        modal({
                                            title: 'Information',
                                            body: 'Reloaded!',
                                            width: '300',
                                            height: '200'
                                        });
                                        changeBtnApply(2);
                                    } else
                                        modal({
                                            title: 'Error',
                                            body: data.message,
                                            width: '300',
                                            height: '200'
                                        });
                                }
                            });
                        }
                    },
                    {
                        text: 'No',
                        "class": 'btn btn-primary',
                        click: function () {
                            $(this).dialog('destroy');
                        }
                    }
                ]
            });
        }
    });

    $('#execSendConfigAndReload').on('click', function (event) {
        event.preventDefault();

        applySend();

        function applySend() {
            $('body').mask(opts);

            $.ajax({
                type: 'post',
                url: '/data/exec/send_config',
                data: {type: 'send'},
                dataType: 'json',
                //async     : false,
                success: function (data) {
                    $('body').unmask();
                    if (data.success) {
                        getModalReload();
                    } else {
                        if (data.type == 'confirm') {
                            modal({
                                title: 'Information',
                                body: data.message,
                                width: '300',
                                height: '200',
                                buttons: [
                                    {
                                        text: "Ignore",
                                        "class": 'btn btn-primary',
                                        click: function () {
                                            getModalReload();
                                        }
                                    },
                                    {
                                        text: 'Try again',
                                        "class": 'btn btn-primary',
                                        click: function () {
                                            applySend();
                                        }
                                    }
                                ]
                            });
                        } else
                            modal({
                                title: 'Error',
                                body: data.message,
                                width: '300',
                                heigth: '200'
                            });
                    }
                }
            });
        }

        function getModalReload() {
            modal({
                title: 'Information',
                body: 'Are you sure you want to reload Asterisk?',
                width: '300',
                height: '200',
                buttons: [
                    {
                        text: "Yes",
                        "class": 'btn btn-primary',
                        click: function () {
                            $('body').mask(opts);

                            $.ajax({
                                type: 'post',
                                url: '/data/exec/send_config',
                                data: {type: 'reload'},
                                dataType: 'json',
                                //async     : false,
                                success: function (data) {
                                    $('body').unmask();

                                    if (data.success) {
                                        modal({
                                            title: 'Information',
                                            body: 'Reloaded!',
                                            width: '300',
                                            height: '200'
                                        });
                                        changeBtnApply(2);
                                    } else
                                        modal({
                                            title: 'Error',
                                            body: data.message,
                                            width: '300',
                                            height: '200'
                                        });
                                }
                            });
                        }
                    },
                    {
                        text: 'No',
                        "class": 'btn btn-primary',
                        click: function () {
                            $(this).dialog('destroy');
                        }
                    }
                ]
            });
        }
    });

});
