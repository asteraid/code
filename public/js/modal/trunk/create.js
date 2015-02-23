$('a[href="#tab3"]').click(function() {
    var textConfig_1 = getConfig('form[name="form-basic"], form[name="form-advanced"]');
	$('textarea[name="config_1"]').html(textConfig_1);
    aceConfig_1.getSession().setValue(textConfig_1);
});
