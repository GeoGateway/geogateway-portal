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

/////////////////////////////////////// UAVSAR ////////////////////////////////

// deletes all geometry markings made for UAVSAR
function deleteAllShape() {
    console.log("Calling deleteAllShape");
    for (var i=0; i < all_overlays.length; i++)
    {
        all_overlays[i].overlay.setMap(null);
    }
    all_overlays = [];
}

// delete all UAVSAR kml layers
function deleteAllKml() {
  if (wmsgf9_samples) {
    for (i in wmsgf9_samples) {
      wmsgf9_samples[i][0].setMap(null);
    }
    wmsgf9_samples.length = 0;
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
        credit: 'Image Credit: QuakeSim'
    };

    //Creating the object to create the ImageMapType that will call the WMS Layer Options. 
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
        console.log("Calling Drawing Listener");
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
        console.log(x.innerHTML);
        uavsarquery(x.innerHTML);
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
    });

    google.maps.event.addListener(LOS_markers[0], 'dragend', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
        drawDygraph(LOS_uid);
    });

    google.maps.event.addListener(LOS_markers[1], 'drag', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
    });

    google.maps.event.addListener(LOS_markers[1], 'dragend', function (event) {
        line.setPath([LOS_markers[0].getPosition(), LOS_markers[1].getPosition()]);
        drawDygraph(LOS_uid);
    });
    LOS_line = line;
}

// script for loading a specific UAVSAR dataset
var LOS_uid = null;

function selectDataset(uid, dataname) {
    // var querystr = uid + "/" + dataname;
    wmsgf9_select = wmsgf9_samples[uid];

    // zoom to the kmllayer
    mapA.fitBounds(wmsgf9_select[0].getDefaultViewport());  

    // new google.maps.KmlLayer({
    //  url: 'http://gf1.ucs.indiana.edu/kmz/uid' + querystr + '.int.kmz',
    //  suppressInfoWindows: true,
    // });
    // console.log(querystr);
    // make sure wmsgf9_select is on top
    if(wmsgf9_select[2]) {
        viewDataset(uid, dataname, false);
    }
    viewDataset(uid, dataname, true);
    updateVisibleDatasets();
    $("input:checkbox[value="+uid+"]").prop("checked", true);
    //wmsgf9_select[0].setMap(mapA); 
    // move wmsgf9_select to the top
    //console.log(wmsgf9_select);
    // clear_UAVSAR();
    // DataPanel();

    //shall be diable drawingmanger and all the markers
    UAVSARDrawingManager.setMap(null);
    deleteAllShape();

    google.maps.event.addListener(wmsgf9_select[0], 'click', function(kmlEvent) {
        if(LOS_markers.length == 0)
        {
            draw_marker(kmlEvent.latLng.lat(), kmlEvent.latLng.lng(), 'blue');
            draw_marker(kmlEvent.latLng.lat(), kmlEvent.latLng.lng() + 0.1, 'red');
            connect_LOS_markers();
            drawDygraph(uid);
        }
    });
    LOS_uid = uid;
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
                url: 'http://gf1.ucs.indiana.edu/kmz/uid' + querystr + '.unw.kmz',
                suppressInfoWindows: true,
                preserveViewport: true,
            });
            wmsgf9_samples[uid] = [wmsgf9_temp, true, false];
        }
    }
    // it is assumed that type = hide is only called for wmsgf9s already visible
    else
    {
        wmsgf9_samples[uid][1] = false;
    }
    // console.log(wmsgf9_samples);
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
    console.log("uavsarquery() called with querystr "+querystr);
    $(".panel-close-button").click(function() {
        closeDataPanel();
        $("#UAVSAR-geometry").empty();
        deleteAllShape();
    });

    $.get("/uavsar_query/", {'querystr': querystr})
        .done(function(datasetsStr) {
//            console.log(datasetsStr);
            var datasets=jQuery.parseJSON(datasetsStr);
            // first check if the query has already been made
            // if no, activate the data panel close button
            if($('.panel-close-button').hasClass('inactive') && $('#uavsar').hasClass('inactive'))
            {
                $('.panel-close-button').removeClass('inactive').addClass('active');
                $('#uavsar').removeClass('inactive').addClass('active');
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
                        <input class="dataset-checkbox" type="checkbox" name="dataset" value="' + this.uid + '" checked/>\
                        <a href="#" onClick="selectDataset(' + uid_str + ', ' + dataname_str + ');">\
                            <span class="default-font">' + dynatable + '</span>\
                    </div>');
                viewDataset(datasets[index1]['uid'], datasets[index1]['dataname'], true);
            };
//            $.each(datasets, function() {
//                var uid_str = "'" + this.uid + "'";
//                var dataname_str = "'" + this.dataname + "'";
//                dynatable='<div style="word-wrap:break-word;">';
//                dynatable+='<table class="sartable-inner" style="table-layout:fixed;width:100%" border="1">';  //Open table
//                dynatable+='<tr>'; //Create row in embedded table
//                dynatable+='<th colspan="2">'+this.dataname+'</th>'; //Add header to table row
//                dynatable+='</tr>'; //Close embedded table's header row
//                dynatable+='<tr>'; //Start second embedded table row
//                dynatable+='<td>'+this.time1 +'</td><td>'+this.time2+'</td>'; //Display time1 and time2 in embedded table's second row
//                dynatable+='</tr>'; //Close embedded table's second row
//                dynatable+='</table>'; //Close the embedded table
//                dynatable+='</div>'
//
//                $('#uavsar').append('\
//                    <div class="dataset">\
//                        <input class="dataset-checkbox" type="checkbox" name="dataset" value="' + this.uid + '" checked/>\
//                        <a href="#" onClick="selectDataset(' + uid_str + ', ' + dataname_str + ');">\
//                            <span class="default-font">' + dynatable + '</span>\
//                    </div>');
//                viewDataset(this.uid, this.dataname, true);
//            });
            // update displayed datasets
            updateVisibleDatasets();
            $("#data-panel").on('click', '.dataset-checkbox', function() {
                var uid = $(this).val();
                if(this.checked)
                {
                    // console.log(uid);
                    viewDataset(uid, '', true);
                }
                else
                {
                    // console.log('hiding');
                    viewDataset(uid, '', false);
                }
                updateVisibleDatasets();
            });
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
    deleteAllKml();
    clear_UAVSAR();
}

// script for displaying UAVSAR layer
// this script does not load the UAVSAR layer. loading in done in separate script
function draw_UAVSAR() {
    if(wmsgf9_select != null)
        wmsgf9_select.setMap(null);
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

function drawDygraph(image_uid) {
    if($('.extra-tools-panel').hasClass('inactive'))
    {
        $('.extra-tools-panel').removeClass('inactive').addClass('active');
        var new_height = $('#map-canvas').height() - 160;
        $('#map-canvas').animate({height: new_height + "px"}, 50);
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
            var g2 = new Dygraph(
                document.getElementById("dygraph-LOS"),
                csv,{drawPoints:true,pointSize:2,strokeWidth:0.0,title:'Ground Range Change',
                      titleHeight:20, 
                    xLabelHeight:16,
                      yLabelWidth:16,
                      xlabel:'Distance (km)',
                      ylabel:'Ground Range Change (cm)'}
        );
        });

    $.get("/hgt_query/",
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
            var g2 = new Dygraph(
                document.getElementById("dygraph-HGT"),
                csv,{drawPoints:true,pointSize:2,strokeWidth:0.0,title:'Topographic Height',
                      titleHeight:20, 
                    xLabelHeight:16,
                      yLabelWidth:16,
                      xlabel:'Distance (km)',
                      ylabel:'Topographic Height (m)'}
        );
        });
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
                }
                else {
                    clear_UAVSAR();
                    wmsgf9_select.setMap(null);
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