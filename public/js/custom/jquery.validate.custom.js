jQuery.validator.addMethod("notEqual", function(value, element, param) {
    var target = $(param);
    return !(value == target.val());
}, "Please specify a different value");