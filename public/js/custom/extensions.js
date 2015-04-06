var currentRow = {};
//var templateJSON = {};
var modalId = '#modalWindow';

// получение темплейтов
/**/

var columns = [
  {
    "sTitle": "<input id='selectAll' type='checkbox' />",
    "mDataProp": null,
    "sWidth": "20px",
    "sDefaultContent": "<div style='text-align: center;'><input type='checkbox' /></div>",
    "bSortable": false
  },
  {"mData": "ext"},
  {"mData": "name"},
  {"mData": "template"},
  {"mData": "context"},
  {"mData": "extid", "bVisible": false, "bSearchable": false}
];
var columnsDefs = [];//[{"bSearchable": false, "bVisible": false, "aTargets": [5]}];
var oTable = setDataTableTest('tblExtensions', '/data/extensions/list', columns, columnsDefs);

oTable.isSelectedRow = function() {
  return $(this).find('.row_selected').length > 0 ? true : false;
}

oTable.getCheckedItems = function(property) {
  var dt      = this;
  var ids     = dt.fnSettings().aiDisplay;
  var result  = [];

  ids.forEach(function(id) {
    var data = dt.fnGetData(id);
    if (data.checked)
      if (property)
        result.push(data[property]);
      else
        result.push(data);
  });

  return result;
}

oTable.updateInfo = function() {
  var selector = '.dataTables_info';
  //$(selector).html('Selected ' + this.getCheckedItems().length + ' | ' + $(selector).html().split('|').pop());
  $(selector).html($(selector).html().split('.').slice(0, 1) + '. ' + this.getCheckedItems().length + ' selected');
}

oTable.getTextInfo = function(property) {
  var checkedItems = this.getCheckedItems(property);
  var result = '';
  var info = {};
    info.total = checkedItems.length;
    info.items = checkedItems.slice(0, 10);

  if (info.total > 10)
    result += info.items.slice(0, 10).join(', ') + ' ... (' + info.total + ' extensions)';
  else
    result += info.items.slice(0, 10).join(', ');
    
  return result;
    
}

oTable.find('#selectAll').bind('click', function(event) {
  var checked = $(this).is(':checked');

  var allRowsId = oTable.fnSettings().aiDisplayMaster;
  setChecked(allRowsId, false);
  
  var visibleRowsId = oTable.fnSettings().aiDisplay;
  setChecked(visibleRowsId, checked);
  
  oTable.updateInfo();
  
  function setChecked(data, checked) {
    $.each(data, function(index, id) {
      var row = oTable.fnGetNodes(id);
      oTable.fnGetData(id).checked = checked;
      $(row).find('input')
        .attr('checked', checked)
        .trigger('change');
    });
  }
});

var filterInput = $(".dataTables_filter input");

filterInput.unbind('keyup search input').bind('keyup search input', function (event) {
  var pWords = [];
  var nWords = [];
  var pRegex = '';
  var nRegex = '';
  var keywords  = filterInput.val().split(' ');
  console.info(keywords);
  keywords.forEach(function(item) {
    item = item.trim();
    if (item.length > 0) {
      if (item.search(/^\!/) >= 0)
        nWords.push(item.slice(1));
      else
        pWords.push(item);
    }
      
  });
  
  if (pWords.length > 0)
    pRegex = '(?=.*(' + pWords.join('|') + ').*)';
  
  if (nWords.length > 0)
    nRegex = '(?=^((?!(' + nWords.join('|') + ')).)*$)';

  //console.info(pRegex+nRegex);
  oTable.fnFilter(pRegex+nRegex, null, true, false, true, true);
});


var btnsAddExtension = [
    {
        text: "Save",
        "class": 'btn',
        click: function() {
            if($('#form-main').valid()) {
                var self = this;
                $.ajax({
                    type: 'POST',
                    url: '/data/extensions/save_ext',
                    data: $(self).find('form:first').serializeArray(),
                    dataType: 'json',
                    async: false,
                    success: function(data) {
                        if(data.success) {
                            oTable.fnReloadAjax();
                            $(self).dialog('close');
                            changeBtnApply(1);
                        } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
                    }
                });
            }
        }
    }
];

var btnsAddGroupExtension = [
  {
    text: "Save",
    "class": 'btn',
    click: function() {
      if($('#form-main').valid()) {
        var self = this;
        $.ajax({
          type: 'POST',
          url: '/data/extensions/save_group',
          data: $(self).find('form:first').serializeArray(),
          dataType: 'json',
          async: false,
          success: function(data) {
            if(data.success) {
              oTable.fnReloadAjax();
              $(self).dialog('close');
              changeBtnApply(1);
            } else showDialog('Information', '<p align="center">'+data.message+'</p>', 'auto', 'auto');
          }
        });
      }
    }
  }
];

$('#tblExtensions tbody tr').live('dblclick', function() {
    showDialog('Edit Extension', {url:'/modal/extension/edit'}, '800', 'auto', btnsAddExtension);
});

$('#btnAddExtension').click(function() {
    showDialog('Add Extension', {url:'/modal/extension/add'}, '800', 'auto', btnsAddExtension);
});

$('#btnEditExtension').click(function() {
  if (oTable.getCheckedItems().length > 1)
    showDialog('Group Edit Extensions', {url:'/modal/extension/edit_group'}, '800', 'auto', btnsAddGroupExtension);
  else
    if (oTable.isSelectedRow())
      showDialog('Edit Extension', {url:'/modal/extension/edit'}, '800', 'auto', btnsAddExtension);
});

$('#btnDeleteExtension').click(function() {
  var btnsDelete = [
    {
      text: 'Ok',
      "class": 'btn btn-primary',
      click: function() {
        $(this).dialog('close');
        var id = [];
        if (oTable.getCheckedItems().length > 0)
          id = oTable.getCheckedItems('extid');
        else
          id = [currentRow.extid];
          
        $.ajax({
          type: 'POST',
          data: {id: id/*, ext: currentRow.ext*/},
          url: '/data/extensions/delete',
          dataType: 'json',
          success: function(data) {
            if(data.success) {
              oTable.fnReloadAjax();
              //$('#btnDeleteExtension').attr('disabled', true);
              changeBtnApply(1);
            }
            showDialog('Information', data.message, '300','auto');
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

    if (oTable.getCheckedItems().length > 0)
      showDialog('Warning!', '<p align="center">Delete extensions: ' + oTable.getTextInfo('extension') + '?</p>', 'auto', 'auto', btnsDelete);
    else
      if (oTable.isSelectedRow())
        showDialog('Warning', '<p align="center">Delete this Extension?</p>', 'auto', 'auto', btnsDelete);
});