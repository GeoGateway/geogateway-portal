var iconDefImgUrl = "http://maps.google.com/mapfiles/ms/micons/green.png"; 
var iconBaseUrl=  "http://maps.google.com/mapfiles/ms/micons/";
var iconSize = new google.maps.Size(18, 18);
var iconAnchor = new google.maps.Point(1, 10);
var iconOrigin = new google.maps.Point(0, 0);
var marker=[];
var gpsStationState=["green","red","yellow","lightblue","blue"];
var dateSlider;
// var gpsDataBaseUrl="http://gf9.ucs.indiana.edu/daily_rdahmmexec/daily/";
// var gpsDataBaseUrl="http://54.204.111.105:5000/gps?lat_min="
//var gpsDataBaseUrl="http://54.88.85.90:5000/GPS_";
//var gpsDataBaseUrl="http://gf3.ucs.indiana.edu:5000/GPS_";
var gpsDataBaseUrl=http://gf9.ucs.indiana.edu//daily_rdahmmexec/daily/";
// var gpsDataBaseUrl="http://localhost:5000/GPS_";

var selectedDatabase="";
var gpsNetwork;
var currGpsStation;

var lastYearInDb = 2015;
var lastMonthInDb = 12;
var beginDate = new Date(1994,0,1);

// Function similar to loadGpsStations
function updateNetwork(newGpsNetwork) {
    //Set the network and markers to empty or null values.
    //Need to make sure memory is managed well.
//    gpsNetwork=null;
    gpsStations=null;
    selectedDatabase=newGpsNetwork;
    console.log('Changed network to : '+selectedDatabase);

    $("#networkStateDisplayDateNew").prop("disabled",true);
    $("#waitScreen").show();

    var date = new Date();
    var lat_min="";
    var lat_max="";
    var lon_min="";
    var lon_max="";   
    var year=date.getFullYear();
    var month=date.getMonth();
    var day=date.getDate();

    // if (year > lastYearInDb){
    //     year = lastYearInDb;
    //     month = lastMonthInDb;
    //     day = 28;
    // }

    var endDate = new Date(year, month-1, day);

    var myNetworkUrl=gpsDataBaseUrl+selectedDatabase+'/network_meta'
    console.log(myNetworkUrl) 

    $.ajax({
        url: myNetworkUrl, 
        dataType: 'jsonp',
        jsonpCallback: 'callback',
        type: 'GET',
        success: function(result){
            
            console.log("Done loading network meta");

            gpsNetwork = result;

            var lastDateInDb= new Date(result.end_date);
            year=lastDateInDb.getFullYear();
            month=lastDateInDb.getMonth()+1;
            day=lastDateInDb.getDate();

            endDate = new Date(year, month-1, day);
            
            var myTimeSeriesUrl=gpsDataBaseUrl+selectedDatabase+'/time_series?'+
                "lat_min="+lat_min+
                "&lat_max="+lat_max+
                "&long_min="+lon_min+
                "&long_max="+lon_max+
                "&year="+year+
                "&month="+month+
                "&day="+day

            // console.log(myTimeSeriesUrl);

            $.ajax({
                url: myTimeSeriesUrl, 
                dataType: 'jsonp',
                jsonpCallback: 'callback',
                type: 'GET',
                success: function(result){

                    console.log("Done loading stations");
                    // console.log(result);

                    // Set date field
                    $('#networkStateDisplayDateNew').val(month+"/"+day+"/"+year);

                    console.log("Creating markers");
                    myCreateMarkers(result.stations);
                    
                    //Enable date slider
                    $("#waitScreen").hide();
                    $("#networkStateDisplayDateNew").datepicker();
                    $("#networkStateDisplayDateNew").prop("disabled",false);
                    dateSlider=$("#dateSliderNew").slider({
                        slide:mySliderSlideEventHandler,
                        stop: mySliderDateEventHandler,
                        min:beginDate.getTime(),
                        max: endDate.getTime(),
                        value:endDate.getTime()
                    });

                    // $("#result_count").html(result.station_count);
                    // console.log(result);
                    // var txt='';
                    // for (x in result.status){
                    //         txt += result.status[x].station_id+" :: "+result.status[x].status+"<br />";
                    // }
                    // $("#result").html(txt);
                    // console.log(txt)

                }
            });
        }
    });

    
    
    // $.getJSON(gpsNetworkUrl, function(){
    //     console.log("Loading stations");
    // })
    //     .done(function(data) {
    //         console.log("Done loading stations");
    //         gpsNetwork=data;
    //         gpsStations=gpsNetwork.stations;

    //         var endDate=new Date(gpsNetwork.end_date);
    //         var beginDate=new Date(gpsNetwork.begin_date);
    //         //            $('#networkStateDisplayDateNew').val(gpsNetwork.end_date);
    //         $('#networkStateDisplayDateNew').val(endDate.getMonth()+1+"/"+endDate.getDate()+"/"+endDate.getFullYear());
    //         console.log("Creating markers");
    //         createMarkers(gpsNetwork.end_date);

	   //  //Set and display the download link
	   //  $('#gpsDownloadLinkDivNew').show();
	   //  gpsDataUrl=gpsDataBaseUrl+gpsNetwork.data_source+"_"+gpsNetwork.end_date+".zip";
	   //  $('#gpsDownloadLinkNew').attr("href",gpsDataUrl);

	   //  //Enable date slider
    //         $("#waitScreen").hide();
    //         $("#networkStateDisplayDateNew").datepicker();
    //         $("#networkStateDisplayDateNew").prop("disabled",false);
    //         dateSlider=$("#dateSliderNew").slider({
    //             slide:sliderSlideEventHandler,
    //             stop: sliderDateEventHandler,
    //             min:beginDate.getTime(),
    //             max:endDate.getTime(),
    //             value:endDate.getTime()
    //         });
            
           
    //     })
    //     .fail(function(data){
    //         console.log("Failed:");
    //         console.log(data);
    //     })
    //     .always(function(){
    //     });
}

function mySliderSlideEventHandler(event,ui) {
    selectedDate=new Date(ui.value);
    $(this).find('.ui-slider-handle').text(selectedDate.getMonth()+1+"/"+selectedDate.getDate()+"/"+selectedDate.getFullYear());    
}

function mySliderDateEventHandler(event,ui) {
    // console.log("Event:",new Date(ui.value));
    $("#networkStateDisplayDateNew").datepicker("setDate",ui.value);
    updateNetworkStateToDate(ui.value);
    selectedDate=new Date(ui.value);
    $('#networkStateDisplayDateNew').val(selectedDate.getMonth()+1+"/"+selectedDate.getDate()+"/"+selectedDate.getFullYear());    
    $(this).find('.ui-slider-handle').text("");    
}

// Function similar to the getStationState 
function updateNetworkStateToDate(dateAsString){
    var date = new Date(dateAsString);
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();

    var lat_min="";
    var lat_max="";
    var lon_min="";
    var lon_max="";  


    var myurl=gpsDataBaseUrl+selectedDatabase+'/time_series?'+
        "lat_min="+lat_min+
        "&lat_max="+lat_max+
        "&long_min="+lon_min+
        "&long_max="+lon_max+
        "&year="+year+
        "&month="+month+
        "&day="+day

    $.ajax({
        url: myurl, 
        dataType: 'jsonp',
        jsonpCallback: 'callback',
        type: 'GET',
        success: function(result){

            // console.log(result);

            // Set date field
            $('#networkStateDisplayDateNew').val(month+"/"+day+"/"+year);

            myCreateMarkers(result.stations);
            
            // //Enable date slider
            // $("#waitScreen").hide();
            // $("#networkStateDisplayDateNew").datepicker();
            // $("#networkStateDisplayDateNew").prop("disabled",false);
            // dateSlider=$("#dateSliderNew").slider({
            //     slide:mySliderSlideEventHandler,
            //     stop: mySliderDateEventHandler,
            //     min:beginDate.getTime(),
            //     max: endDate.getTime(),
            //     value:endDate.getTime()
        }

    });
}

// Function similar to createMarkers
function myCreateMarkers(gpsStations) {
    // var theDate=new Date(theDateString);

    //Remove any old markers from the map.  These were created for networks with
    //different sizes than the current one, so do this before iterating over the
    //new stations.
    for(var i=0; i<marker.length;i++){
        marker[i].setMap(null);
    }

    $.each(gpsStations, function(i, gpsStation) {


        var myLatLng=new google.maps.LatLng(gpsStation.lat,gpsStation.lon);
        var stationState=gpsStationState[gpsStation.status];
        var iconImgUrl=iconBaseUrl+stationState+".png";
        var icon=new google.maps.MarkerImage(iconImgUrl, iconSize, iconOrigin, iconAnchor, iconSize);                
        // console.log(icon);
        //Add the marker
        marker[i]=new google.maps.Marker({
            position:myLatLng,
            icon: icon,
            clickable: true,
            title:gpsStation.station_id,
            map:mapA
        });
        
        marker[i].addListener('click',function(){

            // Make ajax call to get data for this particular station
            myStationUrl = gpsDataBaseUrl+selectedDatabase+
                '/station_meta?station_id_to_find='+ gpsStation.station_id;
            console.log(myStationUrl);

            $.ajax({
                url: myStationUrl, 
                dataType: 'jsonp',
                jsonpCallback: 'callback',
                type: 'GET',
                success: function(result){

                    currGpsStation = result;
                    // currGpsStation.pro_dir = 'daily_project_1NSU_2016-11-06'
                    // currGpsStation.DygraphsInputFile = 'daily_project_1NSU_2016-11-06.dygraphs.js';

                    console.log("Found station meta data");
                    console.log(currGpsStation);
                    // console.log(gpsNetwork.server_url+"/"+currGpsStation.pro_dir+"/"+currGpsStation.DygraphsInputFile);
                }
            });

            setTimeout(function() {

            	var recoverdDygraph = currGpsStation.d_0 +'}'+  
            			currGpsStation.d_1 + '}'+ 
            			currGpsStation.d_2 + '}'+ 
            			currGpsStation.d_3 + '}'+ 
            			currGpsStation.d_4 + '}'+ 
            			currGpsStation.d_5 + '}';

	            var dygraphsHtml="<html><body>";
	              dygraphsHtml+="<div><b>Data Set:</b> "+gpsNetwork.data_source+"<br/><b>Station ID:</b> "+currGpsStation._id+" <b>Lat:</b> "+(new Number(currGpsStation.lat)).toFixed(5)+" <b>Lon:</b> "+(new Number(currGpsStation.long)).toFixed(5)+"<\/div>";
	              dygraphsHtml+="Click and drag to zoom plots vertically or horizontally.  Double-click the plot to reset to the default zoom level.";
	              dygraphsHtml+="<br/>";
	              dygraphsHtml+="<script src='http://cdnjs.cloudflare.com/ajax/libs/dygraph/1.1.0/dygraph-combined.js'>";
	              dygraphsHtml+="<\/script>";
	              dygraphsHtml+="<script> "+recoverdDygraph+"<\/script>";
	              // dygraphsHtml+="<script src='"+gpsNetwork.server_url+"/"+currGpsStation.pro_dir+"/"+currGpsStation.DygraphsInputFile+"'><\/script>";
	              dygraphsHtml+="<script src='http://dygraphs.com/tests/data.js'><\/script>";
	              dygraphsHtml+="<div id='plotDiv1' style='width:800px;height:200px'><\/div>";
	              dygraphsHtml+="<br/>";
	              dygraphsHtml+="<div id='plotDiv2' style='width:800px;height:200px'><\/div>";
	              dygraphsHtml+="<br/>";
	              dygraphsHtml+="<div id='plotDiv3' style='width:800px;height:200px'><\/div>";
	              //Use mm displacements for UNAVCO data types.  Note significant figures change from below
	              dygraphsHtml+="<script type='text/javascript'>";
	              dygraphsHtml+="var graphs=[]\;"
	              dygraphsHtml+="var plot1, plot2, plot3\;";
	            if(gpsNetwork.data_source=='unavcoPboFill' || gpsNetwork.data_source=='unavcoNucleusFill') {
	            //TODO: East and North are reversed. Need to fix this.Below is a bandaid
	                  dygraphsHtml+="plot1=new Dygraph(document.getElementById('plotDiv1'),data_north_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"East Displacement (m)\",yAxisLabelWidth:150,sigFigs:4})\;";
	                  dygraphsHtml+="plot2=new Dygraph(document.getElementById('plotDiv2'),data_east_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"North Displacement (m)\",yAxisLabelWidth:150,sigFigs:4})\;";
	                  dygraphsHtml+="plot3=new Dygraph(document.getElementById('plotDiv3'),data_up_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"Height Displacement (m)\", yAxisLabelWidth:150,sigFigs:4})\;";
	              }
	              else {
	                  //The other cases
	              //TODO: East and North are reversed. Need to fix this.Below is a bandaid
	                   dygraphsHtml+="plot1=new Dygraph(document.getElementById('plotDiv1'),data_north,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"East Displacement (mm)\",yAxisLabelWidth:100,sigFigs:3})\;";
	                   dygraphsHtml+="plot2=new Dygraph(document.getElementById('plotDiv2'),data_east,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"North Displacement (mm)\",yAxisLabelWidth:100,sigFigs:3})\;";
	                   dygraphsHtml+="plot3=new Dygraph(document.getElementById('plotDiv3'),data_up,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"Height (mm)\", yAxisLabelWidth:100,sigFigs:3})\;";
	              }
	              dygraphsHtml+="graphs.push(plot1)\;";
	              dygraphsHtml+="graphs.push(plot2)\;";
	              dygraphsHtml+="graphs.push(plot3)\;";
	              dygraphsHtml+="function zoomCallback(minDate,maxDate){for (var i=0\;i<graphs.length\;i++){graphs[i].updateOptions({dateWindow:[minDate,maxDate]})}}\;";
	              dygraphsHtml+="<\/script>";
	            
	            dygraphsHtml+="</body></html>";
	            
	            var windowName=currGpsStation._id+"-Dygraphs";
	              var newWin = window.open("", windowName, "width=850,height=750");
	              newWin.document.writeln(dygraphsHtml);
	              newWin.document.title = currGpsStation._id;
	              newWin.document.close();

            }, 1000);
            
        });
        
    });
}

// //Pass the date in as a string so that we have control over how the date objects are created.
// function createMarkers(theDateString) {
//     var theDate=new Date(theDateString);

//     //Remove any old markers from the map.  These were created for networks with
//     //different sizes than the current one, so do this before iterating over the
//     //new stations.
//     for(var i=0; i<marker.length;i++){
//         marker[i].setMap(null);
//     }

//     gpsStations=gpsNetwork.stations;
//     $.each(gpsStations, function(i, gpsStation) {
//         var myLatLng=new google.maps.LatLng(gpsStation.lat,gpsStation.long);
//         var stationState=getStationState(theDate,gpsStation);
//         var iconImgUrl=iconBaseUrl+stationState+".png";
//         var icon=new google.maps.MarkerImage(iconImgUrl, iconSize, iconOrigin, iconAnchor, iconSize);                
//         //Add the marker
//         marker[i]=new google.maps.Marker({
//             position:myLatLng,
//             icon: icon,
//             clickable: true,
//             title:gpsStation.id,
//             map:mapA
//         });
        
//         marker[i].addListener('click',function(){
//             var dygraphsHtml="<html><body>";
// 		      dygraphsHtml+="<div><b>Data Set:</b> "+gpsNetwork.data_source+"<br/><b>Station ID:</b> "+gpsStation.id+" <b>Lat:</b> "+(new Number(gpsStation.lat)).toFixed(5)+" <b>Lon:</b> "+(new Number(gpsStation.long)).toFixed(5)+"<\/div>";
// 		      dygraphsHtml+="Click and drag to zoom plots vertically or horizontally.  Double-click the plot to reset to the default zoom level.";
// 		      dygraphsHtml+="<br/>";
//             dygraphsHtml+="<script src='http://cdnjs.cloudflare.com/ajax/libs/dygraph/1.1.0/dygraph-combined.js'>";
// 		      dygraphsHtml+="<\/script>";
// 		      dygraphsHtml+="<script src='"+gpsNetwork.server_url+"/"+gpsStation.pro_dir+"/"+gpsStation.DygraphsInputFile+"'><\/script>";
// 		      dygraphsHtml+="<script src='http://dygraphs.com/tests/data.js'><\/script>";
// 		      dygraphsHtml+="<div id='plotDiv1' style='width:800px;height:200px'><\/div>";
// 		      dygraphsHtml+="<br/>";
// 		      dygraphsHtml+="<div id='plotDiv2' style='width:800px;height:200px'><\/div>";
// 		      dygraphsHtml+="<br/>";
// 		      dygraphsHtml+="<div id='plotDiv3' style='width:800px;height:200px'><\/div>";
// 		      //Use mm displacements for UNAVCO data types.  Note significant figures change from below
// 		      dygraphsHtml+="<script type='text/javascript'>";
// 		      dygraphsHtml+="var graphs=[]\;"
// 		      dygraphsHtml+="var plot1, plot2, plot3\;";
// 	    if(gpsNetwork.data_source=='unavcoPboFill' || gpsNetwork.data_source=='unavcoNucleusFill') {
// 		//TODO: East and North are reversed. Need to fix this.Below is a bandaid
// 		          dygraphsHtml+="plot1=new Dygraph(document.getElementById('plotDiv1'),data_north_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"East Displacement (m)\",yAxisLabelWidth:150,sigFigs:4})\;";
// 		          dygraphsHtml+="plot2=new Dygraph(document.getElementById('plotDiv2'),data_east_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"North Displacement (m)\",yAxisLabelWidth:150,sigFigs:4})\;";
// 		          dygraphsHtml+="plot3=new Dygraph(document.getElementById('plotDiv3'),data_up_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"Height Displacement (m)\", yAxisLabelWidth:150,sigFigs:4})\;";
// 		      }
// 		      else {
// 		          //The other cases
// 			  //TODO: East and North are reversed. Need to fix this.Below is a bandaid
// 			       dygraphsHtml+="plot1=new Dygraph(document.getElementById('plotDiv1'),data_north,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"East Displacement (mm)\",yAxisLabelWidth:100,sigFigs:3})\;";
// 			       dygraphsHtml+="plot2=new Dygraph(document.getElementById('plotDiv2'),data_east,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"North Displacement (mm)\",yAxisLabelWidth:100,sigFigs:3})\;";
// 			       dygraphsHtml+="plot3=new Dygraph(document.getElementById('plotDiv3'),data_up,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"Height (mm)\", yAxisLabelWidth:100,sigFigs:3})\;";
// 		      }
// 		      dygraphsHtml+="graphs.push(plot1)\;";
// 		      dygraphsHtml+="graphs.push(plot2)\;";
// 		      dygraphsHtml+="graphs.push(plot3)\;";
// 		      dygraphsHtml+="function zoomCallback(minDate,maxDate){for (var i=0\;i<graphs.length\;i++){graphs[i].updateOptions({dateWindow:[minDate,maxDate]})}}\;";
// 		      dygraphsHtml+="<\/script>";
            
//             dygraphsHtml+="</body></html>";
            
//             var windowName=gpsStation.id+"-Dygraphs";
// 		      var newWin = window.open("", windowName, "width=850,height=750");
// 		      newWin.document.writeln(dygraphsHtml);
// 		      newWin.document.title = gpsStation.id;
// 		      newWin.document.close();
//         });
        
//     });
// }

// function getStationState(date,gpsStation) {

//     var lat_min=gpsStation.lat;
//     var lat_max=gpsStation.lat;
//     var lon_min=gpsStation.long;
//     var lon_max=gpsStation.long;   
//     var year=date.getFullYear();
//     var month=date.getMonth();
//     var day=date.getDate();

//     year = (year > lastYearInDb) ? lastYearInDb : year;
//     month = (month > lastMonthInDb) ? lastMonthInDb : month;


//     var myurl="http://54.204.111.105:5000/gps?lat_min="+lat_min+
//         "&lat_max="+lat_max+
//         "&long_min="+lon_min+
//         "&long_max="+lon_max+
//         "&year="+year+
//         "&month="+month+
//         "&day="+day

//     // console.log(myurl);
//     var theState=0;

//     $.ajax({
//         url: myurl, 
//         dataType: 'jsonp',
//         jsonpCallback: 'callback',
//         type: 'GET',
//         success: function(result){

//             // console.log(result);
//             theState=result.status.status;
//             // $("#result_count").html(result.station_count);
//             // console.log(result);
//             // var txt='';
//             // for (x in result.status){
//             //         txt += result.status[x].station_id+" :: "+result.status[x].status+"<br />";
//             // }
//             // $("#result").html(txt);
//             // console.log(txt)
//         }
//     });

//     return theState;

// };
// function getStationState(date,gpsStation) {
// //    console.log("Station state: ",date,gpsStation);
//     var theState=gpsStationState[0];  //This is the default.
//     var today=new Date(date.toString());
//     var lastMonth=new Date(date.toString());
//     var dayBefore=new Date(date.toString());
//     lastMonth.setDate(date.getDate()-30);
//     dayBefore.setDate(date.getDate()-1);
//     var statusChanges=gpsStation.status_changes;
//     var noDataDates=gpsStation.time_nodata;

//     var earliestDataDate=new Date(gpsStation.start_date);
//     var dataOnDate=checkDateForData(gpsStation.id,date,noDataDates);
    
//     //Hopefully this big if-else construction correctly captures all the case.
//     //It can be simplified later.

//     //Provided date is before any data available for that station, so state is light blue
//     if(today < earliestDataDate) {
//         theState=gpsStationState[3];  //light blue        
//     }

//     //Date falls within data range, there are no status changes, and data is available on date
//     else if(today > earliestDataDate && statusChanges.length==0 && dataOnDate==true) {
//         theState=gpsStationState[0];  //green
//     }

//     //Date falls within data range, there are no state changes, and no data on selected date.
//     else if(today > earliestDataDate && statusChanges.length==0 && dataOnDate==false) {
//         theState=gpsStationState[3];  //light blue
//     }

//     //We have data on the date, but it proceeds the earliest state change
//     else if(today.getTime() < new Date(statusChanges[0].date)) {
//         theState=gpsStationState[0];  //green
//     }
//     //See if the date falls within 1 day or 1 month of a state change.
//     else if(statusChanges.length > 0) {
//         //Get nearest preceding state change date.
//         stateLastDate=getPrecedingStateChange(gpsStation.id,date,statusChanges);
        
//         //See if state change was yesterday.
//         if(stateLastDate.getTime() > dayBefore.getTime()) {
//             theState=gpsStationState[1];  //red
//         }
//         //See if the station has changed state in between the
//         //selected date and 30 days prior to the selected date.
//         else if(stateLastDate.getTime() >= lastMonth.getTime()
//                 && stateLastDate.getTime() <= date.getTime()) {
//             //See if we have no data within 24 hours of the selected date.            
//             if(dataOnDate==false) {
//                 //Data is missing within last 24 hours and state has changed within
//                 //last 30 days.
//                 theState=gpsStationState[4];  //blue
//             }
//             else {
//                 //We have data on the date and state has changed within a 30 day window.
//                 theState=gpsStationState[2]; //yellow
//             }
//         }
//         //No data is available on selected date for this station, and station is
//         //not within either the 1 day or 30 day window.
//         else if(dataOnDate==false) {
//             theState=gpsStationState[3];  //light blue
//         }
//     }
    
//     return theState;
// };

// //Selected date should be a string.
// function getNetworkStateOnDate(selectedDate){
//     //    console.log("Selected date:"+selectedDate);
//     createMarkers(selectedDate);
    
// };

// //Would be nice to throw an exception here 
// function getPrecedingStateChange(stationId,selectedDate,statusChanges) {
//     var stateLastDate;
//     var latestPossibleDate=new Date(statusChanges[statusChanges.length-1].date);
//     var earliestPossibleDate=new Date(statusChanges[0].date);

//     //This should actually throw an erorr since there is no earlier state change.
//     if(selectedDate.getTime() <= earliestPossibleDate.getTime()) {
// //        stateLastDate=earliestPossibleDate;
//         stateLastDate=selectedDate;
//     }
//     else if(selectedDate.getTime() >= latestPossibleDate.getTime()) {
//         stateLastDate=latestPossibleDate;
//     }
//     else {
//         for(var i=statusChanges.length-1; i>0; i--) {
//             var stateChangeDate1=new Date(statusChanges[i-1].date);
//             var stateChangeDate2=new Date(statusChanges[i].date);
//             //The last state change date to find is the one
//             //on or before the curren date.
//             if(selectedDate >= stateChangeDate1 
//                && selectedDate < stateChangeDate2) {
//                 stateLastDate=stateChangeDate1;
//                 //Dates are in order, so we can stop
//                 break;
//             }
//         }
//     }
// //    console.log(stationId,selectedDate.toDateString(),",",stateLastDate.toDateString(),",",earliestPossibleDate.toDateString(),",",latestPossibleDate.toDateString());
//     return stateLastDate;
// };

// function checkDateForData(station,selectedDate,noDataDates) {
//     var dataOnDate=true;
//     //Selected date is after the last no-data date.
//     if(selectedDate > noDataDates[noDataDates.length-1].to) {
//         dataOnDate=true;
//     }
//     //Otherwise, check each no-data interval to see if the date falls within.
//     else {
//         for (var i=0; i<noDataDates.length; i++) {
//             var startDate=new Date(noDataDates[i].from);
//             var endDate=new Date(noDataDates[i].to);
            
//             //This only works for data sets after the start date.
//             if(startDate <= selectedDate && endDate >= selectedDate) {
//                 dataOnDate=false;
//                 break;
//             }
//         }
//     }
//     return dataOnDate;
// }


