select2Input('input[name="allow"]', listAllow, true, true);
select2Input('input[name="commented"]', listCommented, false, false);
select2Input('input[name="qualify"]', listQualify, false, false);
select2Input('input[name="type"]', listType, false, false);
select2Input('input[name="canreinvite"]', listCanreinvite, false, false);
select2Input('input[name="insecure"]', listInsecure, true, false);
select2Input('input[name="nat"]', listNat, true, false);
select2Input('input[name="node"]', getNodesList(), false, false);

$('input[name="nat"]').select2('data', [{id: 'force_rport', text: 'force_rport'}, {id: 'comedia', text: 'comedia'}]);
