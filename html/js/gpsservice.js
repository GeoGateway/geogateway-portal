// js.code for GPS service

function rungpsservice(){

	//testing formating
	var action = [];
	var actionlist = ["getvelocities","getdisplacement","getcoseismic","getpostseismic"];
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
	for (i = 0; i< obj.urls.length; i++) {
		linkurl = obj.urls[i];
		filename = linkurl.substring(linkurl.lastIndexOf('/')+1);
		if (filename.includes("kml")) {    newkmlLayer = new google.maps.KmlLayer({
        url: linkurl,
         suppressInfoWindows: false,
        map: mapA
    	});
	};
		tablestr+='<tr class="uavsar-tr"><td>';
		tablestr+="<a href="+linkurl+">"+filename+"</a>";
		tablestr+="</td></tr>";

	};
	tablestr += "</tbody></table>";
	document.getElementById("gpsservice_results").innerHTML = tablestr;

    });
}