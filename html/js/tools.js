// reference: sarselect2.js from Malron's code
// http://gf4.ucs.indiana.edu/InSAR-LOS/SAR-LOS-Main2.faces
//setting up Google Maps and all overlays
var mapA;
//var wmsgf9;
var wmsgf9_select;
var wmsgf9_select_direction_kml;
var wmsgf9_select_legend_kml;
var highresoverlay;
var wmsgf9_samples = {};
var UAVSARDrawingManager;
var ctaLayer;
var all_overlays = [];
var drawing_listener;
var dygraph1;
var dislockmls = [];
var rowSelected=null;
var kmlLayerObj=[];
var markers=[];
var mag_limit=0.0;
var quakes_loaded=false;
var depth_limit=1000.0;
var userPositionMarker;
var stateKml;
var coastlineKml;
var uavsarDataSet;

/////////////////////////////////////// UAVSAR ////////////////////////////////

function filterUavsarImagesByDate(selectedDate) {
    console.log("Selected time:"+selectedDate);
    console.log(uavsarDataSet);
    var uavsarDataSubSet=[];
    for(var i=0; i<uavsarDataSet.length;i++){
	console.log(new Date(uavsarDataSet[i].time1));
	if(uavsarDataSet[i].time1 < new Date(selectedDate) < uavsarDataSet[i].time2) {
	    uavsarDataSubSet.push(uavsarDataSet[i]);
	}
    }
    displaySelectedImages(uavsarDataSubSet);
    
}

// deletes all geometry markings made for UAVSAR
function deleteAllShape() {
    //    console.log("Calling deleteAllShape");
    for (var i=0; i < all_overlays.length; i++) {
        all_overlays[i].overlay.setMap(null);
    }
    all_overlays = [];
}

// delete all UAVSAR kml layers
function deleteAllKml() {
    if (wmsgf9_samples != null) {
        for ( var uid in wmsgf9_samples) {
            //console.log(wmsgf9_samples[uid]);
            wmsgf9_samples[uid][0].setMap(null);
        }
	//        wmsgf9_samples.length = 0;
        wmsgf9_samples={};
    }
    // remove direction kml if loaded
    if (typeof wmsgf9_select_direction_kml !== 'undefined') {
        wmsgf9_select_direction_kml.setMap(null);
    }
    // remove legend kml if loaded
    if (typeof wmsgf9_select_legend_kml !== 'undefined') {
        wmsgf9_select_legend_kml.setMap(null);
    }
}

//START UAVSAR
function setup_UAVSAR() {

    //Controling the Layers that appear in Map A.  You can set certain maps to appear in Map A or in Map B.  In this example they appear in both maps.
    //TODO: These need to be unified with mapA's other option settings in initialize().
    /**
    mapA.setOptions({
        mapTypeControlOptions: {
            mapTypeIds: [
                google.maps.MapTypeId.HYBRID,
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.TERRAIN
            ],
            style:  google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        disableDefaultUI: false
    });
*/

//    mapA.setMapTypeId(google.maps.MapTypeId.TERRAIN);

    // add drawing tools
    UAVSARDrawingManager = new google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions:{
	    
            position: google.maps.ControlPosition.TOP_CENTER,
	    
            drawingModes: [
		google.maps.drawing.OverlayType.MARKER,
		google.maps.drawing.OverlayType.POLYLINE,
		google.maps.drawing.OverlayType.POLYGON,
		google.maps.drawing.OverlayType.RECTANGLE]
        },
        markerOptions: {
            draggable: false
        },
        polylineOptions: {
            editable: false
        },
        rectangleOptions: {
            editable: false
        },
        polygonOptions: {
            editable: false
        },

    });

    drawing_listener = google.maps.event.addListener(UAVSARDrawingManager, 'overlaycomplete', function(e) {
	//        console.log("Calling Drawing Listener");
        deleteAllShape();
        all_overlays.push(e);
        UAVSARDrawingManager.setDrawingMode(null);
        var x = document.getElementById('UAVSAR-geometry');
        if (e.type == "marker") {
	    x.innerHTML = "Point: " + e.overlay.getPosition();
	};
        if (e.type == "polyline") { 
            x.innerHTML = "Line: " + e.overlay.getPath().getArray();
	};
        if (e.type == "polygon") {
            x.innerHTML = "Polygon: " + e.overlay.getPath().getArray();
	};
        if (e.type == "rectangle") {
            x.innerHTML = "Rectangle:" + e.overlay.getBounds();
	};
    
        // call uavsar query
        //console.log(x.innerHTML);
        uavsarquery(x.innerHTML);
    });
}

//Put user-supplied  layer on the map
function addKmlLayer(){
    var theLayer=document.getElementById("kmlMapperUrl").value;
    //theLayer = theLayer +'?time='+new Date().getTime();
    //alert(theLayer);
    console.log("Adding layer:"+theLayer);
    kmlLayer = new google.maps.KmlLayer({
        url: theLayer,
         suppressInfoWindows: false,
        map: mapA
    });
    kmlLayerObj[theLayer]=kmlLayer;
}

function toggleKmlDisplay(toggleLayer){
    console.log(toggleLayer.id);
    console.log(toggleLayer.checked);
    //Note value of checked will have just changed.
    if(kmlLayerObj[toggleLayer.id]==null) {
        kmlLayer = new google.maps.KmlLayer({
            url: toggleLayer.id +'?time='+(new Date()).getTime(),
            suppressInfoWindows: false,
            preserveViewport: true
        });
        kmlLayerObj[toggleLayer.id]=kmlLayer;
    }
    
    if(toggleLayer.checked) {
        kmlLayerObj[toggleLayer.id].setMap(mapA);
    }
    else {
        console.log(kmlLayerObj[toggleLayer.id]);
        kmlLayerObj[toggleLayer.id].setMap(null);
    }
}

//check out dislocKMLLayer
function loaddislocKmlLayer(folderurl,kmlfile){
    dislockmls[folderurl]="";
}

function check_dislockml(element) {
    if(dislockmls[element.value]==null) {
        dislockmls[element.value]="";
    }
    if (element.checked) {
        //alert("load:" + element.value);
        if (dislockmls[element.value] == "") {
            var theLayer = document.getElementById(element.value).href;            
            //alert(theLayer);
            kmlLayer = new google.maps.KmlLayer({
                url: theLayer,
                suppressInfoWindows: false,
                map: null
            });
        dislockmls[element.value]=kmlLayer;
        }

        dislockmls[element.value].setMap(mapA);
    }else{
        //alert("unload:" + element.value);
        dislockmls[element.value].setMap(null);
    }
}
// LOS TOOLS
// DYGRAPHS IMPLEMENTATION
var LOS_markers = [];
var LOS_line = null;
function draw_marker(lat, lng, color) {
    var myLatlng = new google.maps.LatLng(lat, lng);
    if(color == 'red')
        var icon = '/etc/google_maps_markers/blue_MarkerO.png';
    else
        var icon = '/etc/google_maps_markers/red_MarkerO.png';
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: mapA,
        visible: true,
        title: LOS_markers.length.toString(),
        draggable: true,
        icon: icon
    });
    LOS_markers.push(marker);
}

function updateStartLat(){
	 var newPos=new google.maps.LatLng($("#startLat-value").val(),LOS_markers[0].getPosition().lng());
	 LOS_markers[0].setPosition(newPos);
	 google.maps.event.trigger(LOS_markers[0],"drag");
	 google.maps.event.trigger(LOS_markers[0],"dragend");
}

function updateStartLon(){
	 var newPos=new google.maps.LatLng(LOS_markers[0].getPosition().lat(),$("#startLon-value").val());
	 LOS_markers[0].setPosition(newPos);
	 google.maps.event.trigger(LOS_markers[0],"drag");
	 google.maps.event.trigger(LOS_markers[0],"dragend");
}

function updateEndLat(){
	 var newPos=new google.maps.LatLng($("#endLat-value").val(),LOS_markers[1].getPosition().lng());
	 LOS_markers[1].setPosition(newPos);
	 google.maps.event.trigger(LOS_markers[1],"drag");
	 google.maps.event.trigger(LOS_markers[1],"dragend");
}

function updateEndLon(){
	 var newPos=new google.maps.LatLng(LOS_markers[1].getPosition().lat(),$("#endLon-value").val());
	 LOS_markers[1].setPosition(newPos);
	 google.maps.event.trigger(LOS_markers[1],"drag");
	 google.maps.event.trigger(LOS_markers[1],"dragend");
}

function setEndPointFormValues() {
	 $("#startLat-value").val(LOS_markers[0].getPosition().lat().toFixed(5));
	 $("#startLon-value").val(LOS_markers[0].getPosition().lng().toFixed(5));
	 $("#endLat-value").val(LOS_markers[1].getPosition().lat().toFixed(5));
	 $("#endLon-value").val(LOS_markers[1].getPosition().lng().toFixed(5));
}

function updateAzimuth() {
	 losLength=$("#losLength-value").val();
	 azimuth=$("#azimuth-value").val();
	 setEndpointsFromAzimuthAndLength();
}

//Uses the new distance to calculate the new ending lat,lon
function updateDistance() {
	 losLength=$("#losLength-value").val();
	 azimuth=$("#azimuth-value").val();
	 setEndpointsFromAzimuthAndLength();
}

function updateResolution() {
    drawDygraphAjax(LOS_uid);
}


function connect_LOS_markers() {
    var lineCoordinates = [
        LOS_markers[0].getPosition(),
        LOS_markers[1].getPosition()
    ];
    var line = new google.maps.Polyline({
        path: lineCoordinates,
        geodesic: false,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    line.setMap(mapA);
    google.maps.event.addListener(LOS_markers[0], 'drag', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
        updateToolPanelMarkerInfo();
        updateMarkerFormFields();
    });

    google.maps.event.addListener(LOS_markers[0], 'dragend', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
//        drawDygraph(LOS_uid);
        drawDygraphAjax(LOS_uid);
    });

    google.maps.event.addListener(LOS_markers[1], 'drag', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
        updateToolPanelMarkerInfo();
        updateMarkerFormFields();
    });

    google.maps.event.addListener(LOS_markers[1], 'dragend', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
//        drawDygraph(LOS_uid);
        drawDygraphAjax(LOS_uid);
    });
    LOS_line = line;
}

// script for loading a specific UAVSAR dataset
var LOS_uid = null;
var LOS_dataname = null;

function selectDataset(row, uid, dataname, heading, radardirection) {
//    console.log(row);
    if(rowSelected!=null){
        rowSelected.style.backgroundColor="white";
    }
    rowSelected=row;
	 rowSelected.style.backgroundColor="lightgreen";
//	 row.style.backgroundcolor="lightgreen";
       

    var x=document.getElementById('UAVSAR-heading');
    x.innerHTML="<b>Heading:</b>"+heading+"&deg &nbsp; &nbsp;";
    x.innerHTML+="<b>Radar Direction:</b>"+radardirection;

    $("#QuakeTables-Link").html('<p><a target="_blank" href="http://gf2.ucs.indiana.edu/quaketables/uavsar?uid='+uid+'"><b>Go to download page for selected data set</b></a></p>');

    var direction_kml = (heading.toString()).split(".")[0];
    direction_kml = "http://gf2.ucs.indiana.edu/direction_kml/"+direction_kml+"_left.kmz";
    //alert(direction_kml);
    //remove the previous one
    if (typeof wmsgf9_select_direction_kml !== 'undefined') {
        wmsgf9_select_direction_kml.setMap(null);
        }
        wmsgf9_select_direction_kml =  new google.maps.KmlLayer({
        url: direction_kml,
        preserveViewport:true,
        screenOverlays:true
        });
    wmsgf9_select_direction_kml.setMap(mapA);


    //Turn off the radio buttons and all the displays.
//    console.log(uid,dataname);
    for(var uid1 in wmsgf9_samples) {
		  $("#sarDisplayOrNot_"+uid1).prop('checked',false);	
		  $("#sarDisplayOrNot_"+uid1).prop('disabled',false);	
        wmsgf9_samples[uid1][1]=false;
        wmsgf9_samples[uid1][2]=true;
    }

    //Turn the display flags back on for the selected image.
	 $("#sarDisplayOrNot_"+uid).prop('checked',true);	 
	 $("#sarDisplayOrNot_"+uid).prop('disabled',true);
	 wmsgf9_samples[uid][1]=true;
	 wmsgf9_samples[uid][2]=false;
   
    // var querystr = uid + "/" + dataname;

    //See if this is the first selected image.
    var firstSelected=true;
    if(Object.keys(wmsgf9_select).length>0) {
        firstSelected=false;
    }
    wmsgf9_select = wmsgf9_samples[uid];

    // Zoom to the kmllayer if this is the first selected overlay.  Otherwise we
    // preserve the view port.
    if(firstSelected) {
        mapA.fitBounds(wmsgf9_select[0].getDefaultViewport());  
    }

    // check wms layer -- disabled for check-in
    if (wmsgf9_select[3] == 0) {
        var has_wms = checkwmslayer(uid,"highres");
        if (has_wms) {
            wmsgf9_select[3] =1;
            wmsgf9_samples[uid][3] = 1;
        }
        else {
            wmsgf9_select[3] = -1;
            wmsgf9_samples[uid][3] = -1;
        }
    }

    if(wmsgf9_select[2]) {
        viewDataset(uid, dataname, false);
    }
    viewDataset(uid, dataname, true);
    updateVisibleDatasets();
    $("input:checkbox[value="+uid+"]").prop("checked", true);

    // this part needs clean up
    if (typeof wmsgf9_select_legend_kml !== 'undefined') {
                    wmsgf9_select_legend_kml.setMap(null);
    }

    if (! $('#color-mapping-checkbox').prop('checked')) {
        if ($('#get-area-minmax-button').is(':visible')) {$("#get-area-minmax-button").css("display", "none");};
        $('#Strech-color-div').html('');
    };
    if (wmsgf9_select[3] == 1 || $('#color-mapping-checkbox').prop('checked')) {
        // remove the previsous high res overlat if loaded
        if (typeof highresoverlay !== 'undefined') {
              mapA.overlayMapTypes.setAt(0, null); 
        }
        // remove the legend if loaded
        if (typeof wmsgf9_select_legend_kml !== 'undefined') {
                    wmsgf9_select_legend_kml.setMap(null);
        }

        //load color mapping one if checked
        if($('#color-mapping-checkbox').prop('checked')) {
            var has_coloring;
            has_coloring = checkwmslayer(uid,"coloring");
            if (has_coloring) {
                if (wmsgf9_samples[uid][4] == 0 ) {
                highresoverlay = loadWMS(mapA, "http://149.165.168.89/geoserver/InSAR/wms?","InSAR:uid"+uid+"_unw"); 
                // load legend
                var legend_kml = "http://149.165.168.89/uavsarlegend1/uid"+uid+"_unw_default.kmz"; }
                else {
                //load user defined 
                    var imagename = wmsgf9_samples[uid][4] ['image'];
                    var stylesld = wmsgf9_samples[uid][4] ['style'];
                    highresoverlay=loadWMSwithstyle(mapA, "http://149.165.168.89/geoserver/InSAR/wms?","InSAR:"+imagename,stylesld);

                    var legend_kml = wmsgf9_samples[uid][4] ['kmz']+"?dummy="+(new Date()).getTime();};                  
                    wmsgf9_select_legend_kml =  new google.maps.KmlLayer({
                    url: legend_kml,
                    preserveViewport:true,
                    screenOverlays:true
                    });
                wmsgf9_select_legend_kml.setMap(mapA);

                // enable color stretch function
                $("#get-area-minmax-button").show();
                $("#get-area-minmax-button").removeAttr('disabled');
                $("#get-area-minmax-button").on( "click", {uid: uid}, color_stretch);
                // if currentimage already shown
                if ($('#reset-color-button').is(':visible')) {$('#currentimage').val("uid" + uid + "_unw");};
            }  
            else {
                // disbale color stretch function

                $("#get-area-minmax-button").attr('disabled');
                highresoverlay = loadWMS(mapA, "http://149.165.168.89/geoserver/highres/wms?","highres:uid"+uid+"_unw");
                    // load high-res legend
            var legend_kml = "http://149.165.168.89/highreslegend/2pi.kmz";
            if (parseInt(uid)<=369) {legend_kml = "http://149.165.168.89/highreslegend/pi.kmz";};
            wmsgf9_select_legend_kml =  new google.maps.KmlLayer({
            url: legend_kml,
            preserveViewport:true,
            screenOverlays:true
            });
            wmsgf9_select_legend_kml.setMap(mapA);

            }
        }   
        else {

        //if ($('#get-area-minmax-button').is(':visible')) {$("#get-area-minmax-button").css("display", "none");};
        //$('#Strech-color-div').html('');
        highresoverlay = loadWMS(mapA, "http://149.165.168.89/geoserver/highres/wms?","highres:uid"+uid+"_unw");
        // load high-res legend
        var legend_kml = "http://149.165.168.89/highreslegend/2pi.kmz";
        if (parseInt(uid)<=369) {legend_kml = "http://149.165.168.89/highreslegend/pi.kmz";};
        wmsgf9_select_legend_kml =  new google.maps.KmlLayer({
        url: legend_kml,
        preserveViewport:true,
        screenOverlays:true
        });
        wmsgf9_select_legend_kml.setMap(mapA);
        }
//        console.log("High resolution overlay:",highresoverlay);
        wmsgf9_samples[uid][0].setMap(null);
        wmsgf9_samples[uid][1]=false;
    }

    //Turn everything off
    UAVSARDrawingManager.setMap(null);
    deleteAllShape();

    google.maps.event.addListener(mapA, 'click', function(kmlEvent) {
//        console.log("Map click event");
        if(LOS_markers.length == 0)
        {
            draw_marker(kmlEvent.latLng.lat(), kmlEvent.latLng.lng(), 'blue');
            draw_marker(kmlEvent.latLng.lat(), kmlEvent.latLng.lng() + 0.1, 'red');
            connect_LOS_markers();
            updateToolPanelMarkerInfo();
            updateMarkerFormFields();
            drawDygraphAjax(uid);
        }
    });
    //update the plot if markers already exist when change the dataset
    LOS_uid = uid;
    LOS_dataname = dataname;
    if (LOS_markers.length > 0 )
        {
            drawDygraphAjax(uid);
        }
}

	 function setAzimuth(){
		  var swLat=LOS_markers[0].getPosition().lat().toFixed(5);
		  var swLon=LOS_markers[0].getPosition().lng().toFixed(5);
		  var neLat=LOS_markers[1].getPosition().lat().toFixed(5);
		  var neLon=LOS_markers[1].getPosition().lng().toFixed(5);

		  //Using http://www.movable-type.co.uk/scripts/latlong.html
		  var d2r=Math.PI/180.0;
		  var flatten=1.0/298.247;

		  var theFactor=d2r* Math.cos(d2r * swLat) * 6378.139 * (1.0 - Math.sin(d2r * swLat) * Math.sin(d2r * swLat) * flatten);
		  var x=(neLon-swLon)*theFactor;
		  var y=(neLat-swLat)*111.32;
		  
		  azimuth=Math.atan2(x,y)/d2r;
		  azimuth=azimuth.toFixed(1);
		  if(azimuth>180) azimuth=azimuth-360;
		  if(azimuth<-180) azimuth=azimuth+360;

		  $("#azimuth-value").val(azimuth);
	 }


	 //--------------------------------------------------
	 // Sets the ending (lat,lon) from a provided initial (lat, lon), 
	 // a length, and a strike (or azimuth) angle.
	 //--------------------------------------------------
	 function setEndpointsFromAzimuthAndLength() {
		  var d2r = Math.PI / 180.0;
		  var flatten=1.0/298.247;

		  var latStart=LOS_markers[0].getPosition().lat().toFixed(5);
		  var lonStart=LOS_markers[0].getPosition().lng().toFixed(5);
		  var latEnd;//=LOS_markers[1].getPosition().lat().toFixed(5);
		  var lonEnd;//=LOS_markers[1].getPosition().lng().toFixed(5);
		  var xend,yend,sval,thetan;

		  //We'll use the convention that azimuth is -180 to 180. This is what Simplex assumes.
		  if(azimuth>180) azimuth=azimuth-360;
		  if(azimuth<-180) azimuth=azimuth+360;


		  //Now find the lat/lon values of the translated endpoint.
		  //First, find the Cartesian coordinates of the endpoint.  

		  if (azimuth == 0) {
				xend = 0; 
				yend = losLength;
		  }
		  else if (azimuth == 90) { 
				xend = losLength; yend = 0;
		  }
		  else if (azimuth == 180) { 
				xend = 0; yend = (-1.0) * losLength;
		  }
		  else if (azimuth == -90) { 
				xend = (-1.0) * losLength; yend = 0;
		  }
		  else {
				sval = 90 - azimuth;//.value;
				thetan = Math.tan(sval*d2r);
				xend = losLength/Math.sqrt(1 + thetan*thetan);
				yend = Math.sqrt(losLength*losLength - xend*xend);
				
				if (azimuth > 0 && azimuth < 90) { 
					 xend = xend*1.0; yend = yend*1.0;
				}
				else if (azimuth > 90 && azimuth < 180) { 
					 xend = xend*1.0; yend = yend* (-1.0);
				}
				else if (azimuth > -180 && azimuth < -90) { 
					 xend = xend*(-1.0); yend = yend*(-1.0);
				}
				else if (azimuth > -90 && azimuth < 0) { 
					 xend = xend*(-1.0); yend = yend*1.0;
				}
				else {
					 console.log("Incorrect quadrant determination");
				}
		  }
		  
		  //Note we use the lat, lon of the fault's starting point here, not the origin's lat, lon, because
		  //we are using the fault length (not the distance to the origin from the end point).
		  var theFactor=d2r* Math.cos(d2r * latStart) * 6378.139 * (1.0 - Math.sin(d2r * latStart) * Math.sin(d2r * latStart) * flatten);

		  lonEnd = 1.0*xend/(1.0*theFactor) + lonStart*1.0;
		  lonEnd=lonEnd.toFixed(5);
		  latEnd = 1.0*yend/111.32 + latStart*1.0;
		  latEnd=latEnd.toFixed(5);
		  
		  $("#endLat-value").val(latEnd);
		  $("#endLon-value").val(lonEnd);

		  var newPos=new google.maps.LatLng(latEnd,lonEnd);
		  LOS_markers[1].setPosition(newPos);
		  google.maps.event.trigger(LOS_markers[1],"drag");
		  google.maps.event.trigger(LOS_markers[1],"dragend");
	 }	 

//--------------------------------------------------
// This function calculates the distance between the starting 
// and ending (lat,lon) points.  
//--------------------------------------------------
function setDistance() {
    var latStart=LOS_markers[0].getPosition().lat().toFixed(5);
    var lonStart=LOS_markers[0].getPosition().lng().toFixed(5);
    var latEnd=LOS_markers[1].getPosition().lat().toFixed(5);
    var lonEnd=LOS_markers[1].getPosition().lng().toFixed(5);
    
    var d2r = Math.PI / 180.0;
    var flatten=1.0/298.247;
    var theFactor=d2r* Math.cos(d2r * latStart) * 6378.139 * (1.0 - Math.sin(d2r * latStart) * Math.sin(d2r * latStart) * flatten);
    
    var xdiff=(lonEnd-lonStart)*theFactor;
    var ydiff=(latEnd-latStart)*111.32;
    
    losLength=Math.sqrt(xdiff*xdiff+ydiff*ydiff);
    losLength=losLength.toFixed(3);		  
    
    $("#losLength-value").val(losLength);
}

//--------------------------------------------------
//Show results from calling the search REST service.
//--------------------------------------------------
function showSearchResults(tableDivName) {
    deleteAllShape();
    deleteAllKml();
    //See which data sets area available at the selected point
    var theSearchString=$("#search-string-value").val();
    var searchUrl="/uavsar_flight_search/?searchstring="+theSearchString;
    makeQueryAndDisplay(mapA,searchUrl,tableDivName);
}

function showSearchbylatlon(latlon) {
    //alert(latlon);
    deleteAllShape();
    deleteAllKml();
    var latlonstr = 'Point: (' + latlon + ')' ;
    var x = document.getElementById('UAVSAR-geometry');
    x.innerHTML = latlonstr;
    // move map to the latlon center
    var latlon_v = latlon.split(",");
    mapA.panTo(new google.maps.LatLng(parseFloat(latlon_v[0]),parseFloat(latlon_v[1])));
    uavsarquery(latlonstr);
}

//--------------------------------------------------
//This is an internal function that calls the provided REST URL, parses the resulting
//JSON, displays the resulting SAR images on the map, and creates the table of results
//on the right side of the display.
//--------------------------------------------------
function makeQueryAndDisplay(masterMap,restUrl,tableDivName){
    var stuffTest=masterMap.overlayMapTypes.clear();
    var results=$.ajax({url:restUrl,async:false}).responseText;
    console.log(results);
    availableDataSets=jQuery.parseJSON(results);
    
    //Turn on the layers in the selected region
    displaySelectedImages(availableDataSets,masterMap);
    
}

function displaySelectedImages(datasets,masterMap) {
    console.log("Display selected iamges");
    if($('.panel-close-button').hasClass('inactive') && $('#uavsar').hasClass('inactive')) {
        $('.panel-close-button').removeClass('inactive').addClass('active');
        $('#uavsar').removeClass('inactive').addClass('active');
        $('#FadeDisplay').show();
        $('#Color-mapping').show();
    }
    // else clear #uavsar
    else {
        $('#uavsar').empty();
    }
    // clear wmsgf9_samples
    wmsgf9_samples = {};
    // clear uavsar dataset overlays
    mapA.overlayMapTypes.setAt(0, null);

    for (var index1 in datasets) {
        var uid_str = "'" + datasets[index1]['uid'] + "'";
        var dataname_str = "'" +datasets[index1]['dataname'] + "'";
        var radarDirectionStr="'" +datasets[index1]['radardirection'] + "'";
        //                console.log(uid_str + " " + dataname_str);
        dynatable='<div style="word-wrap:break-word;">';
        dynatable+='<table class="uavsar-table">';  //Open table
        dynatable+='<tr class="uavsar-tr">'; //Create row in embedded table
        dynatable+='<th colspan="2" class="uavsar-th">'+datasets[index1]['dataname']+'</th>'; //Add header to table row
        dynatable+='</tr>'; //Close embedded table's header row
        dynatable+='<tr">'; //Start second embedded table row
        dynatable+='<td>'+datasets[index1]['time1'] +'</td><td>'+datasets[index1]['time2']+'</td>'; //Display time1 and time2 in embedded table's second row
        dynatable+='</tr>'; //Close embedded table's second row
        dynatable+='</table>'; //Close the embedded table
        dynatable+='</div>'
        stardiv='<div>'+displayRating(datasets[index1]['uid'],datasets[index1]['rating']);
        stardiv+="&nbsp;".repeat(3)+'<button type="button" class="btn btn-default btn-xs"'+'onclick=rateUAVSAR('+datasets[index1]['uid']+',"'+datasets[index1]['dataname']+'")>Rate it</button>'+"</div>";
        
        $('#uavsar').append('\
<div class="dataset">\
<input class="dataset-checkbox" id="sarDisplayOrNot_'+datasets[index1]['uid']+'" type="checkbox" name="dataset" value="' + datasets[index1]['uid']+' " + onClick="sarCheckboxAction('+datasets[index1]['uid']+')" checked/>\
<!--<a href="#" onClick="selectDataset(this,' + datasets[index1]['uid'] + ', ' + dataname_str + ','+datasets[index1]['heading']+','+radarDirectionStr+');">-->\
<div onClick="selectDataset(this,' + datasets[index1]['uid'] + ', ' + dataname_str + ','+datasets[index1]['heading']+','+radarDirectionStr+');">' + dynatable + '</div>\
</div>'+stardiv);
        viewDataset(datasets[index1]['uid'], datasets[index1]['dataname'], true);
    };
    updateVisibleDatasets();

};


function reset_color_api(){
    var imagename = $('#currentimage').val();
    //uid43_unw
    //remove
    wmsgf9_select_legend_kml.setMap(null);
    mapA.overlayMapTypes.setAt(0, null);
    //reload
     highresoverlay = loadWMS(mapA, "http://149.165.168.89/geoserver/InSAR/wms?","InSAR:"+imagename);
    // load legend
    var legend_kml = "http://149.165.168.89/uavsarlegend1/"+imagename+"_default.kmz";
        wmsgf9_select_legend_kml =  new google.maps.KmlLayer({
        url: legend_kml,
        preserveViewport:true,
        screenOverlays:true
        });
    wmsgf9_select_legend_kml.setMap(mapA);
        // get uid from datajson['image'] = uid254_unw
    //record datajson
    var res = imagename.split("_");
    var uid =res[0].replace('uid','');
    wmsgf9_samples[uid][4]=0;
};

function new_color_api(){
    var imagename = $('#currentimage').val();
    var mind = Number($('#mind').val());
    var maxd = Number($('#maxd').val());
    mind = mind / -1.897155;
    maxd = maxd / -1.897155;
    var minv = Math.min(mind,maxd);
    var maxv = Math.max(mind,maxd);
    var usercolortheme = $('#colortheme_sel').val();
    var results=$.ajax({url:'sldservice',data:{'service':'sldgenerator','image':imagename,'min':minv,'max':maxv,'theme':usercolortheme},async:false}).responseText;
    //alert(results);
    var datajson=jQuery.parseJSON(results);
    //alert(results);

    //reload legend
    wmsgf9_select_legend_kml.setMap(null);
    wmsgf9_select_legend_kml =  new google.maps.KmlLayer({
                    url: datajson['kmz']+"?dummy="+(new Date()).getTime(),
                    preserveViewport:true,
                    screenOverlays:true
                    });
    wmsgf9_select_legend_kml.setMap(mapA);

    //remove current wms
    mapA.overlayMapTypes.setAt(0, null);
    //reload wms
    highresoverlay=loadWMSwithstyle(mapA, "http://149.165.168.89/geoserver/InSAR/wms?","InSAR:"+datajson['image'],datajson['style']);

    // get uid from datajson['image'] = uid254_unw
    //record datajson
    var res = datajson['image'].split("_");
    var uid =res[0].replace('uid','');
    wmsgf9_samples[uid][4]=datajson;
};

// color_stretch fAunction
function color_stretch(event) {
    //alert(event"+data['image']
    var imagename = "uid" + event.data.uid + "_unw";
    var mapextent = mapA.getBounds().toString();
    var results=$.ajax({url:'sldservice',data:{'service':'getminmax','image':imagename,'extent': mapextent},async:false}).responseText;
    //alert(results);
    var datajson;
    try {
       datajson=jQuery.parseJSON(results); 
    } catch(ex) {
      return null;
    };

    //alert(datajson;)

    $('#Strech-color-div').html('');

    $('#Strech-color-div').append("<p><strong>" + "Image Displacement (cm)" + datajson['image_mind'] + " to " +datajson['image_maxd']);
    $('#Strech-color-div').append("<p><strong>" + "Area Displacement (cm)" + datajson['mind'] + " to " +datajson['maxd']);
    $('#Strech-color-div').append('<div id="minmax_slider" </div><p>');   
    var inputstr="<input type='text' id='mind' name='mind'>";
    inputstr +="<input type='text' id='maxd' name='maxd'>";
    $('#Strech-color-div').append(inputstr);
    $('#mind').val(datajson['mind']);
    $('#maxd').val(datajson['maxd']);
    var colorthemestr = "<p><strong>Color theme:<strong><select id='colortheme_sel'><option value='default'>Default</option><option value='RdYlGn_r'>RedYellowGreen</option></option></select>";
    $('#Strech-color-div').append(colorthemestr);
    $('#Strech-color-div').append("<input type=hidden id=currentimage value="+datajson['image']+">");
    $('#Strech-color-div').append("&nbsp;"+"<button id=make-new-color-button onclick=new_color_api()>Make New Color</button>");
    $('#Strech-color-div').append("&nbsp;"+"<button id=reset-color-button onclick=reset_color_api()>Reset</button></strong>");    
    $('#Strech-color-div').append("<hr>");
    var sliderscript ='<script type="text/javascript">'+
    '$( "#minmax_slider" ).slider({' +
      'range: true,'+
      'min:'+datajson["image_mind"] +','+
      'max:'+datajson["image_maxd"] +','+
      'values:['+datajson["mind"]+','+datajson["maxd"]+'],'+
       'slide: function( event, ui ) {'+
       '$("#mind").val(ui.values[0]);$("#maxd").val(ui.values[1]);},'+
    '});</script>';
    $('#Strech-color-div').append(sliderscript);


    //$("#make-new-color-butoon").on( "click", {image: datajson['image']}, new_color_api);

};


// viewDataset loads a dataset into wmsgf9_samples
// called when a specific query for a specific geometry is made
// can also be used to hide specific datasets
// if being used for a pre existing element in wmsgf9_samples, this function
// does not require the dataname argument so it can be left as a empty string
    // NOTE!!!!!
    // wmsgf9_samples stores each kml layer in a list of:
    // [kml layer, setToState, currentState, wmslayer]
    // setToState can be changed if the visibility state of the layer is to
    // be changed
    // currentState will automatically update when the visible layers are updated
    // add onemore state: wmslayer, -1 no wms layer, 0 not checked, 1 has wms layer
    // onemore state: has_user_colored_theme, 0 "default", 1 "has userenabled"
function viewDataset(uid, dataname, show) {

    if(show) {
        if(uid in wmsgf9_samples) {

            wmsgf9_samples[uid][1] = true;
        }
        else {
            var querystr = uid + '/' + dataname;
//            console.log( 'http://gf2.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kmz');
            var wmsgf9_temp = new google.maps.KmlLayer({
//                url: 'http://gf2.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kmz',
                url: 'http://gf2.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kml',
                suppressInfoWindows: true,
                preserveViewport: true,
                clickable: false
            });
            // wms layer is not checked 
            wmsgf9_samples[uid] = [wmsgf9_temp, true, false, 0, 0];
        }
    }
    // it is assumed that type = hide is only called for wmsgf9s already visible
    else{
//        console.log(uid,wmsgf9_samples);
        wmsgf9_samples[uid][1] = false;
    }
}

// use no cross-domain query at this time
// script for calling UAVSAR layer tiles
// accomplished by sending link to backend so that the query can be sent from
// python which bypasses the issue of cross-domain queries
function uavsarquery(querystr) {
    //console.log("uavsarquery() called with querystr "+querystr);
    $(".panel-close-button").click(function() {
	//        closeDataPanel();
	resetToBaseUAVSARDisplay();
        deleteAllShape();
    });
    var eventDateString = $.trim($("#event_date").val());
    console.log(eventDateString);
    if (eventDateString != ""){
	// alert(eventDateString);
	querystr+="&eventtime=" + eventDateString };
    
    $.get("/uavsar_query/", {'querystr': querystr})
        .done(function(datasetsStr) {
	    datasetsStr;
        //console.log("Query:"+querystr);
	    //console.log("Data:"+datasetsStr);
        uavsarDataSet=jQuery.parseJSON(datasetsStr);
        displaySelectedImages(uavsarDataSet);
	});
}

function updateVisibleDatasets() {
    for(var uid in wmsgf9_samples) {
        if(wmsgf9_samples.hasOwnProperty(uid))
        {
            if(wmsgf9_samples[uid][1] && !wmsgf9_samples[uid][2])
            {
                wmsgf9_samples[uid][0].setMap(mapA);
                wmsgf9_samples[uid][2] = true;
            }
            else if(!wmsgf9_samples[uid][1] && wmsgf9_samples[uid][2])
            {
                wmsgf9_samples[uid][0].setMap(null);
                wmsgf9_samples[uid][2] = false;
            }
        }
    }
}

function sarCheckboxAction(uid) {
    if(wmsgf9_samples[uid][1]==false) {
        wmsgf9_samples[uid][1]=true;
        wmsgf9_samples[uid][2]=false;
    }
    else {
        wmsgf9_samples[uid][1]=false;
        wmsgf9_samples[uid][2]=true;
    }
    updateVisibleDatasets();
}


// script for closing the entire UAVSAR data panel
// when the data panel is closed, all content in the data panel is removed
function closeDataPanel() {
    $('.panel-close-button').removeClass('active').addClass('inactive');
    $('#uavsar').empty();
    $('#uavsar').removeClass('active').addClass('inactive');
    $('#UAVSAR-geometry').empty();
    $('#UAVSAR-heading').empty();
    $('#UAVSAR-markers').empty();
    $('#UAVSAR-formFields').hide();
    $('#FadeDisplay').hide();
    $('#Color-mapping').hide();
    $('#UAVSAR-active-tool').prop("checked",false);
    $('#color-mapping-checkbox').prop("checked",false);    
    $('#uavsar-instructions').hide();
    $('#QuakeTables-Link').hide();
    $('#search-string-value').val("");
    $('#search-latlon-value').val("");
    deleteAllKml();
    clear_UAVSAR();
}

//Resets the map to the base display of all UAVSAR images so user can start over.
function resetToBaseUAVSARDisplay() {
    $('.panel-close-button').removeClass('active').addClass('inactive');
    $('#uavsar').empty();
    $('#uavsar').removeClass('active').addClass('inactive');    
    $('#UAVSAR-geometry').empty();
    $('#UAVSAR-heading').empty();
    $('#UAVSAR-markers').empty();
    $('#UAVSAR-formFields').hide();
    $('#FadeDisplay').hide();
    $('#Color-mapping').hide();
//    $('#UAVSAR-active-tool').prop("checked",false);
    $('#color-mapping-checkbox').prop("checked",false);    
//    $('#uavsar-instructions').hide();
    $('#QuakeTables-Link').hide();
    $('#search-string-value').val("");
    $('#search-latlon-value').val("");
    clear_UAVSAR();
    deleteAllKml();
    draw_UAVSAR();
}

// script for displaying UAVSAR layer
// this script does not load the UAVSAR layer. loading in done in separate script
function draw_UAVSAR() {
    wmsgf9_select={};
//    if(wmsgf9_select != null) {
//        wmsgf9_select.setMap(null);
//    };
    $('#UAVSAR-geometry').empty();
    UAVSARDrawingManager.setMap(mapA);
    loadWMS(mapA, "http://gf8.ucs.indiana.edu/geoserver/InSAR/wms?","InSAR:thumbnailmosaic");
    //mapA.overlayMapTypes.setAt(0, wmsgf9);
}

// script for removing UAVSAR layer
// this includes all geometry markings used to retrieve list of datasets
function clear_UAVSAR() {
    UAVSARDrawingManager.setMap(null);
    mapA.overlayMapTypes.setAt(0, null);
    if(LOS_markers.length != 0)
    {
        LOS_markers[0].setMap(null);
        LOS_markers[1].setMap(null);
        LOS_markers.length = 0;
        LOS_line.setMap(null);
        LOS_line = null;
    }
    if($('.extra-tools-panel').hasClass('active'))
    {
        $('.extra-tools-panel').removeClass('active').addClass('inactive');
    }
    deleteAllShape();
}

function updateToolPanelMarkerInfo() {
    var x=document.getElementById('UAVSAR-markers');
    x.innerHTML="<br/>";
    x.innerHTML+="<img src="+LOS_markers[0].getIcon()+">"+"&nbsp <b>Lat, Lon:</b>"+LOS_markers[0].getPosition().lat().toFixed(5)+","+LOS_markers[0].getPosition().lng().toFixed(5);
    x.innerHTML+="<br/>"
    x.innerHTML+="<img src="+LOS_markers[1].getIcon()+">"+"&nbsp <b>Lat, Lon:</b>"+LOS_markers[1].getPosition().lat().toFixed(5)+","+LOS_markers[1].getPosition().lng().toFixed(5);
}

function updateMarkerFormFields() {
//    var x=document.getElementById('UAVSAR-formFields');
//    x.show();
    $("#UAVSAR-formFields").show();
    $("#startLat-value").val(LOS_markers[0].getPosition().lat().toFixed(5));
	 $("#startLon-value").val(LOS_markers[0].getPosition().lng().toFixed(5));
	 $("#endLat-value").val(LOS_markers[1].getPosition().lat().toFixed(5));
	 $("#endLon-value").val(LOS_markers[1].getPosition().lng().toFixed(5));
    setAzimuth();
    setDistance();
}

function drawDygraphAjax(image_uid) {
//    console.log("drawDygraphAjax called");
    //alert(LOS_dataname);
    if($('.extra-tools-panel').hasClass('inactive'))
    {
        $('.extra-tools-panel').removeClass('inactive').addClass('active');
        $('.extra-tools-panel').animate({height: "200px"}, 50);
	//	$('.extra-tools-panel').draggable();
	$('.extra-tools-panel').draggable({handle:"div.extra-tool-border"});
    }
    var lat1 = LOS_markers[0].getPosition().lat();
    var lng1 = LOS_markers[0].getPosition().lng();
    var lat2 = LOS_markers[1].getPosition().lat();
    var lng2 = LOS_markers[1].getPosition().lng();
    var format = 'csv';
    var resolution = $('#resolution-value').val();
    var method = 'native';
    var average = '10';
    var azimuth = $("#azimuth-value").val();
    var losLength=$("#losLength-value").val();
    
    //var altpool=['10','26','43','258','693','953','954','1152','1382','1434','1442','1446','1447','1448','1449','1450','1452',
    //            '1453','1454','1455','1456','1457','1458','1459','1460','1461','1462','1502','1510','1511','1512'];
    var altlosflag = 1;
    //if (altpool.indexOf(image_uid.toString()) > -1) {altlosflag = 1;};
    
    var downloadUrl="/los_query?image_uid="+image_uid+"&image_name="+LOS_dataname+"&lat1="+lat1+"&lng1="+lng1+"&lat2="+lat2+"&lng2="+lng2+"&format="+format+"&resolution="+resolution+"&method="+method+"&average="+average+"&azimuth="+azimuth+"&losLength="+losLength;
    downloadUrl += "&altlosflag=" + altlosflag;
    $("#LOS-Data-Download").html("<a href='"+downloadUrl+"' target='_blank'><b>Download LOS Data</b></a>");

     $.ajax({        
        url:"/los_query",
        beforeSend:function() {if(dygraph1 !== null && dygraph1 !== undefined) {dygraph1.destroy(); };
										 $('#dygraph-LOS').html('<center><img src="http://quakesim-iu.appspot.com/InSAR-LOS/images/processing.gif"/></center>');
                              },
        data: {
            'image_uid': image_uid,
            'lat1': lat1,
            'lng1': lng1,
            'lat2': lat2,
            'lng2': lng2,
            'format': format,
            'resolution': resolution,
            'method': method,
            'average': average,
            'altlosflag':altlosflag
        },
        async: true
    })
        .done(function(csv) {
            var csv2=csv.split("\n");
            var csv_final="";
            for(var i=0;i<csv2.length;i++) {
                csv3=csv2[i].split(",");
                //                console.log(csv2[i],csv3)
                if(csv3[2] && csv3[3]) {
                    csv_final+=csv3[2]+","+csv3[3]+"\n";
                }
                //                console.log(csv_final);
            }
            
            dygraph1= new Dygraph(
                document.getElementById("dygraph-LOS"),
                csv_final,{drawPoints:true,
			   pointSize:2,
			   strokeWidth:0.0,
			   title:'Ground Range Change',
                           titleHeight:20, 
                           xLabelHeight:16,
                           yLabelWidth:16,
                           xlabel:'Distance (km)',
                           ylabel:'Ground Range Change (cm)'
			  }
            );
        });
    
}

function updateDygraphXValueRange(){
    //dygraph1.updateOptions({valueRange:[-10,10]"});
    var minX=$("#groundRangeChangeXMin").val();
    var maxX=$("#groundRangeChangeXMax").val();
    if(minX == "") {
	minX=dygraph1.xAxisExtremes()[0];
    }
    if(maxX == "") {
	maxX=dygraph1.xAxisExtremes()[1];
    }
    dygraph1.updateOptions({dateWindow:[minX,maxX]});
}

function updateDygraphYValueRange(){
    //dygraph1.updateOptions({valueRange:[-10,10]"});
    var minY=$("#groundRangeChangeYMin").val();
    var maxY=$("#groundRangeChangeYMax").val();
    dygraph1.updateOptions({valueRange:[minY,maxY]});
    if(minY == "") {
	minY=dygraph1.YAxisExtremes()[0];
    }
    if(maxY == "") {
	maxY=dygraph1.YAxisExtremes()[1];
    }    
}


//These are some methods that can be used by the interactionModel.
//But they don't play well with jquery's draggable.
//See view-source:http://dygraphs.com/tests/interaction.html and http://dygraphs.com/tests/interaction.js
function downV3(event, g, context) {
  context.initializeMouseDown(event, g, context);
    if (event.altKey || event.shiftKey) {
	Dygraph.startZoom(event, g, context);
    }
}

function moveV3(event, g, context) {
    Dygraph.moveZoom(event, g, context);
}

function upV3(event, g, context) {
    if (context.isZooming) {
	Dygraph.endZoom(event, g, context);
    }
    Dygraph.cancelEvent(event);
}


////////////////////////////////// FAULT LAYER ////////////////////////////////

// START KML FAULT LAYER
// simple call for the kml data
function setup_FAULT_LAYER() {
    ctaLayer = new google.maps.KmlLayer({
        //url: 'http://gf2.ucs.indiana.edu/ucerf3_black.kml',
	url: 'https://github.com/GeoGateway/GeoGatewayStaticResources/raw/master/kmz/ucerf3_black.kml',
        preserveViewport:true
    });
}

// script for displaying FAULT LAYER
function draw_FAULT_LAYER() {
    ctaLayer.setMap(mapA);
}

// script for removing FAULT LAYER
function clear_FAULT_LAYER() {
    ctaLayer.setMap(null);
}

///////////////////////////// MOMENT MAGNITUDE CALCULATOR /////////////////////

// script for showing/hiding the MOMENT MAGNITUDE CALCULATOR
function show_MMCalc() {
    $('#moment-magnitude-calc').removeClass('inactive').addClass('active');
}
function hide_MMCalc() {
    $('#moment-magnitude-calc').removeClass('active').addClass('inactive');
}

// script for actually calculating MOMENT MAGNITUDE and SEISMIC MAGNITUDE
function update_MM_SM() {
    var length = parseFloat($(".moment-magnitude-calc-input#length").val());
    var width = parseFloat($(".moment-magnitude-calc-input#width").val());
    var slip = parseFloat($(".moment-magnitude-calc-input#slip").val());
    var shear_modulus = parseFloat($(".moment-magnitude-calc-input#shear-modulus").val());
    var seismic_magnitude = length * width * slip * shear_modulus * 1e23;
    var moment_magnitude = 2 / 3 * Math.log(seismic_magnitude) / Math.log(10) - 10.7;
    $('.moment-magnitude-calc-result#seismic').text(seismic_magnitude.toPrecision(2));
    $('.moment-magnitude-calc-result#moment').text(moment_magnitude.toFixed(1));
}
$(document).ready(function() {
    $(".moment-magnitude-calc-btn").click(function() {
        update_MM_SM();
    });
});

/////////////////////////////////////// OTHER /////////////////////////////////

// initialize
function initialize() {
    //geocoder = new google.maps.Geocoder();
    //Set the center of the map
    var connecticut = new google.maps.LatLng(37.5,-116.0);

    var mapA_setup = {
        zoom: 6,
        mapTypeIds: [
            google.maps.MapTypeId.TERRAIN,
            google.maps.MapTypeId.HYBRID,
            google.maps.MapTypeId.ROADMAP
        ],
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        MapTypeControl: true,
        scaleControl:true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DEFAULT, 
                                position:google.maps.ControlPosition.TOP_RIGHT},
//        navigationControl: true,
//        navigationControlOptions: {style: google.maps.NavigationControlStyle.ZOOM_PAN},
        panControlOptions: {position: google.maps.ControlPosition.LEFT_TOP},
        zoomControlOptions: {position: google.maps.ControlPosition.LEFT_TOP},
        backgroundColor: 'White',
        scrollwheel: false,
        maxZoom: 17,
        scaleControl: true,
        center: connecticut
    }

    mapA = new google.maps.Map(document.getElementById("map-canvas"), mapA_setup);

    // load geogateway logo
    var logokml =  new google.maps.KmlLayer({
        //url: "http://gf2.ucs.indiana.edu/kmz/geogateway.kmz",
	url: "https://github.com/GeoGateway/GeoGatewayStaticResources/raw/master/kmz/geogateway.kmz",
        preserveViewport:true,
        screenOverlays:true
    });
    logokml.setMap(mapA);    

    setup_UAVSAR();
    setup_FAULT_LAYER();
}
google.maps.event.addDomListener(window, "load", initialize);

// setup checkbox map overlay toggles
$(document).ready(function() {
    $(".tools-checkbox").click(function() {
        var checked = this.checked;
        var type = $(this).val();
        switch(type) {
            // UAVSAR
        case 'uavsar':
            if(checked) {
                draw_UAVSAR();
                $('#uavsar-instructions').show();
            }
            else {
                closeDataPanel();
                wmsgf9_select={};
                //clear_UAVSAR();
                //                    if(typeof wmsgf9_select != 'undefined') {
                //                        wmsgf9_select.setMap(null);
                //                    }
                $('#UAVSAR-geometry').empty();
            }
            break;
            // MOMENT MAGNITUDE CALCULATOR
        case 'moment_magnitude_calc':
            if (checked) {
                show_MMCalc();
            }
            else {
                hide_MMCalc();
            }
            break;
            // FAULT LAYER
        case 'fault-layer':
            if(checked) {
                draw_FAULT_LAYER();
            }
            else {
                clear_FAULT_LAYER();
            }
            break;
        case 'kml-layer':
            if(checked) {
                $('#KmlMapperDiv').show();
            }
            else {
                $('#KmlMapperDiv').empty();
            }
            break;
        }
    });
    
});


//--------------------------------------------------
// This function fades and restores the SAR image
//--------------------------------------------------
function fadeInsarImage() {
    console.log("Fader button selected");
    //updated the source to usercontent
    //$("#map-canvas").find("img[src*='mapsatt']").fadeTo("fast","0.50");
    $("#map-canvas").find("img[src*='usercontent']").fadeTo("fast","0.50");
    if(typeof highresoverlay !== 'undefined') {
        highresoverlay.setOpacity(0.5);
    }
}
  
function resetInsarImage() {
    console.log("Reset button selected.");
    //$("map-canvas").find("img[src*='mapsatt']").fadeTo("fast","1.0");           
    $("#map-canvas").find("img[src*='usercontent']").fadeTo("fast","1.0");
    if(typeof highresoverlay !== 'undefined') {
        highresoverlay.setOpacity(1.0);
    }
}


//--------------------------------------------------
// These are miscellaneous functions for loading KMLs on the map tools page.
//--------------------------------------------------
function showStateBoundaries() {
    if(document.getElementById("maptools.stateBoundaries").checked==true) {
            stateKml=new google.maps.KmlLayer({
                //url:"http://eric.clst.org/wupl/Stuff/gz_2010_us_040_00_500k.kml",
//                url:"http://eric.clst.org/wupl/Stuff/gz_2010_us_040_00_5m.kml",
                //url: "http://gf2.ucs.indiana.edu/stage/gz_2010_us_040_00_20m.kml",
		url: "https://github.com/GeoGateway/GeoGatewayStaticResources/raw/master/kmz/gz_2010_us_040_00_20m.kml",
                preserveViewport:true,
                map:mapA
            });
    }
    else {
        stateKml.setMap(null);
    }
}

function showCoastlines() {
    if(document.getElementById("maptools.coastlines").checked==true) {
        coastlineKml=new google.maps.KmlLayer({
	    url:"https://github.com/GeoGateway/GeoGatewayStaticResources/raw/master/kmz/ne_50m_coastline.kml",
            //url:"http://gf2.ucs.indiana.edu/stage/ne_50m_coastline.kml",
//            url:"http://eric.clst.org/wupl/Stuff/gz_2010_us_outline_20m.kml",
            preserveViewport:true,
            map: mapA
        });
    }
    else {
        coastlineKml.setMap(null);
    }
}

function showUserLocation(){
    if(document.getElementById("userPositionMarker").checked==true) {
        navigator.geolocation.getCurrentPosition(showPosition);
    }
    else {
        removeUserPositionMarker();
    }
};

function showPosition(myPosition) {
    var myLatLng={lat: myPosition.coords.latitude, lng: myPosition.coords.longitude};
    console.log(myLatLng);
    userPositionMarker=new google.maps.Marker({
        position:myLatLng,
        map:mapA
    });
};

function removeUserPositionMarker() {
    console.log("Remove marker");
    userPositionMarker.setMap(null);
}

function showUCERF3FaultLayer(faultcolor) {
    if(document.getElementById("maptools.UCERF3FaultLayer").checked==true) {
        document.getElementById("div_ucerf3color").style.display="block"; 
        ctaLayer.setMap(null);
        ctaLayer = new google.maps.KmlLayer({
            url: 'https://github.com/GeoGateway/GeoGatewayStaticResources/raw/master/kmz/ucerf3_'+faultcolor+'.kml?v='+ (Math.floor(Math.random() * 9999)).toString(),
            preserveViewport:true,
            map:mapA
        });
    }
    else {
        ctaLayer.setMap(null);
        document.getElementById("div_ucerf3color").style.display="none"; 

    }
    
}

// hide and show plot panel
function hidePlotPanel() {
    if($('.extra-tools-panel').hasClass('active')) {
        $('.extra-tools-panel').removeClass('active').addClass('inactive');
    } else {
        $('.extra-tools-panel').removeClass('inactive').addClass('active');
    };
}

// close profile tools
function closeProfileTool() {
    // hide plotpanel first
    if($('.extra-tools-panel').hasClass('active')) {
        $('.extra-tools-panel').removeClass('active').addClass('inactive');};
    //close plot info div
    $('#UAVSAR-formFields').hide();
    $('#UAVSAR-markers').empty();
    //remove markers and lines
    if(LOS_markers.length != 0)
    {
        LOS_markers[0].setMap(null);
        LOS_markers[1].setMap(null);
        LOS_markers.length = 0;
        LOS_line.setMap(null);
        LOS_line = null;
    }
    // remove listener event
    google.maps.event.clearListeners(mapA, 'click');
}


function displayRating(uid,rating) {
    //3 Green
    //2 Yellow
    //1 Red
    //0 empty

    var value = parseInt(rating);
    var fullstar='<span class="glyphicon glyphicon-star" style="color:white"></span>';
    var emptystar='<span class="glyphicon glyphicon-star-empty" style="color:white"></span>';
    var stars;
    if (value>0) {stars="rating: "} else {stars="no rating "};
    if (value>3) {value=3;};
    //var fullstar=fullstar_t.replace("rightcolor",["red","yellow","green"][value-1]);
    stars+='<span class="label label-'+["default","danger","warning","success"][value]+'"'+'onclick=displayComments('+uid+')>';
    stars+=fullstar.repeat(value)+emptystar.repeat(3-value);
    stars+='</span>';
    return stars;
}

function displayComments(uid) {
    $.ajax({
        url:'uavsarrating',
        data:{'service':'getcomments','uid':uid,}
    }).done(function(result) 
    {if (result=='{}'){alert('no comments found');} else {
        //reformat comments
        var comments_str = "<ul>";
        var history = jQuery.parseJSON(result);
        for (var key in history) {
            if (history.hasOwnProperty(key)) {
                comments_str += "<li><b>rating " + history[key].rating + " </b>:" +history[key].comments+"</li>";
                };
        }; 
        comments_str += "</ul>";       
    //alert(dataname);
    html =  '<div id="dynamicModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="confirm-modal" aria-hidden="true">';
    html += '<div class="modal-dialog">';
    html += '<div class="modal-content">';
    html += '<div class="modal-header">';
    html += '<a class="close" data-dismiss="modal">×</a>';
    html += '<h4>'+'Comments'+'</h4>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += comments_str;
    html += '<span class="btn btn-primary" data-dismiss="modal">Close</span>';
    html += '</div>';  // content
    html += '</div>';  // dialog
    html += '</div>';  // footer
    html += '</div>';  // modalWindow
    $('body').append(html);
    $("#dynamicModal").modal();
    $("#dynamicModal").modal('show');
    $('#dynamicModal').on('hidden.bs.modal', function (e) {
        $(this).remove();
    });

    };}
    );

}

//rateUAVSAR
//3: GREEN: Good: Excellent product with few or no known flaws
//2: YELLOW: Caution Good over small local areas, long wavelength error over larger area
//1: RED: Bad: Severe problems. Recommend not using
function rateUAVSAR(uid,dataname) {

    //alert(angular.element('#LoginController').scope().authenticated);
    
    if (! angular.element('#LoginController').scope().authenticated)
        {alert('Please log in to rate UAVSAR data.');
        return;};

    //alert(dataname);
    html =  '<div id="dynamicModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="confirm-modal" aria-hidden="true">';
    html += '<div class="modal-dialog">';
    html += '<div class="modal-content">';
    html += '<div class="modal-header">';
    html += '<a class="close" data-dismiss="modal">×</a>';
    html += '<h4>'+dataname+'</h4>';
    html += '</div>';
    html += '<div class="modal-body"><label for="comment">Rating:</label>';
    html +='<select id="selectrating" name="selectrating" class="form-control">';
    html +='<option value="3">3 Stars: Excellent product with few or no known flaws</option>';
    html +='<option value="2">2 Stars: Good over small local areas, long wavelength error over larger area</option>';
    html +='<option value="1">1 Star: Severe problems. Recommend not using</option></select>';
    html +='<br>';
    html +='<label for="comment">Comment:</label><textarea class="form-control" id="rating_comment" name="rating_comment"></textarea>';
    html += '<div class="checkbox"><label><input id="rating_usertype" type="checkbox" value="">rate as anonymous user</label></div>';
    html += '</div>';
    html += '<div class="modal-footer">';
    html+='<input type="submit" class="btn btn-primary" value="Submit" onClick=submitUserRating("'+uid+'",'+'"'+dataname+'")>';
    html += '<span class="btn btn-primary" data-dismiss="modal">Close</span>';
    html += '</div>';  // content
    html += '</div>';  // dialog
    html += '</div>';  // footer
    html += '</div>';  // modalWindow
    $('body').append(html);
    $("#dynamicModal").modal();
    $("#dynamicModal").modal('show');

    $('#dynamicModal').on('hidden.bs.modal', function (e) {
        $(this).remove();
    });

}

function submitUserRating(uid,dataname) {
    var rating = $('#selectrating').val();
    var comments = $('#rating_comment').val();
    // get real user name:
    var username;
    if (document.getElementById("logged-in-user")) {
        username = document.getElementById("logged-in-user").innerHTML;
        // in case username is empty
        if (username == null || username === '') {username = "geogatewayUser";};
    } else {username = "anonymous";};
    if ($('#rating_usertype').prop('checked')) {
        username = 'anonymous';};
    //alert(username+rating);
    $.ajax({
        url:'uavsarrating',
        data:{'service':'setrating','dataname':dataname,'uid':uid,
        'rating':rating,'user':username,'comments':comments}
    }).done(function(result) 
    {alert("Your rating will be published soon, thanks!");}
    );
    $("#dynamicModal").modal("hide");
}
