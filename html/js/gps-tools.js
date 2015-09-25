//var gpsUrl="http://gf9.ucs.indiana.edu/daily_rdahmmexec/daily/UNAVCO_NUCLEUS_FILL.json";
//var gpsUrl="http://gf9.ucs.indiana.edu/daily_rdahmmexec/daily/UNR_FID_FILL.json";
var gpsUrl="http://gf9.ucs.indiana.edu/daily_rdahmmexec/daily/WNAM_Clean_DetrendNeuTimeSeries_comb_FILL.json";
var gpsNetwork;
var gspStations;
var iconDefImgUrl = "http://maps.google.com/mapfiles/ms/micons/green.png"; 
var iconBaseUrl=  "http://maps.google.com/mapfiles/ms/micons/";
var iconSize = new google.maps.Size(18, 18);
var iconAnchor = new google.maps.Point(1, 10);
var iconOrigin = new google.maps.Point(0, 0);
var marker=[];
var gpsStationState=["green","red","yellow","lightblue","blue"];


function loadGpsStations() {
    //Need to make sure memory is managed well.
    gpsNetwork=null;
    gpsStations=null;
    marker=[];
    
    $.getJSON(gpsUrl, function(){
        console.log("Started");
    })
        .done(function(data) {
            gpsNetwork=data;
            console.log("Done");
            console.log(gpsNetwork.Filters);
            console.log("Center latitude:"+gpsNetwork.center_latitude);
            gpsStations=gpsNetwork.stations;
            
            $.each(gpsStations, function(i, gpsStation) {
                //          console.log(gpsStation.lat,gpsStation.long);
                var myLatLng=new google.maps.LatLng(gpsStation.lat,gpsStation.long);
                var theDate=new Date();
                var stationState=getStationState(theDate,gpsStation);
                var iconImgUrl=iconBaseUrl+stationState+".png";
                var icon=new google.maps.MarkerImage(iconImgUrl, iconSize, iconOrigin, iconAnchor, iconSize);                
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
        })
        .fail(function(data){
            console.log("Failed:");
            console.log(data);
        })
        .always(function(){
            console.log("Completed one way or the other");
        });

    function getStationState(date,gpsStation) {
        var theState=gpsStationState[0];  //This is the default.
        var lastMonth=new Date();
        var dayBefore=new Date();
        lastMonth.setDate(date.getDate()-30);
        dayBefore.setDate(date.getDate()-1);
        var statusChanges=gpsStation.status_changes;
        var noDataDates=gpsStation.time_nodata;
        if(statusChanges.length > 0) {
            stateLastDate=new Date(statusChanges[statusChanges.length-1].date);
//            console.log(stateLastDate);
//            console.log("Today?",stateLastDate==date);
//            console.log("30 days ago?",date,lastMonth.getTime(),stateLastDate.getTime(),stateLastDate>=lastMonth);
            if(stateLastDate.getTime() >= dayBefore.getTime() ) {
                theState=gpStationState[1];  //red
            }
            if(stateLastDate.getTime() >= lastMonth.getTime()) {
                theState=gpsStationState[2]; //yellow
            }
        }
        return theState;
    };
}

