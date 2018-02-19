// js.code for GPS service
var gpsplot_layers=[];

function check_gpsplot(element) {
	var layer = gpsplot_layers[element.value];
    if (element.checked) {
        layer.setMap(mapA);
    } else {
        layer.setMap(null);
    }
};

//show paras for each functions
function showgpsparas() {
	var actiontype = $("#kmltype_sel").val();
	if (actiontype == "getcoseismic" || actiontype == "getpostseismic") {
		document.getElementById( 'epoch_show' ).style.display = 'inline-table';
		document.getElementById( 'epoch1_show' ).style.display = 'none';
		document.getElementById( 'epoch2_show' ).style.display = 'none';
	};
	if (actiontype == 'getdisplacement'){
		document.getElementById( 'epoch_show' ).style.display = 'none';
		document.getElementById( 'epoch1_show' ).style.display = 'inline-table';
		document.getElementById( 'epoch2_show' ).style.display = 'inline-table';
	};
	if (actiontype == "getvelocities") {
		document.getElementById( 'epoch_show' ).style.display = 'none';
		document.getElementById( 'epoch1_show' ).style.display = 'none';
		document.getElementById( 'epoch2_show' ).style.display = 'none';
	};

};

function rungpsservice(){

	//testing formating
	var action = [];
	//var actionlist = ["getvelocities","getdisplacement","getcoseismic","getpostseismic"];
	action.push($("#kmltype_sel").val());
	// for (i = 0; i < actionlist.length; i++) {
	// 	if ($("#"+actionlist[i]).is(':checked')){
	// 		action.push(actionlist[i]);}
	// 	}
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
			"epoch":$('#gs_epoch').val(),
			"epoch1":$('#gs_epoch1').val(),
			"epoch2":$('#gs_epoch2').val(),
			"scale":$('#gs_scale').val(),
			"ref":$('#gs_refsite').val(),
			"mon": document.getElementById("gs_mon").checked,
			"eon": document.getElementById("gs_eon").checked
		};
	//alert(jQuery.param(data));
	$('#gs_submit').text('Calculating');
	 $.ajax({
        url:'gps_service',
        async:false,
        data:{'data':jQuery.param(data)}
    }).done(function(result) {
	var obj = JSON.parse(result);
	var tablestr = '<table class="uavsar-table"><tbody>';
	var filename;
	var linkurl;
	var newkmllayer;
	if (obj.urls.length == 0) {
		alert("No return, please change the parameters and try again!");
		return;
	};
	// unload previous layers
	//alert(gpsplot_layers.length);
	if (gpsplot_layers.length >= 1) {
		for (i=0; i<gpsplot_layers.length; i++ ){
			gpsplot_layers[i].setMap(null);
		};
	};
    gpsplot_layers=[];
	for (i = 0; i< obj.urls.length; i++) {
		linkurl = obj.urls[i];
		filename = linkurl.substring(linkurl.lastIndexOf('/')+1);
		tablestr+='<tr class="uavsar-tr"><td>';
		if (filename.includes("kml")) { newkmlLayer = new google.maps.KmlLayer({
        url: linkurl,
         suppressInfoWindows: false,
        map: mapA
    	});
		gpsplot_layers.push(newkmlLayer);
		tablestr+= '<input  type="checkbox" id="gpsplot_checkbox" checked=checked value='+ i +' onclick="check_gpsplot(this)">';
		};
		tablestr+="<a href="+linkurl+">"+filename+"</a>";
		tablestr+="</td></tr>";
	};
	tablestr += "</tbody></table>";
	document.getElementById("gpsservice_results").innerHTML = tablestr;
	$('#gs_submit').text('Run');

    });
}