// reference: sarselect2.js from Malron's code
// http://gf4.ucs.indiana.edu/InSAR-LOS/SAR-LOS-Main2.faces
//setting up Google Maps and all overlays
var mapA;
var wmsgf9;
var wmsgf9_select;
var wmsgf9_samples = {};
var UAVSARDrawingManager;
var ctaLayer;
var all_overlays = [];
var drawing_listener;
var dygraph1;

/////////////////////////////////////// UAVSAR ////////////////////////////////

// deletes all geometry markings made for UAVSAR
function deleteAllShape() {
//    console.log("Calling deleteAllShape");
    for (var i=0; i < all_overlays.length; i++)
    {
        all_overlays[i].overlay.setMap(null);
    }
    all_overlays = [];
}

// delete all UAVSAR kml layers
function deleteAllKml() {
    if (wmsgf9_samples != null) {
        for (i in wmsgf9_samples) {
//            console.log(wmsgf9_samples[i]);
            wmsgf9_samples[i][0].setMap(null);
        }
//        wmsgf9_samples.length = 0;
        wmsgf9_samples={};
    }
}

// START UAVSAR
function setup_UAVSAR() {
    var wmsOptions3 = {
        alt: "GeoServer",
        getTileUrl: WMSGetTileUrl2,
        isPng: true,
        maxZoom: 17,
        name: "Geoserver",
        tileSize: new google.maps.Size(256, 256),
        opacity:0.6,
        credit: 'Image Credit: QuakeSim'
    };

    //Creating the object to create the ImageMapType that will call the WMS Layer Options. 
    //setOpacity method
    wmsgf9 = new google.maps.ImageMapType(wmsOptions3);

    //Controling the Layers that appear in Map A.  You can set certain maps to appear in Map A or in Map B.  In this example they appear in both maps.
    mapA.setOptions({
        mapTypeControlOptions: {
            mapTypeIds: [
                google.maps.MapTypeId.HYBRID,
                google.maps.MapTypeId.ROADMAP,
                google.maps.MapTypeId.TERRAIN
            ],
            style:  google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER
        },
        disableDefaultUI: false
    });

    mapA.setMapTypeId(google.maps.MapTypeId.TERRAIN);

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
        if (e.type == "marker")
            {x.innerHTML = "Point: " + e.overlay.getPosition()};
        if (e.type == "polyline")
            {x.innerHTML = "Line: " + e.overlay.getPath().getArray();};
        if (e.type == "polygon")
            {x.innerHTML = "Polygon: " + e.overlay.getPath().getArray();};
        if (e.type == "rectangle")
            {x.innerHTML = "Rectangle: " + e.overlay.getBounds();};
    
        // call uavsar query
        //console.log(x.innerHTML);
        uavsarquery(x.innerHTML);
    });
}

//Put user-supplied KML layer on the map
function addKmlLayer(){
    var theLayer=document.getElementById("kmlUrl").value;
    console.log("Adding layer:"+theLayer);
    kmlLayer = new google.maps.KmlLayer({
        url: theLayer,
         suppressInfoWindows: false,
        map: mapA
    });
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

function selectDataset(uid, dataname, heading, radardirection) {
    var x=document.getElementById('UAVSAR-heading');
    x.innerHTML="<b>Heading:</b>"+heading+"&deg &nbsp; &nbsp;";
    x.innerHTML+="<b>Radar Direction:</b>"+radardirection;
    
    //Turn off the radio buttons
//    console.log(uid,dataname);
    for(var uid1 in wmsgf9_samples) {
		  $("#sarDisplayOrNot_"+uid1).prop('checked',false);	
		  $("#sarDisplayOrNot_"+uid1).prop('disabled',false);	
        wmsgf9_samples[uid1][1]=false;
        wmsgf9_samples[uid1][2]=true;
    }
	 $("#sarDisplayOrNot_"+uid).prop('checked',true);	 
	 $("#sarDisplayOrNot_"+uid).prop('disabled',true);
	 wmsgf9_samples[uid][1]=true;
	 wmsgf9_samples[uid][2]=false;
   
    // var querystr = uid + "/" + dataname;
    wmsgf9_select = wmsgf9_samples[uid];

//    console.log(wmsgf9_select);

    // zoom to the kmllayer
    mapA.fitBounds(wmsgf9_select[0].getDefaultViewport());  

    if(wmsgf9_select[2]) {
        viewDataset(uid, dataname, false);
    }
    viewDataset(uid, dataname, true);
    updateVisibleDatasets();
    $("input:checkbox[value="+uid+"]").prop("checked", true);

    //Turn everything off
    UAVSARDrawingManager.setMap(null);
    deleteAllShape();

    google.maps.event.addListener(wmsgf9_select[0], 'click', function(kmlEvent) {
        if(LOS_markers.length == 0)
        {
            draw_marker(kmlEvent.latLng.lat(), kmlEvent.latLng.lng(), 'blue');
            draw_marker(kmlEvent.latLng.lat(), kmlEvent.latLng.lng() + 0.1, 'red');
            connect_LOS_markers();
            updateToolPanelMarkerInfo();
            updateMarkerFormFields();
//            var x=document.getElementById('UAVSAR-markers');
//            x.innerHTML="<br/>";
//            x.innerHTML+="<img src="+LOS_markers[0].getIcon()+">"+"&nbsp <b>Lat, Lon:</b>"+LOS_markers[0].getPosition();
//            x.innerHTML+="<br/>"
//            x.innerHTML+="<img src="+LOS_markers[1].getIcon()+">"+"&nbsp <b>Lat, Lon:</b>"+LOS_markers[0].getPosition();
            drawDygraphAjax(uid);
        }
    });
    //update the plot if markers already exist when change the dataset
    if (LOS_markers.length > 0 )
        {
            drawDygraphAjax(uid);
        }
    LOS_uid = uid;
}

	 function setAzimuth(){
		  var swLat=LOS_markers[0].getPosition().lat().toFixed(5);
		  var swLon=LOS_markers[0].getPosition().lng().toFixed(5);
		  var neLat=LOS_markers[1].getPosition().lat().toFixed(5);
		  var neLon=LOS_markers[1].getPosition().lng().toFixed(5);

		  //Using http://www.movable-type.co.uk/scripts/latlong.html
		  var d2r=Math.PI/180.0;
		  var flatten=1.0/298.247;

		  //This is the old formula.
//		  var dlon=(neLon-swLon)*d2r;
//		  var y=Math.sin(dlon)*Math.cos(neLat*d2r);
//		  var x=Math.cos(swLat*d2r)*Math.sin(neLat*d2r)-Math.sin(swLat*d2r)*Math.cos(neLat*d2r)*Math.cos(dlon);
//		  azimuth=Math.atan2(y,x)/d2r;

		  var theFactor=d2r* Math.cos(d2r * swLat) * 6378.139 * (1.0 - Math.sin(d2r * swLat) * Math.sin(d2r * swLat) * flatten);
		  var x=(neLon-swLon)*theFactor;
		  var y=(neLat-swLat)*111.32;
		  
		  azimuth=Math.atan2(x,y)/d2r;
		  azimuth=azimuth.toFixed(1);
//		  if(azimuth.value>180) azimuth.value=azimuth.value-360;
//		  if(azimuth.value<-180) azimuth.value=azimuth.value+360;

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
		  //See which data sets area available at the selected point
		  var theSearchString=$("#search-string-value").val();
		  var searchUrl="/uavsar_flight_search/?searchstring="+theSearchString;
		  makeQueryAndDisplay(mapA,searchUrl,tableDivName);
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
    if($('.panel-close-button').hasClass('inactive') && $('#uavsar').hasClass('inactive'))
    {
        $('.panel-close-button').removeClass('inactive').addClass('active');
        $('#uavsar').removeClass('inactive').addClass('active');
        $('#FadeDisplay').show();
    }
    // else clear #uavsar
    else
        $('#uavsar').empty();
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
        dynatable+='<table class="sartable-inner" style="table-layout:fixed;width:100%" border="1">';  //Open table
        dynatable+='<tr>'; //Create row in embedded table
        dynatable+='<th colspan="2">'+dataname_str+'</th>'; //Add header to table row
        dynatable+='</tr>'; //Close embedded table's header row
        dynatable+='<tr>'; //Start second embedded table row
        dynatable+='<td>'+datasets[index1]['time1'] +'</td><td>'+datasets[index1]['time2']+'</td>'; //Display time1 and time2 in embedded table's second row
        dynatable+='</tr>'; //Close embedded table's second row
        dynatable+='</table>'; //Close the embedded table
        dynatable+='</div>'
        
        $('#uavsar').append('\
<div class="dataset">\
<input class="dataset-checkbox" id="sarDisplayOrNot_'+datasets[index1]['uid']+'"type="checkbox" name="dataset" value="' + datasets[index1]['uid'] + '" checked/>\
<a href="#" onClick="selectDataset(' + datasets[index1]['uid'] + ', ' + dataname_str + ','+datasets[index1]['heading']+','+radarDirectionStr+');">\
<span class="default-font">' + dynatable + '</span>\
</div>');
        viewDataset(datasets[index1]['uid'], datasets[index1]['dataname'], true);
        //                console.log("Selected Dataset:",datasets[index1]);
        //                console.log("Heading and direction:",datasets[index1]['heading'],datasets[index1]['radardirection']);
        
    };
    updateVisibleDatasets();
    $("#data-panel").on('click', '.dataset-checkbox', function() {
        var uid = $(this).val();
        if(this.checked)
        {
            //                    console.log(uid);
            viewDataset(uid, '', true);
        }
        else
        {
            // console.log('hiding');
            //                    console.log(uid);
            viewDataset(uid, '', false);
        }
        updateVisibleDatasets();
    });
}


// viewDataset loads a dataset into wmsgf9_samples
// called when a specific query for a specific geometry is made
// can also be used to hide specific datasets
// if being used for a pre existing element in wmsgf9_samples, this function
// does not require the dataname argument so it can be left as a empty string
    // NOTE!!!!!
    // wmsgf9_samples stores each kml layer in a list of:
    // [kml layer, setToState, currentState]
    // setToState can be changed if the visibility state of the layer is to
    // be changed
    // currentState will automatically update when the visible layers are
    // updated
function viewDataset(uid, dataname, show)
{
//    console.log("View Dataset: ", uid,dataname);
    if(show)
    {
        if(uid in wmsgf9_samples)
        {

        //  'image_uid': image_uid,
        //  'lat1': lat1,
        //  'lng1': lng1,
        //  'lat2': lat2,
        //  'lng2': lng2,
        //  'format': format,
        //  'resolution': resolution,
        //  'method': method,
        //  'average': average
        // })
        // .done(function(csv) {
        //  //alert(csv);
        //  var g2 = new Dygraph(
        //      document.getElementById("dygraph-LOS"),
        //      csv, { //dygraph can only use first column as xvalue 
        //            // visibility: [false, false, true], 
        //            width:590,height:140,
        //            drawPoints:true,pointSize:2,strokeWidth:0.0,title:'Ground Range Change',
        //            titleHeight:20,
        //            xLabelHeight:16,
        //            yLabelWidth:16,
        //            xlabel:'Distance (km)',
        //            ylabel:'Ground Range Change (cm)'}
        //  );
        // });

            wmsgf9_samples[uid][1] = true;
        }
        else
        {
            var querystr = uid + '/' + dataname;
//            console.log( 'http://gf1.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kmz');
            var wmsgf9_temp = new google.maps.KmlLayer({
//                url: 'http://gf1.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kmz',
                url: 'http://gf1.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kml',
                suppressInfoWindows: true,
                preserveViewport: true,
            });
            wmsgf9_samples[uid] = [wmsgf9_temp, true, false];
        }
    }
    // it is assumed that type = hide is only called for wmsgf9s already visible
    else
    {
//        console.log(uid,wmsgf9_samples);
        wmsgf9_samples[uid][1] = false;
    }
}

//The code that reads in the WMS file.  To change the WMS layer the user would update the layers line.  As this is constructed now you need to have this code for each WMS layer.
//Check with your Web Map Server to see what are the required components of the address.  You may need to add a couple of segements.  For example, the ArcServer WMS requires
//a CRS value which is tacked on to the end of the url.  For an example visit http://www.gisdoctor.com/v3/arcserver_wms.html 
function WMSGetTileUrl2(tile, zoom) {
    var projection = window.mapA.getProjection();
    var zpow = Math.pow(2, zoom);
    var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
    var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
    var ulw = projection.fromPointToLatLng(ul);
    var lrw = projection.fromPointToLatLng(lr);
    //The user will enter the address to the public WMS layer here.  The data must be in WGS84
    //var baseURL = "http://demo.cubewerx.com/demo/cubeserv/cubeserv.cgi?";
    var baseURL = "http://gf9.ucs.indiana.edu/geoserver/InSAR/wms?";
    var version = "1.3.0";
    var request = "GetMap";
    var format = "image%2Fpng"; //type of image returned  or image/jpeg
    //The layer ID.  Can be found when using the layers properties tool in ArcMap or from the WMS settings
    var layers = "InSAR:thumbnailmosaic";
    //projection to display. This is the projection of google map. Don't change unless you know what you are doing.  
    //Different from other WMS servers that the projection information is called by crs, instead of srs
    var crs = "EPSG:4326";
    //With the 1.3.0 version the coordinates are read in LatLon, as opposed to LonLat in previous versions
    var bbox = ulw.lat() + "," + ulw.lng() + "," + lrw.lat() + "," + lrw.lng();
    var service = "WMS";
    //the size of the tile, must be 256x256
    var width = "256";
    var height = "256";
    //Some WMS come with named styles.  The user can set to default.
    var styles = "";
    //Establish the baseURL.  Several elements, including &EXCEPTIONS=INIMAGE and &Service are unique to openLayers addresses.
    var url = baseURL + "Layers=" + layers + "&version=" + version + "&EXCEPTIONS=INIMAGE" + "&Service=" + service + "&request=" + request + "&Styles=" + styles + "&format=" + format + "&CRS=" + crs + "&BBOX=" + bbox + "&width=" + width + "&height=" + height;
    url = url + "&TRANSPARENT=true"
    return url;
}

// use no cross-domain query at this time
// script for calling UAVSAR layer tiles
// accomplished by sending link to backend so that the query can be sent from
// python which bypasses the issue of cross-domain queries
function uavsarquery(querystr) {
    //console.log("uavsarquery() called with querystr "+querystr);
    $(".panel-close-button").click(function() {
        closeDataPanel();
//        $("#UAVSAR-geometry").empty();
//        $("#UAVSAR-heading").empty();
//        $("#UAVSAR-markers").empty();
        deleteAllShape();
    });

    $.get("/uavsar_query/", {'querystr': querystr})
        .done(function(datasetsStr) {
            var datasets=jQuery.parseJSON(datasetsStr);
            displaySelectedImages(datasets);

//            if($('.panel-close-button').hasClass('inactive') && $('#uavsar').hasClass('inactive'))
//            {
//                $('.panel-close-button').removeClass('inactive').addClass('active');
//                $('#uavsar').removeClass('inactive').addClass('active');
//                $('#FadeDisplay').show();
//            }
            // else clear #uavsar
//            else
//                $('#uavsar').empty();
            // clear wmsgf9_samples
//            wmsgf9_samples = {};
            // clear uavsar dataset overlays
//            mapA.overlayMapTypes.setAt(0, null);
//            for (var index1 in datasets) {
//                var uid_str = "'" + datasets[index1]['uid'] + "'";
//                var dataname_str = "'" +datasets[index1]['dataname'] + "'";
//                var radarDirectionStr="'" +datasets[index1]['radardirection'] + "'";
//                console.log(uid_str + " " + dataname_str);
//                dynatable='<div style="word-wrap:break-word;">';
//                dynatable+='<table class="sartable-inner" style="table-layout:fixed;width:100%" border="1">';  //Open table
//                dynatable+='<tr>'; //Create row in embedded table
//                dynatable+='<th colspan="2">'+dataname_str+'</th>'; //Add header to table row
//                dynatable+='</tr>'; //Close embedded table's header row
//                dynatable+='<tr>'; //Start second embedded table row
//                dynatable+='<td>'+datasets[index1]['time1'] +'</td><td>'+datasets[index1]['time2']+'</td>'; //Display time1 and time2 in embedded table's second row
//                dynatable+='</tr>'; //Close embedded table's second row
//                dynatable+='</table>'; //Close the embedded table
//                dynatable+='</div>'
//
//                $('#uavsar').append('\
//                    <div class="dataset">\
//                        <input class="dataset-checkbox" id="sarDisplayOrNot_'+datasets[index1]['uid']+'"type="checkbox" name="dataset" value="' + datasets[index1]['uid'] + '" checked/>\
//<a href="#" onClick="selectDataset(' + datasets[index1]['uid'] + ', ' + dataname_str + ','+datasets[index1]['heading']+','+radarDirectionStr+');">\
//                            <span class="default-font">' + dynatable + '</span>\
//                    </div>');
//                viewDataset(datasets[index1]['uid'], datasets[index1]['dataname'], true);
//            };

            // update displayed datasets
//            updateVisibleDatasets();
//            $("#data-panel").on('click', '.dataset-checkbox', function() {
//                var uid = $(this).val();
//                if(this.checked)
//                {
//                    console.log(uid);
//                    viewDataset(uid, '', true);
//                }
//                else
//                {
//                    // console.log('hiding');
//                    console.log(uid);
//                    viewDataset(uid, '', false);
//                }
//                updateVisibleDatasets();
//            });
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

// script for closing the data panel
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
    $('#UAVSAR-active-tool').prop("checked",false);
    $('#uavsar-instructions').hide();
    deleteAllKml();
    clear_UAVSAR();
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
    mapA.overlayMapTypes.setAt(0, wmsgf9);
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
    if($('.extra-tools-panel').hasClass('inactive'))
    {
        $('.extra-tools-panel').removeClass('inactive').addClass('active');
        $('.extra-tools-panel').animate({height: "160px"}, 50);
    }
    var lat1 = LOS_markers[0].getPosition().lat();
    var lng1 = LOS_markers[0].getPosition().lng();
    var lat2 = LOS_markers[1].getPosition().lat();
    var lng2 = LOS_markers[1].getPosition().lng();
    var format = 'csv';
    var resolution = $('#resolution-value').val();
    var method = 'native';
    var average = '10';
    var downloadUrl="/los_query?image_uid="+image_uid+"&lat1="+lat1+"&lng1="+lng1+"&lat2="+lat2+"&lng2="+lng2+"&format="+format+"&resolution="+resolution+"&method="+method+"&average="+average;
    $("#LOS-Data-Download").html("<a href='"+downloadUrl+"' target='_blank'><b>Download LOS Data</b></a>");
    

    $.ajax({        
        url:"/los_query",
        beforeSend:function() {if(dygraph1) {dygraph1.destroy(); };
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
            'average': average
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
                csv_final,{drawPoints:true,pointSize:2,strokeWidth:0.0,title:'Ground Range Change',
                           titleHeight:20, 
                           xLabelHeight:16,
                           yLabelWidth:16,
                           xlabel:'Distance (km)',
                           ylabel:'Ground Range Change (cm)'}
            );
        });
    
}
//TODO: Deprecate this in favor of the jQuery().ajax() method above.
function drawDygraph(image_uid) {
//    console.log("drawDygraph called: "+image_uid);
    if($('.extra-tools-panel').hasClass('inactive'))
    {
        $('.extra-tools-panel').removeClass('inactive').addClass('active');
//        var new_height = $('#map-canvas').height() - 160;
//        $('#map-canvas').animate({height: new_height + "px"}, 50);
        $('.extra-tools-panel').animate({height: "160px"}, 50);
    }
    var lat1 = LOS_markers[0].getPosition().lat();
    var lng1 = LOS_markers[0].getPosition().lng();
    var lat2 = LOS_markers[1].getPosition().lat();
    var lng2 = LOS_markers[1].getPosition().lng();
    var format = 'csv';
    var resolution = '100';
    var method = 'average';
    var average = '10';
    $.get("/los_query/",
        {
            'image_uid': image_uid,
            'lat1': lat1,
            'lng1': lng1,
            'lat2': lat2,
            'lng2': lng2,
            'format': format,
            'resolution': resolution,
            'method': method,
            'average': average
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

            var g2 = new Dygraph(
                document.getElementById("dygraph-LOS"),
                csv_final,{drawPoints:true,pointSize:2,strokeWidth:0.0,title:'Ground Range Change',
                      titleHeight:20, 
                    xLabelHeight:16,
                      yLabelWidth:16,
                      xlabel:'Distance (km)',
                      ylabel:'Ground Range Change (cm)'}
        );
        });

 //   $.get("/hgt_query/",
 //       {
 //           'image_uid': image_uid,
 //           'lat1': lat1,
 //           'lng1': lng1,
 //           'lat2': lat2,
 //           'lng2': lng2,
 //           'format': format,
 //           'resolution': resolution,
 //           'method': method,
 //           'average': average
 //       })
 //       .done(function(csv) {
 //           var g2 = new Dygraph(
 //               document.getElementById("dygraph-HGT"),
 //               csv,{drawPoints:true,pointSize:2,strokeWidth:0.0,title:'Topographic Height',
 //                     titleHeight:20, 
 //                   xLabelHeight:16,
 //                     yLabelWidth:16,
 //                     xlabel:'Distance (km)',
 //                     ylabel:'Topographic Height (m)'}
 //       );
 //       });
}

////////////////////////////////// FAULT LAYER ////////////////////////////////

// START KML FAULT LAYER
// simple call for the kml data
function setup_FAULT_LAYER() {
    ctaLayer = new google.maps.KmlLayer({
        url: 'http://gf2.ucs.indiana.edu/ucerf3_black.kml',
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
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        MapTypeControl: true,
        mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
        navigationControl: true,
        navigationControlOptions: { style: google.maps.NavigationControlStyle.ZOOM_PAN },
        backgroundColor: 'White',
        scrollwheel: false,
        maxZoom: 17,
        scaleControl: true,
        center: connecticut
    }

    mapA = new google.maps.Map(document.getElementById("map-canvas"), mapA_setup);

    setup_UAVSAR();
    setup_FAULT_LAYER();
}

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
        }
    });
});


//--------------------------------------------------
// This function fades and restores the SAR image
//--------------------------------------------------
$(document).ready(function(){
$(".faderButton").click(function() {
//updated the source to usercontent
//$("#map-canvas").find("img[src*='mapsatt']").fadeTo("fast","0.50");
$("#map-canvas").find("img[src*='usercontent']").fadeTo("fast","0.50");
});

$(".resetButton").click(function() {
//$("map-canvas").find("img[src*='mapsatt']").fadeTo("fast","1.0");           
$("#map-canvas").find("img[src*='usercontent']").fadeTo("fast","1.0");
});
});
