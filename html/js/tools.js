// reference: sarselect2.js from Malron's code
// http://gf4.ucs.indiana.edu/InSAR-LOS/SAR-LOS-Main2.faces
//setting up Google Maps and all overlays
var mapA;
//var wmsgf9;
var wmsgf9_select;
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

//OpenHazards/UCDavis KMZ Layers
var kml_wo = new google.maps.KmlLayer({
    url: 'http://www.openhazards.com/Tools/kml/wo-forecast.kmz',
    preserveViewport: true
  });

var kml_ca = new google.maps.KmlLayer({
    url: 'http://www.openhazards.com/Tools/kml/ca-forecast.kmz',
    preserveViewport: true,
    zIndex:0
  });

var kml_faults = new google.maps.KmlLayer({
    url: 'http://www.openhazards.com/Tools/kml/ucerf.kml',
    preserveViewport: true,
    zIndex: 1
    });

var kml_gdacs = new google.maps.KmlLayer({
    url: 'http://www.gdacs.org/xml/gdacs.kml',
    preserveViewport: true,
    zIndex: -1
    });


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

//START UAVSAR
function setup_UAVSAR() {
//     var wmsOptions3 = {
//         alt: "GeoServer",
//         getTileUrl: WMSGetTileUrl2,
//         isPng: true,
//         maxZoom: 17,
//         name: "Geoserver",
//         tileSize: new google.maps.Size(256, 256),
//         opacity:0.6,
//         credit: 'Image Credit: QuakeSim'
//     };


    //Controling the Layers that appear in Map A.  You can set certain maps to appear in Map A or in Map B.  In this example they appear in both maps.
    //TODO: These need to be unified with mapA's other option settings in initialize().
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
        {x.innerHTML = "Point: " + e.overlay.getPosition();};
        if (e.type == "polyline")
            {x.innerHTML = "Line: " + e.overlay.getPath().getArray();};
        if (e.type == "polygon")
            {x.innerHTML = "Polygon: " + e.overlay.getPath().getArray();};
        if (e.type == "rectangle")
            {x.innerHTML = "Rectangle:" + e.overlay.getBounds();};
    
        // call uavsar query
        //console.log(x.innerHTML);
        uavsarquery(x.innerHTML);
    });
}

/**
* These are UC Davis map layers
*/
 
function eqfeed_callback(data) {
  map.data.addGeoJson(data);
}

function loadQuakes(){
    window.eqfeed_callback = function(results) {
        numberEQs = results.features.length;

        for (var i = 0; i < results.features.length; i++)  {
            time_event = results.features[i].properties.time;
            time_event = time_event * 1;    // convert from string to int
            
            if (i == 0) {
                var min_time = time_event;
                var max_time = time_event;
            }
            
            if (time_event < min_time) {
                min_time = time_event
            }
            
            if (time_event > max_time) {
                max_time = time_event
            }
        }

        for (var i = 0; i < results.features.length; i++) {
            
            var infowindow = new google.maps.InfoWindow({content: contentString});
            //    ---------------------------------------------------------------------
            //
            //    Information for the Pop Up Info Windows when you click on the earthquakes
            //
            var eq_mag        = results.features[i].properties.mag;
            var coords = results.features[i].geometry.coordinates;
            var depth  = coords[2].toFixed(1);
            
            if (eq_mag >= mag_limit){                               // For filtering by magnitude
                if (depth <= depth_limit) {
                    var mag_string    = eq_mag.toFixed(1);
                    
                    var timestamp = results.features[i].properties.time;
                    timestamp = timestamp * 1  // converts string to integer
                    var eq_date_time  = new Date(timestamp);
                    var eq_place      = results.features[i].properties.place;
                    var eq_url        = results.features[i].properties.url;

                    //    --------------------------------------------------------------------
                    //  var coords = results.features[i].geometry.coordinates;
                    //  var depth  = coords[2].toFixed(1);
                    longitude = coords[0].toFixed(3);
                    latitude  = coords[1].toFixed(3);
                    var latLng = new google.maps.LatLng(coords[1],coords[0]);
                    
                    // Define colors of events: Hottest colors are most recent
                    
                    var low = [151, 83, 34];   // color of mag 1.0
                    var high = [5, 69, 54];    // color of mag 6.0 and above
                    
                    var eq_fraction = (timestamp - min_time)/(max_time - min_time)
                    
                    var fraction = Math.pow(eq_fraction,0.5); 
                    var color = interpolateHsl(low, high, fraction);
                    
                    //  This is the content string for the Info Windows
                    
                    var contentString = 
                        '<div id="content">'+
                        '<div id="siteNotice">'+
                        '</div>'+
                        'Magnitude: ' + mag_string + '<p/>'+
                        'Date/Time: ' + eq_date_time + '<p/>'+
                        'Location: ' + eq_place  + '<p/>'+
                        'Hypocenter: Latitude: ' + latitude + '<sup>o</sup>' +
                        ' &nbsp; &nbsp; Longitude: ' + longitude + '<sup>o</sup>' +  ' &nbsp; &nbsp; Depth: ' + depth + ' km' + '<p/>'+
                        'URL: ' + '<a href='+ '"' + eq_url +'"' + '>' + eq_url + '</a><p/>'+
                        '<div id="bodyContent">'+ 
                        '</div>'+
                        '</div>';
                    
                    //  Define the earthquake markers
                    
                    var marker = new google.maps.Marker({
                        position: latLng,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            strokeWeight: 0.2,
                            strokecolor: 'black',
                            fillColor: color,       
                            fillOpacity: 4 / Math.pow(eq_mag,1.0),
                            scale: Math.pow(eq_mag, 1.6)
                        },
                        //       animation: google.maps.Animation.BOUNCE,
                        zIndex: 1+Math.floor(eq_mag),
                        title: 'Mag='+ mag_string +' ' +' Depth='+ depth.toString() +' km',
                        map: mapA
                    });
                    
                    //  Put the markers into an array markers[]
                    markers.push(marker);
                    //  Listen for clicks on the earthquakes
                    google.maps.event.addListener(marker, 'click', getInfoCallback(mapA, contentString));
                    //  Start with the earthquakes on the mapm since you just loaded them
                    setAllMap(mapA);
                    
                }
            }
            
        }   // depth limit
    }   // mag limit
}

function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function calcwo(){    
    kml_ca.setMap(null);
    document.getElementById("California Forecast").checked = false;
    
    if (document.getElementById("Global Forecast").checked == false){
        kml_wo.setMap(null);
    }
    if (document.getElementById("Global Forecast").checked == true){
        showFaults();       // Faults should be top layer
        kml_wo.setMap(mapA);
    }
}

//  Display the California Forecast in response to clicking the box
function calcca(){
    kml_wo.setMap(null);
    document.getElementById("Global Forecast").checked = false;
    
    if (document.getElementById("California Forecast").checked == false){
        kml_ca.setMap(null);
    }
    if (document.getElementById("California Forecast").checked == true){
        showFaults();       // Faults should be top layer
        kml_ca.setMap(mapA);
    }
}

function showFaults(){
    kml_faults.setMap(null);    
    if (document.getElementById("Faults").checked == true){
    kml_faults.setMap(mapA);
    }
}


function loadQuakesDay(){
    // Get the earthquake data (JSONP format) from the USGS: M>1.0, Last Day
    var script = document.createElement('script');
//    script.src = 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/1.0/day';
    script.src='http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_day.geojsonp';
    script.id="QuakesDay";
    document.getElementsByTagName('head')[0].appendChild(script);
}

function loadQuakesWeek(){
  // Get the earthquake data (JSONP format) from the USGS: M>2.5, Last Week
    var script = document.createElement('script');
//    script.src = 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/2.5/week'; 
    script.src='http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojsonp';
    script.id="QuakesWeek";
    document.getElementsByTagName('head')[0].appendChild(script);
} 

function loadQuakesMonth(){
  // Get the earthquake data (JSONP format) from the USGS: M>2.5, Last Week
    var script = document.createElement('script');
//    script.src = 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/4.5/month'; 
    script.src='http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojsonp';
    script.id="QuakesMonth";
    document.getElementsByTagName('head')[0].appendChild(script);
}
 
//  Display the earthquakes in response to clicking the box
function eqDay(){
    if (document.getElementById("EQDay").checked == false){
        document.getElementById("EQToggle").checked = false;
        removeChildElement("QuakesDay");
        deleteMarkers();
    }
    
    if (document.getElementById("EQDay").checked == true){
        document.getElementById("EQToggle").checked = true;  
        //Turn off weeks and months
        document.getElementById("EQWeek").checked = false;
        document.getElementById("EQMonth").checked = false;
        
//        removeChildElement("QuakesDay");
        removeChildElement("QuakesWeek");
        removeChildElement("QuakesMonth");

        deleteMarkers();
        loadQuakesDay();
        loadQuakes();
        eqToggle();
    }
}

function eqWeek(){
    if (document.getElementById("EQWeek").checked == false){
        document.getElementById("EQToggle").checked = false;
        removeChildElement("QuakesWeek");
        deleteMarkers();
    }
    if (document.getElementById("EQWeek").checked == true){
        document.getElementById("EQToggle").checked = true;  
        document.getElementById("EQDay").checked = false;
        document.getElementById("EQMonth").checked = false;
        
//        removeChildNodes();
        removeChildElement("QuakesDay");
        removeChildElement("QuakesMonth");

        deleteMarkers();
        loadQuakesWeek();
        loadQuakes();
        eqToggle();
    }
}

function eqMonth(){
    if (document.getElementById("EQMonth").checked == false){
        document.getElementById("EQToggle").checked = false;
        removeChildElement("QuakesMonth");
        deleteMarkers();
    }
    
    if (document.getElementById("EQMonth").checked == true){
        document.getElementById("EQToggle").checked = true;  
        document.getElementById("EQDay").checked = false;
        document.getElementById("EQWeek").checked = false;
        
//        removeChildNodes();
        removeChildElement("QuakesDay");
        removeChildElement("QuakesWeek");
        deleteMarkers();
        loadQuakesMonth();
        loadQuakes();
        eqToggle();
    }
}

function eqToggle(){
    
    if (document.getElementById("EQDay").checked == false               &&
        +   document.getElementById("EQWeek").checked == false      &&
        +   document.getElementById("EQMonth").checked == false){
        document.getElementById("EQToggle").checked = false
        
    }
    
    if (document.getElementById("EQToggle").checked == false){
        setAllMap(null);
    }
    
    if (document.getElementById("EQToggle").checked == true){
        setAllMap(mapA);
    }
}

//  Used in computing the markers and placing on the map
function getInfoCallback(map, content) {
    var infowindow = new google.maps.InfoWindow({content: content});
    return function() {
        infowindow.setContent(content); 
        infowindow.open(map, this);
    };
}

//  Used in the color assignments for the earthquakes
function interpolateHsl(lowHsl, highHsl, fraction) {
    var color = [];
    for (var i = 0; i < 3; i++) {
        // Calculate color based on the fraction.
        color[i] = (highHsl[i] - lowHsl[i]) * fraction + lowHsl[i];
    }
    return 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)';
}

// Sets the map on all markers in the array.
function setAllMap(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setAllMap(null);
}

// Shows any markers currently in the array.
function showMarkers() {
  setAllMap(map);
}

// Deletes all markers in the array by removing references to them.

function deleteMarkers() {
    clearMarkers();
    markers = [];
}

function removeChildElement(childId) {
    childElem=document.getElementById(childId);
    if(childElem !== null) {
        childElem.parentNode.removeChild(childElem);
    }

    // Get the element with id='head'
    //    var list = document.getElementsByTagName('head')[0];
    // As long as elemsnt has a child node, remove it
    //    while (list.hasChildNodes()) {  
    //        list.removeChild(list.firstChild);
    //    }
}

function showGDACS(){
    if (document.getElementById("GDACS").checked == false){
    document.getElementById("Global Forecast").checked = true;
    document.getElementById("California Forecast").checked = false;
    kml_gdacs.setMap(null);
    kml_wo.setMap(map);
    kml_ca.setMap(null);
    }

    if (document.getElementById("GDACS").checked == true){
        document.getElementById("Global Forecast").checked = false;
        document.getElementById("California Forecast").checked = false;
        document.getElementById("EQDay").checked = false;
        document.getElementById("EQWeek").checked = false;
        document.getElementById("EQMonth").checked = false;
        document.getElementById("EQToggle").checked = false;  
        document.getElementById("M5").checked = false;
        document.getElementById("M65").checked = false;
        document.getElementById("Depth30").checked = false;  
        document.getElementById("Faults").checked = false;  

        kml_faults.setMap(null);
        kml_wo.setMap(null);
        kml_ca.setMap(null);
        setAllMap(null);
        kml_gdacs.setMap(map);
    }    
}
function filterM5(){
    areQuakesLoaded();
   
  if (quakes_loaded == true){
        mag_limit = 0.0;

    if (document.getElementById("M5").checked == true){
        mag_limit = 5.0;

        document.getElementById("M65").checked = false;

        }  // M5 box is checked

    if (document.getElementById("M5").checked == false){
        mag_limit = 0.0;

        document.getElementById("M65").checked = false;

        }  // M5 box is checked

    if (document.getElementById("EQDay").checked == true){
        eqDay();   
    }

    //  If the Last Week is checked

    if (document.getElementById("EQWeek").checked == true){
        eqWeek();   
    }

   //  If the Last Month is checked

    if (document.getElementById("EQMonth").checked == true){
        eqMonth();   
    }
   
  }   // quakes_loaded = true

    
}   // filterM5

function filterM65(){

    areQuakesLoaded();
   
  if (quakes_loaded == true){
        mag_limit = 0.0;

    if (document.getElementById("M65").checked == true){
        mag_limit=6.5;

        document.getElementById("M5").checked = false;

        }  // M6.5 box is checked

    if (document.getElementById("M65").checked == false){
        mag_limit = 0.0;


        }  // M6.5 box is checked

    if (document.getElementById("EQDay").checked == true){
        eqDay();   
    }

    //  If the Last Week is checked

    if (document.getElementById("EQWeek").checked == true){
        eqWeek();   
    }

   //  If the Last Month is checked

    if (document.getElementById("EQMonth").checked == true){
        eqMonth();   
    }
   
  }   // quakes_loaded = true

    
}   // filterM5


function filterDepth30(){

    areQuakesLoaded();

    if (quakes_loaded == true){

        depth_limit = 1000.0;   // Default value

        if (document.getElementById("Depth30").checked == true){
        depth_limit = 30.0;
        }


    //  If the Last Day is checked

    if (document.getElementById("EQDay").checked == true){

        document.getElementById("EQToggle").checked = true;  

        document.getElementById("EQWeek").checked = false;
        document.getElementById("EQMonth").checked = false;

        removeChildElement("QuakesWeek");
        removeChildElement("QuakesMonth");
        deleteMarkers();

        loadQuakesDay();
        loadQuakes();
        }

    //  If the Last Week is checked


    if (document.getElementById("EQWeek").checked == true){
    
        document.getElementById("EQToggle").checked = true;  

        document.getElementById("EQDay").checked = false;
        document.getElementById("EQMonth").checked = false;

//        removeChildNodes();
        removeChildElement("QuakesDay");
        removeChildElement("QuakesMonth");

        deleteMarkers();

        loadQuakesWeek();
        loadQuakes();
        }

   //  If the Last Month is checked


    if (document.getElementById("EQMonth").checked == true){
    
        document.getElementById("EQToggle").checked = true;  

        document.getElementById("EQDay").checked = false;
        document.getElementById("EQWeek").checked = false;

//        removeChildNodes();
        removeChildElement("QuakesDay");
        removeChildElement("QuakesWeek");
        deleteMarkers();
        loadQuakesMonth();
        loadQuakes();
 

        }

    }  // quakes_loaded
        
}   //   filterDepth30();

function areQuakesLoaded(){

    quakes_loaded = false;

    if (    document.getElementById("EQDay").checked == true       ||
        +   document.getElementById("EQWeek").checked == true      ||
        +   document.getElementById("EQMonth").checked == true){

        quakes_loaded = true;
            
            }
  //   alert(quakes_loaded);
}


//--------------------------------------------------
//End of UCDavis forecast tools
//--------------------------------------------------

//Put user-supplied  layer on the map
function addKmlLayer(){
    var theLayer=document.getElementById("kmlMapperUrl").value;
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
            url: toggleLayer.id,
            suppressInfoWindows: false,
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
    //var theLayer=document.getElementById(folderurl).href;
    //theLayer = theLayer + kmlfile;
    //alert(theLayer);
    //console.log("Adding layer:"+theLayer);
    //turn on the checkbox
    //$("#display"+folderurl).prop("checked",true);
    //$("#display"+folderurl).show();
    //kmlLayer = new google.maps.KmlLayer({
    //    url: theLayer,
    //     suppressInfoWindows: false,
    //    map: mapA
    //});
    //dislockmls[folderurl]=kmlLayer;
    dislockmls[folderurl]="";
}

function check_dislockml(element) {
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
	 length=$("#losLength-value").val();
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

    $("#QuakeTables-Link").html('<p/><a target="_blank" href="http://gf2.ucs.indiana.edu/quaketables/uavsar?uid='+uid+'"><b>Go to download page for selected data set</b></a>');
    
    //Turn off the radio buttons and all the displays.
//    console.log(uid,dataname);
    for(var uid1 in wmsgf9_samples) {
		  $("#sarDisplayOrNot_"+uid1).prop('checked',false);	
		  $("#sarDisplayOrNot_"+uid1).prop('disabled',false);	
        wmsgf9_samples[uid1][1]=false;
        wmsgf9_samples[uid1][2]=true;
    }
    //Turn the display flags back on for te selected image.
	 $("#sarDisplayOrNot_"+uid).prop('checked',true);	 
	 $("#sarDisplayOrNot_"+uid).prop('disabled',true);
	 wmsgf9_samples[uid][1]=true;
	 wmsgf9_samples[uid][2]=false;
   
    // var querystr = uid + "/" + dataname;
    wmsgf9_select = wmsgf9_samples[uid];



    // zoom to the kmllayer
    mapA.fitBounds(wmsgf9_select[0].getDefaultViewport());  

    // check wms layer -- disabled for check-in
    alert(wmsgf9_select[3]);
    if (wmsgf9_select[3] == 0) {
        var has_wms = checkwmslayer(uid);
        if (has_wms) {wmsgf9_select[3] =1;wmsgf9_samples[uid] = 1;}
        else {wmsgf9_select[3] = -1;wmsgf9_samples[uid] = -1;}
    }
    
    if (wmsgf9_select[3] == 1) {
        var wmsoverlay = loadWMS(mapA, "http://gf8.ucs.indiana.edu:8080/geoserver/InSAR/wms?","InSAR:uid"+uid+"_unw");
    }


    if(wmsgf9_select[2]) {
        viewDataset(uid, dataname, false);
    }
    viewDataset(uid, dataname, true);
    updateVisibleDatasets();
    $("input:checkbox[value="+uid+"]").prop("checked", true);

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
        dynatable+='<table class="uavsar-table">';  //Open table
        dynatable+='<tr class="uavsar-tr">'; //Create row in embedded table
        dynatable+='<th colspan="2" class="uavsar-th">'+datasets[index1]['dataname']+'</th>'; //Add header to table row
        dynatable+='</tr>'; //Close embedded table's header row
        dynatable+='<tr class="uavsar-tr">'; //Start second embedded table row
        dynatable+='<td>'+datasets[index1]['time1'] +'</td><td>'+datasets[index1]['time2']+'</td>'; //Display time1 and time2 in embedded table's second row
        dynatable+='</tr>'; //Close embedded table's second row
        dynatable+='</table>'; //Close the embedded table
        dynatable+='</div>'
        
        $('#uavsar').append('\
<div class="dataset">\
<input class="dataset-checkbox" id="sarDisplayOrNot_'+datasets[index1]['uid']+'" type="checkbox" name="dataset" value="' + datasets[index1]['uid']+' " + onClick="sarCheckboxAction('+datasets[index1]['uid']+')" checked/>\
<!--<a href="#" onClick="selectDataset(this,' + datasets[index1]['uid'] + ', ' + dataname_str + ','+datasets[index1]['heading']+','+radarDirectionStr+');">-->\
<div onClick="selectDataset(this,' + datasets[index1]['uid'] + ', ' + dataname_str + ','+datasets[index1]['heading']+','+radarDirectionStr+');">' + dynatable + '</div>\
</div>');
        viewDataset(datasets[index1]['uid'], datasets[index1]['dataname'], true);
    };
    updateVisibleDatasets();
    

/*
  //Deprecated method below
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
*/
}


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
function viewDataset(uid, dataname, show)
{
//    console.log("View Dataset: ", uid,dataname);
    if(show)
    {
        if(uid in wmsgf9_samples)
        {

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
                clickable: false
            });
            // wms layer is not checked 
            wmsgf9_samples[uid] = [wmsgf9_temp, true, false, 0];
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
// function WMSGetTileUrl2(tile, zoom) {
//     var projection = window.mapA.getProjection();
//     var zpow = Math.pow(2, zoom);
//     var ul = new google.maps.Point(tile.x * 256.0 / zpow, (tile.y + 1) * 256.0 / zpow);
//     var lr = new google.maps.Point((tile.x + 1) * 256.0 / zpow, (tile.y) * 256.0 / zpow);
//     var ulw = projection.fromPointToLatLng(ul);
//     var lrw = projection.fromPointToLatLng(lr);
//     //The user will enter the address to the public WMS layer here.  The data must be in WGS84
//     //var baseURL = "http://demo.cubewerx.com/demo/cubeserv/cubeserv.cgi?";
//     var baseURL = "http://gf9.ucs.indiana.edu/geoserver/InSAR/wms?";
//     var version = "1.3.0";
//     var request = "GetMap";
//     var format = "image%2Fpng"; //type of image returned  or image/jpeg
//     //The layer ID.  Can be found when using the layers properties tool in ArcMap or from the WMS settings
//     var layers = "InSAR:thumbnailmosaic";
//     //projection to display. This is the projection of google map. Don't change unless you know what you are doing.  
//     //Different from other WMS servers that the projection information is called by crs, instead of srs
//     var crs = "EPSG:4326";
//     //With the 1.3.0 version the coordinates are read in LatLon, as opposed to LonLat in previous versions
//     var bbox = ulw.lat() + "," + ulw.lng() + "," + lrw.lat() + "," + lrw.lng();
//     var service = "WMS";
//     //the size of the tile, must be 256x256
//     var width = "256";
//     var height = "256";
//     //Some WMS come with named styles.  The user can set to default.
//     var styles = "";
//     //Establish the baseURL.  Several elements, including &EXCEPTIONS=INIMAGE and &Service are unique to openLayers addresses.
//     var url = baseURL + "Layers=" + layers + "&version=" + version + "&EXCEPTIONS=INIMAGE" + "&Service=" + service + "&request=" + request + "&Styles=" + styles + "&format=" + format + "&CRS=" + crs + "&BBOX=" + bbox + "&width=" + width + "&height=" + height;
//     url = url + "&TRANSPARENT=true"
//     return url;
// }

// use no cross-domain query at this time
// script for calling UAVSAR layer tiles
// accomplished by sending link to backend so that the query can be sent from
// python which bypasses the issue of cross-domain queries
function uavsarquery(querystr) {
    //console.log("uavsarquery() called with querystr "+querystr);
    $(".panel-close-button").click(function() {
        closeDataPanel();
        deleteAllShape();
    });

    $.get("/uavsar_query/", {'querystr': querystr})
        .done(function(datasetsStr) {
            var datasets=jQuery.parseJSON(datasetsStr);
            displaySelectedImages(datasets);
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
    $('#QuakeTables-Link').hide();
    $('#search-string-value').val("");
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
    loadWMS(mapA, "http://gf9.ucs.indiana.edu/geoserver/InSAR/wms?","InSAR:thumbnailmosaic");
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
        scaleControl:true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
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
