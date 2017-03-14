var anssgadget=anssgadget || (function() {
    var bboxDiv=document.getElementById("acgBBoxDiv");
    
    var minmag=document.getElementById("acgMinMagnitude");
    var maxmag=document.getElementById("acgMaxMagnitude");
    var mindate=document.getElementById("acgMinDate");
    var mintime=document.getElementById("acgMinTime");
    var maxdate=document.getElementById("acgMaxDate");
    var maxtime=document.getElementById("acgMaxTime");
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

    function submitMapRequest2(){
	var urlBase="https://earthquake.usgs.gov/fdsnws/event/1/query";
	var amp="&";
	var format="format=kml";
	var minmag="minmagnitude=5.0"
	var finalUrl=urlBase+amp+format+amp+minmag;

	var kmlLayer = new google.maps.KmlLayer({
            url: finalUrl,
            suppressInfoWindows: true,
            map: mapA
        });
	
    }
    
    function submitMapRequest(minmag,maxmag,mindate,maxdate,minlat,minlon,maxlat,maxlon) {	
	
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
	submitMapRequest:submitMapRequest,
	submitMapRequest2:submitMapRequest2
    }
})();
