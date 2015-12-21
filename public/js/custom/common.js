//fix select2 in dialog
if($.ui && $.ui.dialog && $.ui.dialog.prototype._allowInteraction) {
    var ui_dialog_interaction = $.ui.dialog.prototype._allowInteraction;
    $.ui.dialog.prototype._allowInteraction = function(e) {
        if ($(e.target).closest('.select2-drop').length) return true;
        return ui_dialog_interaction.apply(this, arguments);
    };
}

//modal window
function showDialog(title, body, width, height, buttons, beforeOpen, onClose) {
	
    var objModal = $('#modal-dialog');

    if(typeof body == 'object')
        $.ajax({
            type: 'GET',
            url: body.url,
            dataType: 'html',
            async: false,
            success: function(data) {
                objModal.html(data);
            }
        });
    else
        objModal.html(body);
    
    $('#modal-dialog').off( "dialogopen"); 
    if ( typeof(beforeOpen) == 'function' ){
       $('#modal-dialog').on( "dialogopen", beforeOpen);
    }
	
	if(typeof(onClose) == 'function'){
		$('#modal-dialog').on( "dialogclose", onClose);
	}
	else {
		objModal.off( "dialogclose");
		objModal.on('dialogclose', function(event, ui) { 
			//$(this).dialog('destroy') 
      $(this).dialog('close') 
		} );
	}
    
    
    
    if ( typeof(buttons) == 'undefined' ){
        buttons = [
            {
                text: 'OK',
                "class": 'btn btn-primary',
                click: function() {
                      $(this).dialog("close");
                  }
            } 
        ];
    }
    
    objModal.dialog({
        title: title,
        modal: true,
        width: width,
        height: height,
        buttons: buttons,
        maxHeight: $(window).height() - 50,
        resizable: false
    });
    
}

//modal window ver 2
function showDialog_new(title, body, width, height, buttons, beforeOpen, onClose, additional) {
  
  var idDialog  = 'modal-dialog';
  var objModal  = $('#' + idDialog);
  
  if (objModal.length == 0) {
    $('body').append('<div id="' + idDialog + '" item-id=""></div>');
    objModal = $('#' + idDialog);
  }

  if(typeof body == 'object')
    $.ajax({
      type: 'GET',
      url: body.url,
      dataType: 'html',
      async: false,
      success: function(data) {
          body = data;
      }
    });
    
  objModal.html(body);
    
  objModal.off('dialogopen'); 
  if (typeof beforeOpen == 'function') {
    objModal.on('dialogopen', beforeOpen);
  }
	
	if(typeof onClose == 'function') {
    objModal.on('dialogclose', onClose);
	} else {
    objModal.off('dialogclose');
    objModal.on('dialogclose', function(event, ui) {
      $(this)
        .dialog('destroy')
        .remove();
		});
	}
  
  if (typeof buttons == 'undefined') {
    buttons = [
      {
        text    : 'OK',
        "class" : 'btn btn-primary',
        click   : function() {
          $(this).dialog('close');
        }
      }
    ];
  }
    
  objModal.dialog({
    title: title,
    modal: true,
    width: width,
    height: height,
    buttons: buttons,
    maxHeight: $(window).height() - 50,
    resizable: false
  });
}

//modal window ver 3
/*
  params: {
    title:      <string>,
    body:       <string>|<object>,
    width:      <int>,
    height:     <int>,
    buttons:    <array>,
    beforeOpen: <function>,
    onClose:    <function>,
    additional: <bool>
  }
*/
function modal(params) {

  var idDialog            = 'modal-dialog';
  var idDialogAdditional  = 'modal-dialog-additional'
  
  if (params.additional) {
    var numAdditionalModal  = 0;
    var additionalItems     = $('[id*="' + idDialogAdditional + '"]');

    if (additionalItems.length) {
      additionalItems = additionalItems.map(function() {
        if (this.id)
          return this.id.split('-').pop();
      });
      
      numAdditionalModal  = Math.max.apply(Math, additionalItems) + 1;
    }
    
    idDialog = idDialogAdditional + '-' + numAdditionalModal;
  }

  var objModal  = $('#' + idDialog);
  
  if (objModal.length == 0) {
    $('body').append('<div id="' + idDialog + '" item-id=""></div>');
    objModal = $('#' + idDialog);
  }

  if (typeof params.body == 'object')
    $.ajax({
      type: 'GET',
      url: params.body.url,
      dataType: 'html',
      async: false,
      success: function(data) {
          params.body = data;
      }
    });
    
  objModal.html(params.body);
    
  objModal.off('dialogopen'); 
  if (typeof params.beforeOpen == 'function') {
    objModal.on('dialogopen', params.beforeOpen);
  }
	
	if (typeof params.onClose == 'function') {
    objModal.on('dialogclose', params.onClose);
	} else {
    objModal.off('dialogclose');
    objModal.on('dialogclose', function(event, ui) {
      $(this)
        .dialog('destroy')
        .remove();
		});
	}
  
  if (typeof params.buttons == 'undefined') {
    params.buttons = [
      {
        text    : 'OK',
        "class" : 'btn btn-primary',
        click   : function() {
          //$(this).dialog('close');
          $(this).dialog('destroy');
        }
      }
    ];
  }
    
  //params.autoOpen = params.autoOpen ? true : false;
    
  objModal.dialog({
    //autoOpen:   params.autoOpen,
    open:       params.open,
    title:      params.title,
    modal:      true,
    width:      params.width,
    height:     params.height,
    buttons:    params.buttons,
    maxHeight:  $(window).height() - 50,
    resizable: false
  });
}

//устанавливает состояние кнопок
function setButtonsState(idTable, onlyDelete) {
    if(onlyDelete === undefined) {
        if($('#' + idTable).find('.row_selected').length > 0)
            $('.buttons_operation .dependent').attr('disabled', false);
        else
            $('.buttons_operation .dependent').attr('disabled', true);
    } else {
        $('.buttons_operation .dependent').attr('disabled', true);
        $('#btnDelete').attr('disabled', false);
    }
}
//создает и возвращает объект dataTable (используется глобальная переменная currentRow, нужно пофиксить)
/*function setDataTable(idTable, sAjaxSource, aoColumns, aoColumnDefs) {
    return $('#tblContent').dataTable({
            "bJQueryUI": true,
            "bProcessing": true,
            "sAjaxSource": sAjaxSource,
                "fnRowCallback": function(nRow, aData, iDisplayIndex) {
                        $(nRow).click(function(){
                                $(nRow).siblings('tr').removeClass('row_selected');
                                $(nRow).addClass('row_selected');
                                setButtonsState($(nRow).parent().parent().attr('id'));
                                currentRow = aData;
                        });
                },
                "sAjaxDataProp": "rows",
                "aoColumnDefs": aoColumnDefs,
                "aoColumns": aoColumns
        });
}*/

//создает и возвращает объект dataTable (используется глобальная переменная currentRow, нужно пофиксить)
function setDataTableTest(idTable, sAjaxSource, aoColumns, aoColumnDefs, type, aaSorting) {
    if(aaSorting == undefined) aaSorting = [];
    if(type === undefined) type = '';

    return $('#' + idTable).dataTable({
            "bJQueryUI": true,
            "bProcessing": false,
            //"bStateSave": true,
            "sAjaxSource": sAjaxSource,
            "aLengthMenu": [
                [25, 50, -1],
                [25, 50, 'All']
            ],
            "iDisplayLength" : 25,
            "fnInfoCallback": function(oSettings, iStart, iEnd, iMax, iTotal, sPre) {
              sPre = [iStart, '-', iEnd, 'of', iTotal, '(filtered). '].join(' ');
              if (oTable && oTable.find('input[type="checkbox"]').length > 0) {
                sPre += oTable.getCheckedItems().length + ' selected';
              }
              
              return sPre;
            },
            "fnRowCallback": function(nRow, aData, iDisplayIndex) {
              $(nRow).click(function(){
                $(nRow).siblings('tr').removeClass('row_selected');
                $(nRow).addClass('row_selected');

                if(!aData.readonly)
                    setButtonsState($(nRow).parent().parent().attr('id'));
                else
                    setButtonsState($(nRow).parent().parent().attr('id'), 1);

                currentRow = aData;
              });

              $(nRow).find('input[type="checkbox"]').bind('change', function(event) {
                aData.checked = $(this).is(':checked');
                oTable.updateInfo();
                //console.info(oTable.getCheckedItems());
                //$('.dataTables_info').html(oTable.getCheckedItems().length + '|' + $('.dataTables_info').html().split('|').pop());
                //$('.dataTables_info').html() + oTable.getCheckedItems()
              });
            },
            "fnServerData": function (sSource, aoData, fnCallback) {
	            aoData.push({"name": "type", "value": type});
                $.ajax({
                    type: "GET",
                    url: sSource,
                    data: aoData,
                    success: function(json) {
                        if(type == 'context')
                            $.each(json.rows, function(index, el) {
                                if(el.readonly == 1)
                                    json.rows[index].comment = 'system context';
                            });

    		            fnCallback(json);
                    }
                });
            },
            "sAjaxDataProp": "rows",
            "aoColumnDefs": aoColumnDefs,
            "aoColumns": aoColumns,
            "aaSorting": aaSorting
        });
}

// get path
function getPath(type) {
    $.ajax({
        type: 'POST',
        url: '/data/contexts/get_path',
        data: {ids: $(location).attr('href'), type: type},
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data.success) {
                $('#breadcrumb').html('<a class="tip-bottom" title="" href="/" data-original-title="Go to Home"><i class="icon-home"> </i><home></home></a>');
                var len = data.path.length;
                $.each(data.path, function(index, el) {
                    if(index == len-1) {
                        current = 'class="current"';
                        append = '<span ' + current + ' href="' + el.href + '">'+ el.name +'</span>';
                    } else {
                        current = '';
                        append = '<a ' + current + ' href="' + el.href + '">'+ el.name +'</a>';
                    }
                    $('#breadcrumb').append(append);
                });
            }
        }
    });
}

//парсит textarea в массив
function splitTextarea(text){
    return text.replace(/^[\n\r]+|[\n\r]+$/g,'').split(/[\n\r]+/);
}
