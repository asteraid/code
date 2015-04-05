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

oTable.isCheckedItems = function() {
  return $(this).find('tbody input:checked').length > 0 ? true : false;
}

oTable.isSelectedRow = function() {
  return $(this).find('.row_selected').length > 0 ? true : false;
}

oTable.getCheckedItemsData = function(property) {
  var result    = [];
  var dt        = this;
  var htmlItems = $(dt).find('tbody input:checked').closest('tr');
  
  $.each(htmlItems, function(index, el) {
    var position = dt.fnGetPosition(el);
    if (property)
      result.push(dt.fnGetData(position)[property]);
    else
      result.push(dt.fnGetData(position));
  });
  
  return result;
}

oTable.find('#selectAll').bind('click', function(event) {
  var checked = false;
  if ($(this).is(':checked'))
    checked = true;
  
  var allRowsId = oTable.fnSettings().aiDisplayMaster;
  setChecked(allRowsId, false);
  
  var visibleRowsId = oTable.fnSettings().aiDisplay;
  setChecked(visibleRowsId, checked);
  
  function setChecked(data, checked) {
    $.each(data, function(index, id) {
      var row = oTable.fnGetNodes(id);
      //oTable.fnGetData(id).checked = checked;
      $(row).find('input').attr('checked', checked);
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

  console.info(pRegex+nRegex);
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
  if (oTable.isCheckedItems())
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
        if (oTable.isCheckedItems())
          id = oTable.getCheckedItemsData('extid');
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

    if (oTable.isCheckedItems())
      showDialog('Warning!', '<p align="center">Delete extensions: ' + oTable.getCheckedItemsData('extension').join(', ') + '?</p>', 'auto', 'auto', btnsDelete);
    else
      if (oTable.isSelectedRow())
        showDialog('Warning', '<p align="center">Delete this Extension?</p>', 'auto', 'auto', btnsDelete);
});