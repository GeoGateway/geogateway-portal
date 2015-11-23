var gpsNetwork;
var gspStations;
var iconDefImgUrl = "http://maps.google.com/mapfiles/ms/micons/green.png"; 
var iconBaseUrl=  "http://maps.google.com/mapfiles/ms/micons/";
var iconSize = new google.maps.Size(18, 18);
var iconAnchor = new google.maps.Point(1, 10);
var iconOrigin = new google.maps.Point(0, 0);
var marker=[];
var gpsStationState=["green","red","yellow","lightblue","blue"];
var dateSlider;


function loadGpsStations(gpsNetworkUrl) {
    //Set the network and markers to empty or null values.
    //Need to make sure memory is managed well.
//    gpsNetwork=null;
    gpsStations=null;
    console.log(gpsNetworkUrl);
    $("#networkStateDisplayDate").prop("disabled",true);
    $("#waitScreen").show();
    
    $.getJSON(gpsNetworkUrl, function(){
        console.log("Loading stations");
    })
        .done(function(data) {
            console.log("Done loading stations");
            gpsNetwork=data;
            gpsStations=gpsNetwork.stations;

            var endDate=new Date(gpsNetwork.end_date);
            var beginDate=new Date(gpsNetwork.begin_date);
            //            $('#networkStateDisplayDate').val(gpsNetwork.end_date);
            $('#networkStateDisplayDate').val(endDate.getMonth()+1+"/"+endDate.getDate()+"/"+endDate.getFullYear());
            console.log("Creating markers");
            createMarkers(gpsNetwork.end_date);
            $("#waitScreen").hide();
            $("#networkStateDisplayDate").datepicker();
            $("#networkStateDisplayDate").prop("disabled",false);
            dateSlider=$("#dateSlider").slider({
                slide:sliderSlideEventHandler,
                stop: sliderDateEventHandler,
                min:beginDate.getTime(),
                max:endDate.getTime(),
                value:endDate.getTime()
            });
            
           
        })
        .fail(function(data){
            console.log("Failed:");
            console.log(data);
        })
        .always(function(){
        });
}

function sliderSlideEventHandler(event,ui) {
    selectedDate=new Date(ui.value);
    $(this).find('.ui-slider-handle').text(selectedDate.getMonth()+1+"/"+selectedDate.getDate()+"/"+selectedDate.getFullYear());    
}

function sliderDateEventHandler(event,ui) {
    console.log("Event:",new Date(ui.value));
    $("#networkStateDisplayDate").datepicker("setDate",ui.value);
    getNetworkStateOnDate(ui.value);
    selectedDate=new Date(ui.value);
    $('#networkStateDisplayDate').val(selectedDate.getMonth()+1+"/"+selectedDate.getDate()+"/"+selectedDate.getFullYear());    
    $(this).find('.ui-slider-handle').text("");    

}

//Pass the date in as a string so that we have control over how the date objects are created.
function createMarkers(theDateString) {
    var theDate=new Date(theDateString);

    //Remove any old markers from the map.  These were created for networks with
    //different sizes than the current one, so do this before iterating over the
    //new stations.
    for(var i=0; i<marker.length;i++){
        marker[i].setMap(null);
    }

    gpsStations=gpsNetwork.stations;
    $.each(gpsStations, function(i, gpsStation) {
        var myLatLng=new google.maps.LatLng(gpsStation.lat,gpsStation.long);
        var stationState=getStationState(theDate,gpsStation);
        var iconImgUrl=iconBaseUrl+stationState+".png";
        var icon=new google.maps.MarkerImage(iconImgUrl, iconSize, iconOrigin, iconAnchor, iconSize);                
        //Add the marker
        marker[i]=new google.maps.Marker({
            position:myLatLng,
            icon: icon,
            clickable: true,
            title:gpsStation.id,
            map:mapA
        });
        
        marker[i].addListener('click',function(){
            var dygraphsHtml="<html><body>";
		      dygraphsHtml+="<div><b>Data Set:</b> "+gpsNetwork.data_source+"<br/><b>Station ID:</b> "+gpsStation.id+" <b>Lat:</b> "+(new Number(gpsStation.lat)).toFixed(5)+" <b>Lon:</b> "+(new Number(gpsStation.long)).toFixed(5)+"<\/div>";
		      dygraphsHtml+="Click and drag to zoom plots vertically or horizontally.  Double-click the plot to reset to the default zoom level.";
		      dygraphsHtml+="<br/>";
            dygraphsHtml+="<script src='http://cdnjs.cloudflare.com/ajax/libs/dygraph/1.1.0/dygraph-combined.js'>";
		      dygraphsHtml+="<\/script>";
		      dygraphsHtml+="<script src='"+gpsNetwork.server_url+"/"+gpsStation.pro_dir+"/"+gpsStation.DygraphsInputFile+"'><\/script>";
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
		          dygraphsHtml+="plot1=new Dygraph(document.getElementById('plotDiv1'),data_east_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"East Displacement (m)\",yAxisLabelWidth:150,sigFigs:4})\;";
		          dygraphsHtml+="plot2=new Dygraph(document.getElementById('plotDiv2'),data_north_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"North Displacement (m)\",yAxisLabelWidth:150,sigFigs:4})\;";
		          dygraphsHtml+="plot3=new Dygraph(document.getElementById('plotDiv3'),data_up_disp,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"Height Displacement (m)\", yAxisLabelWidth:150,sigFigs:4})\;";
		      }
		      else {
		          //The other cases
			       dygraphsHtml+="plot1=new Dygraph(document.getElementById('plotDiv1'),data_east,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"North Displacement (mm)\",yAxisLabelWidth:100,sigFigs:3})\;";
			       dygraphsHtml+="plot2=new Dygraph(document.getElementById('plotDiv2'),data_north,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"East Displacement (mm)\",yAxisLabelWidth:100,sigFigs:3})\;";
			       dygraphsHtml+="plot3=new Dygraph(document.getElementById('plotDiv3'),data_up,{drawPoints:true, strokeWidth:0.0, zoomCallback:zoomCallback, title:\"Height (mm)\", yAxisLabelWidth:100,sigFigs:3})\;";
		      }
		      dygraphsHtml+="graphs.push(plot1)\;";
		      dygraphsHtml+="graphs.push(plot2)\;";
		      dygraphsHtml+="graphs.push(plot3)\;";
		      dygraphsHtml+="function zoomCallback(minDate,maxDate){for (var i=0\;i<graphs.length\;i++){graphs[i].updateOptions({dateWindow:[minDate,maxDate]})}}\;";
		      dygraphsHtml+="<\/script>";
            
            dygraphsHtml+="</body></html>";
            
            var windowName=gpsStation.id+"-Dygraphs";
		      var newWin = window.open("", windowName, "width=850,height=750");
		      newWin.document.writeln(dygraphsHtml);
		      newWin.document.title = gpsStation.id;
		      newWin.document.close();
        });
        
    });
}

function getStationState(date,gpsStation) {
    var theState=gpsStationState[0];  //This is the default.
    var lastMonth=new Date(date.toString());
    var dayBefore=new Date(date.toString());
    lastMonth.setDate(date.getDate()-30);
    dayBefore.setDate(date.getDate()-1);
    var statusChanges=gpsStation.status_changes;
    var noDataDates=gpsStation.time_nodata;

    if(statusChanges.length > 0) {

        //Get nearest preceding state change date.
        stateLastDate=getPrecedingStateChange(gpsStation.id,date,statusChanges);

        //See if selected date falls within a time with no data.
        var dataOnDate=checkDateForData(gpsStation.id,date,noDataDates);

//        if(stateLastDate.toDateString() == date.toDateString() ) {
        if(stateLastDate.getTime() > dayBefore.getTime()) {
            theState=gpsStationState[1];  //red
        }
        //See if the station has changed state in between the
        //selected date and 30 days prior to the selected date.
        else if(stateLastDate.getTime() >= lastMonth.getTime()
                && stateLastDate.getTime() <= date.getTime()) {
            //See if we have no data within 24 hours of the selected date.            
            if(dataOnDate==false) {
                //Data is missing within last 24 hours and state has changed within
                //last 30 days.
                theState=gpsStationState[4];  //blue
            }
            else {
                //We have data on the date and state has changed within a 30 day window.
                theState=gpsStationState[2]; //yellow
            }
        }
        //No data is available on selected date
        else if(dataOnDate==false) {
            theState=gpsStationState[3];  //light blue
        }
    }
//    console.log("Station:",gpsStation.id,", Statelastdate:",stateLastDate,", Selected Date:",date,", State:",theState);
    return theState;
};

//Selected date should be a string.
function getNetworkStateOnDate(selectedDate){
//    console.log("Selected date:"+selectedDate);
    createMarkers(selectedDate);
};

//Would be nice to throw an exception here 
function getPrecedingStateChange(stationId,selectedDate,statusChanges) {
    var stateLastDate;
    var latestPossibleDate=new Date(statusChanges[statusChanges.length-1].date);
    var earliestPossibleDate=new Date(statusChanges[0].date);
//   console.log("debug:",stationId,selectedDate,latestPossibleDate.toDateString(),latestPossibleDate,statusChanges[statusChanges.length-1].date);
    if(selectedDate.getTime() <= earliestPossibleDate.getTime()) {
        stateLastDate=earliestPossibleDate;
    }
    else if(selectedDate.getTime() >= latestPossibleDate.getTime()) {
        stateLastDate=latestPossibleDate;
    }
    else {
        for(var i=statusChanges.length-1; i>0; i--) {
            var stateChangeDate1=new Date(statusChanges[i-1].date);
            var stateChangeDate2=new Date(statusChanges[i].date);
            //The last state change date to find is the one
            //on or before the curren date.
            if(selectedDate >= stateChangeDate1 
               && selectedDate < stateChangeDate2) {
                stateLastDate=stateChangeDate1;
                //Dates are in order, so we can stop
                break;
            }
        }
    }
//    console.log(stationId,selectedDate.toDateString(),",",stateLastDate.toDateString(),",",earliestPossibleDate.toDateString(),",",latestPossibleDate.toDateString());
    return stateLastDate;
};

function checkDateForData(station,selectedDate,noDataDates) {
    var dataOnDate=true;
    for (var i=0; i<noDataDates.length; i++) {
        var startDate=new Date(noDataDates[i].from);
        var endDate=new Date(noDataDates[i].to);

        if(startDate <= selectedDate && endDate >= selectedDate) {
            dataOnDate=false;
            break;
        }
    }
//    console.log(station,startDate.toDateString(), endDate.toDateString(), selectedDate.toDateString(),dataOnDate);    
    return dataOnDate;
}