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

}

function showGDACS(){
    if (document.getElementById("GDACS").checked == false){
	document.getElementById("Global Forecast").checked = true;
	document.getElementById("California Forecast").checked = false;
	kml_gdacs.setMap(null);
	kml_wo.setMap(mapA);
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
        kml_gdacs.setMap(mapA);
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
