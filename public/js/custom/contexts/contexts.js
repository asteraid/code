var currentRow = {};
var templateJSON = {};
var modal = '';
//console.log();

if(!itemId) {        
    var columns = [{"mData":"id"}, {"mData":"name"}, {"mData":"comment"}];
    var columnsDefs = [{"bSearchable": false, "bVisible": false, "aTargets": [0]}];
    var oTable = setDataTableTest('tblContent', '/data/items/list', columns, columnsDefs, 'context');

    $('#tblContent tr').live('dblclick', function() {openItem();});

    $('#btnAdd').click(function() {
        showDialog('Add Context', {url:'/modal/context/add'}, '700', 'auto', getModalBtns('context', oTable));
    });

    $('#btnOpen').click(function() {openItem();});

    $('#btnEdit').click(function() {editItem(oTable);});

    $('#btnDelete').click(function() {

        var btnsDelete = 
            [
                {
                    text: 'Ok',
                    "class": 'btn',
                    click: function() {
                        $(this).dialog('close');
                        $.ajax({
                            type: 'POST',
                            url: '/data/contexts/delete',
                            data: {id: currentRow.id},
                            dataType: 'json',
                            async: false,
                            success: function(data) {
                                if(data.success) {
                                    oTable.fnReloadAjax();
                                    $('#btnEdit, #btnDelete').attr('disabled', true);
                                    //changeBtnApply(1);
                                } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
                            }
                        });
                    }
                },
                {
                    text: 'Cancel',
                    "class": 'btn',
                    click: function() {
                        $(this).dialog('close');
                    }
                }
            ];
        if(currentRow.readonly == 1)
          showDialog('Information', '<p align="center">It is a system context. You can not delete it.</p>', 'auto', 'auto');
        else {
          var contextsText = '';
          $.ajax({
            type: 'POST',
            url: '/data/contexts/getWhereIncluded',
            data: {id: currentRow.id},
            dataType: 'json',
            async: false,
            success: function(data) {
              if(data.success) {
                if (data.contexts && data.contexts.length > 0)
                  contextsText = '<p>This context included in following contexts: ' + data.contexts + '</p>';
              } else showDialog('Information', '<p align="center">' + data.message + '</p>', 'auto', 'auto');
            }
          });
          
          showDialog('Information', '<p align="center">Delete this context?</p>' + contextsText, 'auto', 'auto', btnsDelete);
        }
    });

} else {

    getPath();

    var columns = [{"mData":"id"}, {"mData":"order"}, {"mData":"name"}, {"mData":"type"}, {"mData":"pattern"}, {"mData":"comment"}];
    var columnsDefs = [{"bSearchable": false, "bVisible": false, "aTargets": [0,1]}];
    var oTable = setDataTableTest('tblContent', "/data/items/list?id=" + itemId, columns, columnsDefs, '', [[1,'asc']]);
    oTable.rowReordering();

    $('#tblContent tr').live('dblclick', function() {openItem();});

    $('#btnAddDialRule').click(function() {
        showDialog('Add Rule', {url:'/modal/rule/add'}, '700', 'auto', getModalBtns('rule', oTable));
    });

    $('#btnIncludeContext').click(function() {
        showDialog('Include Context/Rule', {url:'/modal/context/include'}, '700', 'auto', getModalBtns('include', oTable));
    });

    $('#btnOpen').click(function() {openItem();});

    $('#btnEdit').click(function() {editItem(oTable);});

    $('#btnDelete').click(function(){deleteItem();});

    $('#btnSaveOrder').click(function() {
        var str = [];
        $.each($('tbody tr'), function(index, el) {
            var item_id = oTable.fnGetData(el).id;
            if(item_id != itemId) {
                str.push({
                    item_id: item_id,
                    parent_id: itemId,
                    order: index
                });
            }
        });
        if (str.length > 0) {
            $.ajax({
                type: 'POST',
                url: '/data/contexts/order_update',
                //data: {sql: str},
                data: {contexts: str},
                dataType: 'json',
                async: false,
                success: function(data) {
                    if(data.success) {
                        oTable.fnReloadAjax();
                        showDialog('Information', 'Order is successfully saved!', 'auto', 'auto');
                        //changeBtnApply(1);
                    }
                }
            });
        }
    });
}

function openItem() {
    if(currentRow.type == 'context' && !currentRow.readonly)
        window.location = $(location).attr('href') + '/' + currentRow.id;
    else if(currentRow.type == 'rule' && !currentRow.readonly)
        window.location = $(location).attr('href').replace('contexts', 'callflows') + '/' + currentRow.id;
}

function editItem(oTable) {
    if(currentRow.type == 'context')
        showDialog('Edit Context', {url:'/modal/context/edit'}, '700', 'auto', getModalBtns('context', oTable));
    else
        window.location = $(location).attr('href').replace('contexts', 'callflows') + '/' + currentRow.id;
        //window.location = '/callflows?itemId=' + currentRow.id + '&itemName=' + currentRow.name;
}

function deleteItem() {
    if(currentRow.type == 'context') {
        var btnsDelete = 
            [
                {
                    text: 'Ok',
                    "class": 'btn',
                    click: function() {
                        
                            $(this).dialog('close');
                            $.ajax({
                                type: 'POST',
                                url: '/data/contexts/delete_included',
                                data: {item_id: currentRow.id, parent_id: itemId},
                                dataType: 'json',
                                async: false,
                                success: function(data) {
                                    if(data.success) {
                                        oTable.fnReloadAjax();
                                        $('#btnEdit, #btnDelete').attr('disabled', true);
                                        //changeBtnApply(1);
                                    } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
                                }
                            });
                    }
                },
                {
                    text: 'Cancel',
                    "class": 'btn',
                    click: function() {
                        $(this).dialog('close');
                    }
                }
            ];

        showDialog('Information', '<p align="center">Exclude this included context?</p>', 'auto', 'auto', btnsDelete);
    } else {
        var btnsDelete = [
            {
                text: 'Ok',
                "class": 'btn btn-primary',
                click: function() {
                    $(this).dialog('close');
                    $.ajax({
                        type: 'POST',
                        url: '/data/rules/is_included',
                        data: {rule_id: currentRow.id},
                        dataType: 'json',
                        async: false,
                        success: function(data) {
                            if(data.success) {
                                if(data.count > 1) {
                                    $.ajax({
                                        type: 'POST',
                                        url: '/data/rules/delete',
                                        data: {item_id: currentRow.id, parent_id: itemId, name: currentRow.name, included: 1},
                                        dataType: 'json',
                                        async: false,
                                        success: function(data) {
                                            if(data.success) {
                                                oTable.fnReloadAjax();
                                                $('#btnEdit, #btnDelete').attr('disabled', true);
                                                //changeBtnApply(1);
                                            } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
                                        }
                                    });
                                } else {
                                    var btnsDeleteSure =
                                        [
                                            {
                                                text: 'Ok',
                                                "class": 'btn btn-primary',
                                                click: function() {
                                                    $(this).dialog('close');
                                                    $.ajax({
                                                        type: 'POST',
                                                        url: '/data/rules/delete',
                                                        data: {item_id: currentRow.id, parent_id: itemId, name: currentRow.name, included: 0},
                                                        dataType: 'json',
                                                        async: false,
                                                        success: function(data) {
                                                            if(data.success) {
                                                                oTable.fnReloadAjax();
                                                                $('#btnEdit, #btnDelete').attr('disabled', true);
                                                                //changeBtnApply(1);
                                                            } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
                                                        }
                                                    });
                                                }
                                            },
                                            {
                                                text: 'Cancel',
                                                "class": 'btn btn-primary',
                                                click: function() {
                                                    $(this).dialog('close');
                                                }
                                            }
                                        ];
                                    showDialog('Information', '<p align="center">It\'s not relation. Delete?</p>', 'auto', 'auto', btnsDeleteSure);
                                }
                            }
                        }
                    });
                }
            },
            {
                text: 'Cancel',
                "class": 'btn btn-primary',
                click: function() {
                    $(this).dialog('close');
                }
            }
        ];

        showDialog('Information', '<p align="center">Exclude this rule?</p>', 'auto', 'auto', btnsDelete);
    }
}

function getModalBtns(type, oTable) {
    switch(type) {
        case 'context':
            
            var btns = [
                {
                  text: "Save",
                  "class": 'btn',
                  click: function() {
                    if($('form[name="form-basic"]').valid()) {
                        var action = '';
                        var data = '';
                        var self = this;

                        action = '/data/contexts/save_context';

                        $.ajax({
                             type: 'POST',
                             url: action,
                             data: $('form').serializeArray(),
                             dataType: 'json',
                             async: false,
                             success: function(data) {
                                 if(data.success) {
                                    var btns = [
                                        {
                                            text: "Yes",
                                            "class": 'btn',
                                            click: function() {
                                                window.location = $(location).attr('href') + '/' + data.id_context;
                                            }
                                        },
                                        {
                                            text: "No",
                                            "class": 'btn',
                                            click: function() {
                                                $(this).dialog('close');
                                                oTable.fnReloadAjax();
                                            }
                                        }
                                    ];

                                    $(self).dialog('close');
                                    showDialog('Information', '<div align="center"><p>Context <strong>' + $('form').find('input[name="name"]').val() + '</strong> created.</p><p>Do you want to fill it now?</p></div>', '300', 'auto', btns);
                                    //changeBtnApply(1);
                                 } else showDialog('Information', data.message, 'auto', 'auto');
                                 setButtonsState('tblContent');
                             }
                        });
                    }
                  }
                }
            ];
        break;

        case 'rule':
            var btns = [
                {
                  text: "Save",
                  "class": 'btn',
                  click: function() {
                    var action = '';
                    var data = '';
                    var modalId = '#modal-dialog';
                    var self = this;

                    action = '/data/rules/save';

                        $.ajax({
                             type: 'POST',
                             url: action,
                             data: $('form[name="form-basic"]').serializeArray(),
                             dataType: 'json',
                             async: false,
                             success: function(data) {
                                 if(data.success) {
                                     oTable.fnReloadAjax();
                                     $(self).dialog('close');
                                    //changeBtnApply(1);
                                 } else showDialog('Information', data.message, 'auto', 'auto');
                             }
                        });
                  }
                }
            ];
        break;

        case 'include':
            var btns = [
                {
                  text: "Save",
                  "class": 'btn',
                  click: function() {
                    var action = '/data/contexts/include';
                    //var input = $('input[name="context"]').val();
                    var input = $('input[name="item_id"]').val();
                    var self = this;

                    if(input)
                        $.ajax({
                             type: 'POST',
                             url: action,
                             //data: {context: input, parent_id: itemId},
                             data: {item_id: input, parent_id: itemId},
                             dataType: 'json',
                             async: false,
                             success: function(data) {
                                 if(data.success) {
                                     oTable.fnReloadAjax();
                                     $(self).dialog('close');
                                     //changeBtnApply(1);
                                 } else showDialog('Information', data.message, 'auto', 'auto');
                             }
                        });
                  }
                }
            ];
        break;

        default:
            var btns = null;
    }
    
    return btns;
}