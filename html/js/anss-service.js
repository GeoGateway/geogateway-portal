var anssgadget=anssgadget || (function() {
    var bboxDiv=document.getElementById("acgBBoxDiv");

	//Get Minimum and Maximum magnituted entered in the UI
    var minmag=document.getElementById("acgMinMagnitude");
    var maxmag=document.getElementById("acgMaxMagnitude");
	
	//Get Minimum and Maximum Date range entered in the UI
    var mindate=document.getElementById("acgMinDate");
    var maxdate=document.getElementById("acgMaxDate");

	//Get Minimum and Maximum Time range entered in the UI
    var mintime=document.getElementById("acgMinTime");
    var maxtime=document.getElementById("acgMaxTime");

	//Get the Lattitude and Longituted range from the UI
    var minlat=document.getElementById("minlatbbox");
    var minlon=document.getElementById("minlonbbox");
    var maxlat=document.getElementById("maxlatbbox");
    var maxlon=document.getElementById("maxlonbbox");
    
    var resultKmlDiv=document.getElementById("acgResultKml");
    
    //These are "global" variables
    var map;
    var markers=new Array();
    var markerNE, markerSW;
    var polyPoints;
    var polyShape;
    var polyLineColor = "#3355ff";
    var polyFillColor = "#335599";
    var urlBase="/AnssCatalogService/";
    var amp="&";
    //These are parameters needed by the anss service.
    var OUTPUT_TYPE="output=kml";
    var OUTPUT_TYPE2="output=csv";
    var OUTPUT_FORMAT="format=cnss";
    var MINTIME="mintime=";
    var MAXTIME="maxtime=";
    var MINMAG="minmag=";
    var MAXMAG="maxmag=";
    var ETYPE="etype=E";
    var OUTPUT_LOC="outputloc=ftp";
    var MINLON="minlon=";
    var MAXLON="maxlon=";
    var MINLAT="minlat=";
    var MAXLAT="maxlat=";
    var DEFAULT_MIN_WALLTIME="00:00:00";
    var DEFAULT_MAX_WALLTIME="00:00:00";
    var kmlLayer; 


    function submitMapRequestGeoJson() {
		var urlBase="https://earthquake.usgs.gov/fdsnws/event/1/query?";
		var amp="&";
		var format="format=geojson";


		var finalUrl=urlBase+format;
		var finalKMLUrl = urlBase + "format=kml";

		finalUrl = appendParameters(finalUrl);
		finalKMLUrl = appendParameters(finalKMLUrl);
		//console.log(finalUrl);
		//console.log(finalKMLUrl);
		$.getJSON(finalUrl)
		    .done(function(data){

				clearMapData();
				var download_content;
				download_content = "<a href="+finalUrl + ' target="_blank" download="query.GeoJSON">Download GeoJSON</a>';
				download_content += "&nbsp;&nbsp;&nbsp;";
				download_content +="<a href="+finalKMLUrl + ' target="_blank" download="query.kml">Download USGS KML</a>';
				document.getElementById("ssmkmldownloaddiv").innerHTML=download_content; 

				var iconscale=document.getElementById("ssmiconscale").value;
				var numofpoint = data["features"].length;
				if (numofpoint == 0) {
					alert("Zero earthquake found with the serach criteria!");
					return;
				}
				if (numofpoint > 5000) {
					alert(numofpoint.toString() + " earthquake found, it may take a while to finish the plotting!");
				}
				mapA.data.addGeoJson(data);	
				mapA.data.setStyle(function(feature) {
          			var mag = iconscale * Math.floor(parseFloat(feature.getProperty('mag')))*1.3;
          			return /** @type {google.maps.Data.StyleOptions} */({
            		icon: {
              			path: google.maps.SymbolPath.CIRCLE,
			              scale: mag,
			              fillColor: '#f00',
			              fillOpacity: 1,
			              strokeWeight: 0.5
		            }
		          });
		        });
		        //skip tooltips
		        if (document.getElementById("sstooltips").checked) {
			        var infowindow = new google.maps.InfoWindow();
			        mapA.data.addListener('click', function(event) {
	     				var feat = event.feature;
						var eventdate = new Date(feat.getProperty("time"));
						var html = "<b>"+feat.getProperty('place')+"</b><br>";
	     				html+= "<strong>mag: "+feat.getProperty('mag')+"</strong><br>";
	     				html += "<strong>" + eventdate.toUTCString()+"</strong><br>";
	     				html += "<br><a class='normal_link' target='_blank' href='"+feat.getProperty('url')+"'>USGS Event</a>";
	     				infowindow.setContent(html);
	     				infowindow.setPosition(event.latLng);
	     				infowindow.setOptions({pixelOffset: new google.maps.Size(0,-34)});
	     				infowindow.open(mapA);
	  				}); 
		    	}
	
		    });
    }

    function hideEarthquakeLayer() {
		mapA.data.setStyle({visible: false}); 
    }

	function clearMapData(){
	
		mapA.data.forEach(function(feature) {
			mapA.data.remove(feature);
		});
	
		if(kmlLayer != null)
			{kmlLayer.setMap(null);}
		//clear div
		document.getElementById("ssmkmldownloaddiv").innerHTML=""; 
	}


    function submitMapRequestKml(){
		var urlBase="https://earthquake.usgs.gov/fdsnws/event/1/query?";
		var amp="&";
		var format="format=kml";
		var finalUrl=urlBase+format;

		finalUrl = appendParameters(finalUrl);

		console.log(finalUrl);
		clearMapData();
		
		kmlLayer = new google.maps.KmlLayer({
	            url: finalUrl,
	            suppressInfoWindows: false,
	            map: mapA,
		    preserveViewport: true,
		    screenOverlays: false
	        });
    }

    
    function appendParameters(finalUrl) {

		if(mindate.value)
			finalUrl += amp + "starttime=" + mindate.value + "T" + mintime.value;
		if(maxdate.value)
			finalUrl += amp + "endtime=" + maxdate.value + "T" + maxtime.value;
		
    	if(minmag.value)
			finalUrl += amp + "minmagnitude=" + minmag.value;
		if(maxmag.value)
			finalUrl += amp + "maxmagnitude=" + maxmag.value;

		if(minlat.value)
			finalUrl += amp + "minlatitude=" + minlat.value;
		if(maxlat.value)
			finalUrl += amp + "maxlatitude=" + maxlat.value;

		if(minlon.value)
			finalUrl += amp + "minlongitude=" + minlon.value;
		if(maxlon.value)
			finalUrl += amp + "maxlongitude=" + maxlon.value;

		return finalUrl;

    }

    function submitMapRequestOldAnss(minmag,maxmag,mindate,maxdate,minlat,minlon,maxlat,maxlon) {	
	
	//Note this assumes the AnssCatalogService is co-located.
	console.log("Submitting request");
	var mintime=MINTIME+mindate.value+","+DEFAULT_MIN_WALLTIME;//"00:00:00";
	var maxtime=MAXTIME+maxdate.value+","+DEFAULT_MAX_WALLTIME;//"00:00:00";
	var minmag=MINMAG+minmag.value;
	var maxmag=MAXMAG+maxmag.value;
	if(minlat && minlon && maxlat && maxlon) {
	    var minlon=MINLON+minlon.value;
	    var maxlon=MAXLON+maxlon.value;
	    var minlat=MINLAT+minlat.value;
	    var maxlat=MAXLAT+maxlat.value;
	    var finalUrl=urlBase+"?"+OUTPUT_TYPE+amp+OUTPUT_FORMAT+amp+mintime+amp+maxtime+amp+minmag+amp+maxmag+amp+ETYPE+amp+OUTPUT_LOC+amp+minlon+amp+maxlon+amp+minlat+amp+maxlat;

	    console.log(finalUrl);
	}
	else {
	    var finalUrl=urlBase+"?"+OUTPUT_TYPE+amp+OUTPUT_FORMAT+amp+mintime+amp+maxtime+amp+minmag+amp+maxmag+amp+ETYPE+amp+OUTPUT_LOC;
	    console.log(finalUrl);
	}
	
	var request=$.ajax({
	    url:finalUrl,
	    beforeSend: function() {
		$('#acgResultKml').html("Request submitted. Please wait.")
	    }
	});
	
	request.done(function(results){
	    
	});
	
	request.fail(function(errorMsg) { 
	    $('#acgResultKml').html("Request failed: No matches for your search criteria");
	    console.log(errorMsg);
	});
	
    }
    
    
    /**
     * This is the public API
     */
    return {
	submitMapRequestOldAnss:submitMapRequestOldAnss,
	submitMapRequestKml:submitMapRequestKml,
	submitMapRequestGeoJson:submitMapRequestGeoJson,
	clearMapData:clearMapData,
	hideEarthquakeLayer:hideEarthquakeLayer
    }
})();

// function to call seismicity plot 
function runseismicityplots() {
	var latitude = $('#sp_latitude').val();
	var longitude = $('#sp_longitude').val();
	var placename = $('#sp_placename').val();
	placename = placename.replace(/\s+/g, '');
	if (placename == '') {placename = "Point";};
	var location = latitude + "," + longitude;
	// parameters: name, country, location
	var data = {
		"name":placename,
		"country": "notset",
		"location": location.replace(/\s+/g, '')
	};
	google.maps.event.clearListeners(mapA, 'mousedown');
	mapA.setOptions({draggableCursor:null});

	$('#sp_submit').text('Calculating');
	$('#sp_locationpicker').button('toggle');
	$.ajax({
        url:'seismicity_plot',
        async:true,
        timeout: 120000,
        data:{'data':jQuery.param(data)}
    }).done(function(result) {
    	var obj = JSON.parse(result);
    	// add marker
    	var latlon = obj.location.split(","); 
    	var myLatLng = {lat: parseFloat(latlon[0]), lng: parseFloat(latlon[1])};
		var linkurl;
		var imagelinks = '';
		var imagestring = '<a href="imageurl" target="_blank"><img src="imageurl" style="width:200px;height:150px;"></a>';
		obj.urls.sort(); //sort return urls
		for (i = 0; i< obj.urls.length; i++) {
			linkurl = obj.urls[i];
			imagelinks += imagestring.replace(/imageurl/g, linkurl);
		};

		//alert(imagelinks);
		var contentString = '<div id="content">'+
      			'<h2>'+obj.name +" : " + obj.location+'</h2>' +
            '<div id="bodyContent">'+ imagelinks +
            '</div></div>';
        //alert(contentString);
        var infowindow = new google.maps.InfoWindow({
          content: contentString
        });

    	var plotmarker = new google.maps.Marker({
          position: myLatLng,
          map: mapA,
          title: obj.name
        });

        plotmarker.addListener('click', function() {
          infowindow.open(mapA, plotmarker);
        });

        google.maps.event.trigger(plotmarker, 'click');

        mapA.setCenter(myLatLng);
		$('#sp_submit').text('Plot');

    });
}

function splocationpicker() {
	  // Maps mousemove listener
	 $('#sp_locationpicker').button('toggle');
	 mapA.setOptions({draggableCursor:'crosshair'});
	 google.maps.event.addListener(mapA, 'mousedown', function (event)   {
   displayCoordinates(event.latLng);});
}

function displayCoordinates(pnt) {
	var lat = pnt.lat();
  	lat = lat.toFixed(4);
  	var lng = pnt.lng();
  	lng = lng.toFixed(4);
  	$('#sp_latitude').val(lat);
  	$('#sp_longitude').val(lng);
}

function sswindowpicker() {
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
				fillOpacity : 0.1,
                editable: false,
              draggable: false
			}	
		});
		// Loading the drawing Tool in the Map.
		drawingManager.setMap(mapA);
		drawing_listener = google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
        	drawingManager.setDrawingMode(null);
            var ne = e.overlay.getBounds().getNorthEast();
        	var sw = e.overlay.getBounds().getSouthWest();
        	$("#minlatbbox").val(sw.lat().toFixed(4));
        	$("#minlonbbox").val(sw.lng().toFixed(4));
        	$("#maxlatbbox").val(ne.lat().toFixed(4));
        	$("#maxlonbbox").val(ne.lng().toFixed(4));
            e.overlay.setMap(null);
            drawingManager.setMap(null);
        });
}

