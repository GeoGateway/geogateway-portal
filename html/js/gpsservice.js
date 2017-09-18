// js.code for GPS service

function rungpsservice(){
	var action = [];
	var actionlist = ["getvelocities","getdisplacement","getcoseimic","getpostseismic"];
	for (i = 0; i < actionlist.length; i++) {
		if ($("#"+actionlist[i]).is(':checked')){
			action.push(actionlist[i]);}
		}
	if (action.length <1) {
		alert("Please select as least one plot!");
		return;
	}		
	var actionstr = action.join(",");

	var data = {"function":actionstr,
			"lat":$('#gs_latitude').val(),
			"lon":$('#gs_longitude').val(),
			"width":$('#gs_width').val(),
			"height":$('#gs_height').val(),
			"epoch":$('#gs_epoch1').val(),
			"epoch1":$('#gs_epoch1').val(),
			"epoch2":$('#gs_epoch2').val()
		};
	//alert(jQuery.param(data));
}