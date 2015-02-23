var regexpPattern = 
    {
        name_object: /^(((?!__)[a-zA-Z0-9-_])+)$/
    };

var regexpMessage = 
    {
        name_object: 'You should use: 0-9, a-z, A-Z',
        max_character: 'Maximum field value - 50 characters'
    };

//добавляем новый метод для валидарота reqexp
jQuery.validator.addMethod(
    'regexp',
    function(value, element, regexp) {
        var re = new RegExp(regexp); console.info(re);
        return this.optional(element) || re.test(value);
    },
    "Please check your input."
);

//преобразование значений из формы в конфиг textarea
function getConfig(forms) {
	var config = '';
	$.each($(forms).serializeArray(), function(index, el) {
		var values = el.value;
		var key = el.name;
		switch(key) {
			case 'name':
				if(values != '')
					config = '[' + values + '](!)' + '\n' + config;
			break;
			//case 'allow':
			case 'permit':
			case 'deny':
            case 'record':
				values = el.value.split(',');
				if(values != '')
					$.each(values, function(index, el) {
						config += key + '=' + el + '\n';
					});
			break;
			case 'comment':
            case 'ext_rul':
            case 'node':
            case 'custom_type':
            case 'commented':
			break;
			default:
				config += key + '=' + values + '\n';
			break;
		}
	});
	return config;
}

//Gets extensions list from database
function getExtensionsList() {
    var list = [];

    $.ajax({
        type: 'GET',
        url: '/data/extensions/list',
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data.success)
                $.each(data.rows, function(index, el) {
					list.push({id: el.ext, text: el.ext});
                });
        }
    });

    return list;
}

//преобразовует input в select2
function select2Input(obj, json, multiple, custom) {
	if(custom)
		$(obj).select2({
			createSearchChoice:function(term, data) {
				if ($(data).filter(function() {
					return this.text.localeCompare(term)===0;}).length===0) {return {id:term, text:term};} },
			multiple: multiple,
			data: json.data
		}).select2('data', json.data[json.selected]);
	else
		$(obj).select2({
			multiple: multiple,
			data: json.data
		}).select2('data', json.data[json.selected]);
}

//генерит пароль
function getRandomPassword() {
	var length = 16,
        charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

// get list of contexts
function getContextsList(type) {
    var list = [];

    $.ajax({
        type: 'GET',
        url: '/data/contexts/list',
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data.success)
                $.each(data.rows, function(index, el) {
                    if(type == 'all')
                        list.push({id: el.name, text: el.name + ' (' + el.type + ')'});
                    else if(itemId != el.id)
                        list.push({id: el.name, text: el.name + ' (' + el.type + ')'});
                });
        }
    });

    return list;
}

// get list of contexts
function getContextsList2(type) {
    var list = [];

    $.ajax({
        type: 'GET',
        url: '/data/contexts/list',
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data.success)
                $.each(data.rows, function(index, el) {
                    if(type == 'all')
                        list.push({id: el.id, text: el.name + ' (' + el.type + ')'});
                    else if(itemId != el.id)
                        list.push({id: el.id, text: el.name + ' (' + el.type + ')'});
                });
        }
    });

    return list;
}

// get list of templates
function getTemplatesList() {
    var list = [];
    $.ajax({
        type: 'GET',
        url: '/data/templates/list',
        data: {type: 'template'},
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data.success) {
                $.each(data.rows, function(index, el) {
                    list.push({id: el.id, text: el.name});
                });
            }
        }
    });
    
    return list;
}

function fillFormSimple(url, id) {
    $.ajax({
        type: 'POST',
        data: {id: id},
        url: url,
        dataType: 'json',
        async: false,
        success: function(data) {
            if(data.success)
                $.each(data.data, function(index, el) {
                    var form_element = '[name="' + index + '"]';
                    if($(form_element).length) {
                    //console.log(el);
                        if($(form_element).hasClass('input-select2'))
                            $(form_element).select2('val', el);
                        else
                            $(form_element).val(el);
                    }
                });
        }
    });
}

function fillForm(url) {
    $.ajax({
		type: 'POST',
		url: url,
		data: {id: currentRow.id, action: ''},
		dataType: 'json',
		async: false,
		success: function(data) {
			if(data.success) {
				$('input[name="name"]').val(currentRow.name);
				$('textarea[name="comment"]').val(currentRow.comment);
		        $.each(data.data, function(index, el) {
              inputField = $('input[name="' + el.name + '"]');
              if (el.expert == 0) {
                if (inputField.hasClass('input-select2')) {
                  var valuesSelect2 = [];
                            //var isNumber = false;

                            // convert el.value to string, if it number
                            /*if(!isNaN(parseFloat(el.value)) && isFinite(el.value)) {
                                el.value = el.value.toString();
                                isNumber = true;
                            }*/
                  arrayValues = el.value.split(',');
                  if (arrayValues.length > 1) {
                    $.each(arrayValues, function(index, el) {
                      valuesSelect2.push({id: el, text: el});
                    });
                    //console.info('length > 1 = ', valuesSelect2);
                    inputField.select2('data', valuesSelect2);
                  } else {
                    valuesSelect2 = {id: arrayValues[0], text: arrayValues[0]};
                    inputField.select2('data', valuesSelect2);
                    //console.info('length <= 1 =', arrayValues);
                    //inputField.select2('val', arrayValues[0]);
                  }
                  inputField.select2('data', valuesSelect2);
                  //inputField.select2('data', valuesSelect2);
                } else inputField.val(el.value);
              } else {
                $('textarea[name="config_2"]').append(getConfig($('<input name="' + el.name + '" value="' + el.value + '">')));
              }
		        });
			}// else alert(data.message);
		}
	});
}

// multi
function getNodesList() {
  var listNodes = [];
  listNodes.selected = 0;
  listNodes.data = [];
  listNodes.data.push({id: 'ALL', text: 'ALL'});
  //"type=name" - all info, "type=short" - short info
  $.ajax({
      type: 'GET',
      url: '/data/exec/get_serverList?type=short',
      dataType: 'json',
      async: false,
      success: function(data) {
          if(data.success) {
              $.each(data.rows, function(index, el) {
                  listNodes.data.push({id: el.name, text: el.name});
              });
          }
      }
  });

  return listNodes;
}
