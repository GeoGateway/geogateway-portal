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
	if (actiontype != "getdisplacement") {
		document.getElementById( 'dwin1_show' ).style.display = 'none';
		document.getElementById( 'dwin2_show' ).style.display = 'none';
	};

	if (actiontype == "getcoseismic" || actiontype == "getpostseismic") {
		document.getElementById( 'ctwin_show' ).style.display = 'inline-table';
		document.getElementById( 'ptwin_show' ).style.display = 'none';
	};
	if (actiontype == "getpostseismic") {
		document.getElementById( 'ctwin_show' ).style.display = 'inline-table';
		document.getElementById( 'ptwin_show' ).style.display = 'inline-table';
	};
	if (actiontype == 'getmodel') {
		document.getElementById( 'epoch_show' ).style.display = 'none';
		document.getElementById( 'epoch1_show' ).style.display = 'inline-table';
		document.getElementById( 'epoch2_show' ).style.display = 'inline-table';
		document.getElementById( 'ctwin_show' ).style.display = 'none';
		document.getElementById( 'ptwin_show' ).style.display = 'none';
	};
	if (actiontype == 'getdisplacement'){
		document.getElementById( 'epoch_show' ).style.display = 'none';
		document.getElementById( 'epoch1_show' ).style.display = 'inline-table';
		document.getElementById( 'epoch2_show' ).style.display = 'inline-table';
		document.getElementById( 'ctwin_show' ).style.display = 'none';
		document.getElementById( 'ptwin_show' ).style.display = 'none';
		document.getElementById( 'dwin1_show' ).style.display = 'inline-table';
		document.getElementById( 'dwin2_show' ).style.display = 'inline-table';
	};
	if (actiontype == "getvelocities") {
		document.getElementById( 'epoch_show' ).style.display = 'none';
		document.getElementById( 'epoch1_show' ).style.display = 'none';
		document.getElementById( 'epoch2_show' ).style.display = 'none';
		document.getElementById( 'ctwin_show' ).style.display = 'none';
		document.getElementById( 'ptwin_show' ).style.display = 'none';
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
	// default height and width = 1
	var width_tx = $('#gs_width').val();
	if (width_tx == "" ||  width_tx == null) {width_tx = 1};
	var height_tx = $('#gs_height').val();
	if (height_tx == "" || height_tx == null) {height_tx = 1};

	var data = {"function":actionstr,
			"lat":$('#gs_latitude').val(),
			"lon":$('#gs_longitude').val(),
			//"width":$('#gs_width').val(),
			//"height":$('#gs_height').val(),
			"width": width_tx,
			"height": height_tx,
			"epoch":$('#gs_epoch').val(),
			"epoch1":$('#gs_epoch1').val(),
			"epoch2":$('#gs_epoch2').val(),
			"scale":$('#gs_scale').val(),
			"ref":$('#gs_refsite').val(),
			"ct":$('#gs_ctwin').val(),
			"pt":$('#gs_ptwin').val(),
			"dwin1":$('#gs_dwin1').val(),
			"dwin2":$('#gs_dwin2').val(),
			"prefix":$('#gs_outputprefix').val(),
			"mon": document.getElementById("gs_mon").checked,
			"eon": document.getElementById("gs_eon").checked,
			"vabs": document.getElementById("gs_vabs").checked
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
		tablestr+= '<input  type="checkbox" id="gpsplot_checkbox" checked=checked value='+ (gpsplot_layers.length-1) +' onclick="check_gpsplot(this)">';
		};
		tablestr+="<a href="+linkurl+">"+filename+"</a>";
		tablestr+="</td></tr>";
	};
	tablestr += "</tbody></table>";
	document.getElementById("gpsservice_results").innerHTML = tablestr;
	$('#gs_submit').text('Run');

    });
}

function spwindowpicker() {
		var drawingManager = new google.maps.drawing.DrawingManager();

		//Setting options for the Drawing Tool. In our case, enabling Polygon shape.
		drawingManager.setOptions({
			drawingMode : google.maps.drawing.OverlayType.RECTANGLE,
			drawingControl : true,
			drawingControlOptions : {
				position : google.maps.ControlPosition.TOP_CENTER,
				drawingModes : [ google.maps.drawing.OverlayType.RECTANGLE ]
			},
			rectangleOptions : {
				strokeColor : '#6c6c6c',
				strokeWeight : 3.5,
				fillColor : '#926239',
				fillOpacity : 0.6,
                editable: true,
              draggable: true
			}	
		});
		// Loading the drawing Tool in the Map.
		drawingManager.setMap(mapA);
		drawing_listener = google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
        	drawingManager.setDrawingMode(null);
            //alert("Rectangle:" + e.overlay.getBounds());
            var ne = e.overlay.getBounds().getNorthEast();
        	var sw = e.overlay.getBounds().getSouthWest();
        	// function ne.lat(),ne.lng()
        	var center_lat = (ne.lat() + sw.lat())/2.0;
        	var center_lon = (ne.lng() + sw.lng())/2.0;
        	var win_width = Math.abs((ne.lng() - sw.lng()));
        	var win_height = Math.abs((ne.lat() - sw.lat()));
        	//alert(ne.toString()+"/"+sw.toString()+"/"+center_lon.toString()+"/"+center_lat.toString()+"/"+win_width.toString()+"/"+win_height.toString());
        	//fill in the value
        	$("#gs_latitude").val(center_lat.toFixed(4));
        	$("#gs_longitude").val(center_lon.toFixed(4));
        	$("#gs_width").val(win_width.toFixed(4));
        	$("#gs_height").val(win_height.toFixed(4));
            e.overlay.setMap(null);
            drawingManager.setMap(null);

        });

}

//google.maps.event.addDomListener(window, 'load', initialize);

