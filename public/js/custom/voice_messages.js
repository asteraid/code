var columns = [
  {"mData":"start"},
  {"mData":"src"},
  {"mData":"dst"},
  {"mData":"duration"},
  {"mData":"host"},
  {"mData":'voice_message',
   "mRender": function (oObj,type,row) {
      var filename = row.voice_message;
      var host = row.host;
      var urlFile = '/data/voice_messages/get_voice_file?' + 'filename=' + filename;
      
      var buttonPlay = '<button type="button" onclick="play_voice(\''+host+'\',\''+filename+'\')" class="btn btn-small" href="#" data-toggle="tooltip" title="listen file"><i class="icon-headphones"></i></button>';
      
      var buttonLoad = '<a href="' + urlFile + '" class="btn btn-small" href="#" data-toggle="tooltip" title="download file" ><i class="icon-download-alt"></i></a>';
      
      /*var buttonDelete = ['<a href="#" class="btn btn-small btnDelete" onclick="deleteFile(\'' + filename + '\'); return false;" data-toggle="tooltip" title="delete file">', '<i class="icon-remove"></i>', '</a>'].join('');*/
      var buttonDelete = [
        '<a ',
          'href="#" ',
          'class="btn btn-small btnDelete" ',
          'item-host="' + host + '" ',
          'item-filename="' + filename + '" ',
          'data-toggle="tooltip" ',
          'title="delete file" ',
        '>',
          '<i class="icon-remove"></i>',
        '</a>'].join('');

      return [buttonPlay, buttonLoad, buttonDelete].join(' ');
    },
    "fnCreatedCell": function (cell) {
      //console.info(cell);
      $('.btnDelete', cell).bind('click', function(event) {
        //console.info(event);
        var fileName  = $(this).attr('item-filename');
        var host      = $(this).attr('item-host');
        deleteFile(fileName, host);
        console.info(fileName, host);
        event.preventDefault();
      });
    }
  }
];

var columnsDefs = [];

var currentRow;

var oTable = setDataTableTest('tblCdr', '/data/voice_messages/list', columns, columnsDefs, undefined, undefined, true, true);

$('.btnDelete').bind('click', function(event) {
  console.info(event);
  return false;
});

function deleteFile(filename, host) {
  var btnsDelete = [
    {
      text: 'Ok',
      "class": 'btn btn-primary',
      click: function() {
        $(this).dialog('close');
        $.ajax({
          type: 'GET',
          data: {filename: filename, host: host},
          url: '/data/voice_messages/delete',
          dataType: 'json',
          success: function(data) {
              if(data.success) {
                  oTable.fnReloadAjax();
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
  showDialog('Warning!', '<p align="center">Delete this file?</p>', '350', 'auto', btnsDelete);
};

function play_voice(host, filename){
  var player;
  var urlFile;
  var title = filename.substring(filename.lastIndexOf('/') + 1);
  // TODO запускаем аяксом скрипт загрузки файла от него получаем имя файла
  if (filename && host) {
    urlFile = '/data/voice_messages/get_voice_file?host=' + host + '&filename=' + filename;
    $('#player').dialog({
        height: 100, 
        width: 430,
        resizable: false, 
        title: title,
        close: function(event, ui){
            if (player){
                player.pause();
            }
        }
    });
    
    $('#player audio').attr('src',urlFile);
    player = new MediaElementPlayer('#player audio');
    player.play();
  }
}