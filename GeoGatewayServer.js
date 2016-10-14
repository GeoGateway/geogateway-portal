/**
* This is the server-side JavaScript.
*/

//Call requires
var MongoClient=require('mongodb').MongoClient;
var test = require('assert');
var CollectionUtils=require('./collectionUtils').CollectionUtils;
var express=require('express');
var bodyParser=require('body-parser');
var http=require('http');
var exec=require('child_process').exec;
var execSync=require('child_process').execSync;
var spawn=require('child_process').spawn;
//no need for nodejs 0.12 
//need install sync-exec module
//var syncExec = require('sync-exec');
var path=require('path');
var fs=require('fs');
var multiparty=require('multiparty');  //Form multipart form uploads.
var util=require('util');
var mkdirp=require('mkdirp');
var RestClient=require('node-rest-client').Client;
var GridStore=require('mongodb').GridStore;

var Feed=require('feed');

var restClient=new RestClient();

//Place for uploading files.
var config=require('./config');
var geogatewayHomeDir=config.home; //"/Users/mpierce/GeoGateway/";
var baseDestDir=config.baseDestDir; //'html/userUploads/';
var projectBinDir=config.bin; //geogatewayHomeDir+"/bin/";
var baseUserProjectPath=geogatewayHomeDir+baseDestDir;

var uavsarSearchUrl=config.uavsarSearchUrl;
var wmsUrl=config.wmsUrl;
var wmscolorUrl = config.wmscolorUrl;
var losQueryUrl=config.losQueryUrl;
var sldserviceUrl = config.sldserviceUrl;

//Call or prepare constructors
var app=express();
var collectionUtils;
var gridStore;

//Use this to filter out empty data in the LOS query.
var tofind='""';
var regex=new RegExp(tofind,'g');


//Set up MongoClient
var url="mongodb://127.0.0.1:27017/geogatewaydb";  //This should not be hard coded?
MongoClient.connect(url, function(err, db) {
	 test.equal(null, err);
	 collectionUtils=new CollectionUtils(db);
});

app.set('port',process.env.PORT || 3000);

//Use serverOpts to set content types for static content.
var serverOpts= {
    setHeaders: function (res,path,stat) {
//        console.log("Path is "+path);
        if(path.indexOf('.html')>0) {
            res.setHeader('Content-Type','text/html');
        }
        else if(path.indexOf('.css')>0) {
            res.setHeader('Content-Type','text/css');
        }
        else if(path.indexOf('.js')>0) {
            //Note this may need to be changed to text/javascript
            res.setHeader('Content-Type','application/x-javascript');
        }
                
        else {
//            console.log('Sending text/plain');
            res.setHeader('Content-Type','text/plain');
        }
    }
};
//We'll put HTML documents in the local "html" directory
app.use(express.static(__dirname+'/html',serverOpts));
//app.use(express.static(__dirname+'/html'));
app.use(bodyParser.json());

/**
* "Projects" family of functions are used to CRUD documents in a user's collection
*/
//Insert a new document. The document identifier will be generated by MongoDB.
app.post('/projects/:user', function(req,res){
	 //console.log(req.body);
	 //Create the collection if necessary
	 collectionUtils.createCollection(req.params.user, function(error, result){
		  if(error) {
				console.error("Error:",error.stack);
				res.status(400).send(error);
		  }
	 });

	 //Save the document to the collection.
	 collectionUtils.save(req.params.user, req.body, function(error,doc) {
		  handleResponse(error, doc, res);
	 });
});

//Update an existing document. This entirely replaces the ID'd document with the new document
app.put("/projects/:user/:documentId", function(req,res) {
	 collectionUtils.update(req.params.user,req.params.documentId, req.body, function(error, doc){
		  handleResponse(error, doc, res);
	 });
});

//Deletes a specific document.
app.delete("/projects/:user/:documentId", function(req, res) {
	 collectionUtils.delete(req.params.user, req.params.documentId, function(error, doc){
		  if(error) {
				console.error(error.stack);
				res.set('Content-Type','application/json');
				res.status(400).send(error);
		  }
		  else {
				res.set('Content-Type','application/json');
				res.sendStatus(200);
        }
	 });
});
			
//Gets the entire contents of a particular collection.  This is returned as an array.
app.get('/projects/:user', function(req,res){
//    console.log("Getting contents of collection for user "+req.params.user);
	 collectionUtils.findAll(req.params.user, function(error, obj) {
		  if(error) {
				console.error(error.stack);
				res.set('Content-Type','application/json');
				res.status(400).send(error);
		  }
		  else {
				res.set('Content-Type','application/json');
				res.status(200).send(obj);
        }
	 });
});

//Gets the document by its name.
app.get('/projects/:collection/:document', function(req,res){
	 collectionUtils.getById(req.params.collection, req.params.document,function(error,obj){
//		  handleResponse(error, obj, res);
		  if(error) {
				console.error(error.stack);
				res.set('Content-Type','application/json');
				res.status(400).send(error);
		  }
		  else {
				res.set('Content-Type','application/json');
				res.status(200).send(obj);
		  }
	 });
});
//--------------------------------------------------

/**
* NOTECARDS family of functions. These perform CRUD operations for a user's 
* collection of notecards.  
*/
//Insert a new document. The document identifier will be generated by MongoDB.
app.post('/notecards/:user', function(req,res){
	 //console.log(req.body);
	 //Create the collection if necessary
	 collectionUtils.createCollection(req.params.user, function(error, result){
		  if(error) {
				console.error("Error:",error.stack);
				res.status(400).send(error);
		  }
	 });

	 //Save the document to the collection.
	 collectionUtils.save(req.params.user, req.body, function(error,doc) {
		  handleResponse(error, doc, res);
	 });
});

//Update an existing notecard. This entirely replaces the ID'd document with the new document
app.put("/notecards/:user/:documentId", function(req,res) {
	 collectionUtils.update(req.params.user,req.params.documentId, req.body, function(error, doc){
		  handleResponse(error, doc, res);
	 });
});

//Gets the entire contents of a particular collection.  This is returned as an array.
app.get('/notecards/:user', function(req,res){
//    console.log("Getting contents of collection for user "+req.params.user);
	 collectionUtils.findAll(req.params.user, function(error, obj) {
		  if(error) {
				console.error(error.stack);
				res.set('Content-Type','application/json');
				res.status(400).send(error);
		  }
		  else {
				res.set('Content-Type','application/json');
				res.status(200).send(obj);
        }
	 });
});

//Gets the document by its name.
app.get('/notecards/:collection/:document', function(req,res){
	 collectionUtils.getById(req.params.collection, req.params.document,function(error,obj){
//		  handleResponse(error, obj, res);
		  if(error) {
				console.error(error.stack);
				res.set('Content-Type','application/json');
				res.status(400).send(error);
		  }
		  else {
				res.set('Content-Type','application/json');
				res.status(200).send(obj);
		  }
	 });
});
//--------------------------------------------------


/**
* Do uploads of supporting files.
*/
//This version just streams the data directly to a chose file.
app.post('/doUpload/:userName/:projectId',function(req,res){
    var destDir=baseDestDir+"/"+req.params.userName+"/"+req.params.projectId+"/";
    //console.log("File dest dir: "+destDir);
    mkdirp.sync(destDir);
    
    var form=new multiparty.Form();
    //This listens for parts in the multipart request
    form.on('part', function(part){
        //If we get a file, then part.filename is not null.
        if(part.filename!=null) {
            var fullFileName=destDir+part.filename;
            //part is a readableStream, so we can chunk it.
            part.on('data', function(chunk) {
                //Use appendFile since it creates the file if it doesn't already
                //exist and appends since we are chunking.  
                fs.appendFile(fullFileName, chunk,function(err){
                    if(err) throw err;
                });
            });
            //Keep going.
            part.resume();
        }      
    });
    
    form.parse(req);    
    res.redirect('back');
});

//This version sets autoFiles to true, so the file will be written to a tmp dir chosen by 
//the software. It then needs to be manually moved to the proper place.  See
//https://github.com/andrewrk/node-multiparty. 
app.post('doUpload2', function(req,res){
    form.parse(req, function(err, fields, files){
        res.writeHead(200,{'content-type':'text/plain'});
        //console.log(util.inspect(files[0]));
        //console.log(files[0].originalFilename);
        //console.log(files[0].path);
        //console.log(util.inspect(files[0].headers));
        
        //Finally, report back 
        res.write('received upload:\n');
        res.write('Received fields: '+util.inspect(fields));
        res.write('\n\n');
        res.end('Received files:'+util.inspect(files));

    });
});

/**
* The Execute API family calls external processes
*/		  

//Runs the given executable in blocking (exec) mode.  This assumes that the project has 
//been correctly created, with input and output files specfiied.  It will only execute
//things in the project's bin directory, but we need to watch for semicolons.
app.get('/execute/:exec/:collection/:documentId', function (req,res) {
	 collectionUtils.getById(req.params.collection, req.params.documentId,function(error,obj){
		var theExec=projectBinDir+req.params.exec+" "+obj.projectInputFileName+" "+obj.projectOutputFileName;
        //console.log("Execution path:"+theExec);
        var baseWorkDirPath=baseUserProjectPath+obj.projectWorkDir;
        //console.log("baseWorkDirPath:"+baseWorkDirPath);
		  exec(theExec, {"cwd":baseWorkDirPath},function(error, stdout, stderr){
				if(error) {
					 console.error(error.stack);
					 res.status(400).send(error)
				}
				else {
                fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardOut,stdout);
                fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardError,stderr);
				    res.set('Content-Type','application/json');
                res.sendStatus(200);
				}
		  });
	 });
});

//This version uses exec and chains everything in a big if-else block.
app.get('/execute_disloc2/:exec/:collection/:documentId',function(req,res) {
    collectionUtils.getById(req.params.collection, req.params.documentId,function(error,obj){
//        console.log(obj);
        var theExec=projectBinDir+"disloc"+" "+obj.projectInputFileName+" "+obj.projectOutputFileName;
        var baseWorkDirPath=baseUserProjectPath+obj.projectWorkDir;
        exec(theExec,{"cwd":baseWorkDirPath,"maxBuffer":500*1024},function(error,stdout,stderr) {
            if (error!==null) {
                console.error(error);
                res.status(400).send(error);
            }
		      else {
                //Write the disloc output and error
                fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardOut,stdout);
                fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardError,stderr);
            
                //Make the KML
                theExec=projectBinDir+"disloc2kml"+" -i "+obj.projectOutputFileName+" -o "+obj.projectOutputKMLFileName;             
                exec(theExec,{"cwd":baseWorkDirPath},function(error,stdout,stderr){
                    if (error!==null){
                        console.error(error);
                        res.status(400).send(error);
                    }
                    else {
                        // run SARImage with the default parameter
                        theExec=projectBinDir+"SARImage"+" "+obj.projectOutputFileName+" "+obj.insarElevation + " " +obj.insarAzimuth+" "+obj.insarFrequency+" "+'""';
                        exec(theExec,{"cwd":baseWorkDirPath},function(error,stdout,stderr) {
                            if (error!==null){
                                console.error(error);
                                res.status(400).send(error);
                            }
                            else {
                                // run tilemap code
                                // run qsxy2tilt with the default parameter
                                theExec=projectBinDir+"qsxy2tilt"+" -i "+obj.projectOutputFileName+" -o " + obj.projectOutputTiltCSVFileName;
                                exec(theExec,{"cwd":baseWorkDirPath},function(error,stdout,stderr) {
                                    if (error!==null){
                                        console.error(error);
                                        res.status(400).send(error);
                                    }
                                    else {
                                        // run tilemap vis code
                                        // run qsxy2tilt with the default parameter
                                        theExec=projectBinDir+"tiltmap_vis"+" -i " + obj.projectOutputTiltCSVFileName;
                                        exec(theExec,{"cwd":baseWorkDirPath},function(error,stdout,stderr){
                                            if (error!==null){
                                                console.error(error);
                                                res.status(400).send(error);
                                            }
                                            else {
                                                // zip the files for download
                                                theExec= "zip -r " + obj.projectZipFileName + " .";
                                                exec(theExec,{"cwd":baseWorkDirPath},function(error,stdout,stderr){
                                                    if (error!==null){
                                                        console.error(error);
                                                        res.status(400).send(error);
                                                    }
                                                    
                                                    else {
                                                        //We are done.
                                                        res.set('Content-Type','application/json');
                                                        res.sendStatus(200);
                                                        
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
		  });
    });
});


//Runs provided executable in non-blocking (spawn) mode. Should only run things project's
//bin directory. This version requires the command line arguments to be set separately in the
//project's entry (that is, the object retreived from the collection).
app.get('/spawn/:exec/:collection/:documentId', function(req, res) {
	 collectionUtils.getById(req.params.collection, req.params.documentId,function(error,obj){
        //console.log(obj);
        var theExec=req.params.exec;
//        var simplexArgs=['-a','True',obj.projectInputFileName,obj.projectOutputFileName];
        var theArgs=['-a','True']; //obj.cmdLineArgs;
        theArgs.push(obj.projectInputFileName);
        theArgs.push(obj.projectOutputFileName);
        var baseWorkDirPath=baseUserProjectPath+obj.projectWorkDir;
        //console.log("Base workdir:"+baseWorkDirPath);
        var theProcess=spawn(theExec,theArgs,{'cwd':baseWorkDirPath,'env':{PATH:process.env.PATH+':'+projectBinDir}});
        
        //Return to the clienb tub go ahead and keep running.
        //This is a poor man's solution for now.
        res.sendStatus(200);
        
	     theProcess.stdout.on('data', function (data) {
            fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardOut,data);
//		      console.log('Standard Out: "%s"', data);
	     });
	     
	     theProcess.stderr.on('data', function (data) {
            fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardError,data);
		      //console.log('Standard Error: "%s"', data);
	     });
	     
        theProcess.on('error',function(err){
            console.error("Got an error: "+err);
        });

	     theProcess.on('close', function (exitCode) {
            //TODO: This hard coded string depends on correct values both here and in the 
            //client-side controller code.  Must fix.
            //The project object may have been updated by other processes, so 
            //refresh.	 
            //TODO: we need a way to update just one field of a object instead of the entire object.
            collectionUtils.getById(req.params.collection, req.params.documentId,function(error,obj){
                obj.status="Completed";
                collectionUtils.update(req.params.collection,req.params.documentId,obj,function(error,doc){
                    if(error) {
                        console.error("Could not save the updated object");
                    }
                    else {
                        //console.log("Completed Project Metadata",doc);
                    }
                });
            });
//		      console.log('Exit code:', exitCode);
	     });
    })
});


//Runs Simplex in blocking (exec) mode.  This assumes that the project has been correctly created,
//with input and output files specfiied.
app.get('/execute/simplex/:collection/:documentId', function (req,res) {
	 collectionUtils.getById(req.params.collection, req.params.documentId,function(error,obj){
		  var simplexExec=projectBinDir+"simplex -a "+obj.projectInputFileName+" "+obj.projectOutputFileName;
        //console.log("Execution path:"+simplexExec);
        var baseWorkDirPath=baseUserProjectPath+obj.projectWorkDir;
        //console.log("baseWorkDirPath:"+baseWorkDirPath);
		  exec(simplexExec, {"cwd":baseWorkDirPath},function(error, stdout, stderr){
				if(error) {
					 console.error(error.stack);
					 res.status(400).send(error)
				}
				else {
                //                console.log('Standard Out:',stdout);
                //					 console.log('Standard Err:', stderr);
                fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardOut,stdout);
                fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardError,stderr);
				    res.set('Content-Type','application/json');
                res.sendStatus(200);
				}
		  });
	 });
});

//Runs Simplex in non-blocking (spawn) mode.  
app.get('/spawn/simplex/:collection/:documentId', function(req, res) {
	 collectionUtils.getById(req.params.collection, req.params.documentId,function(error,obj){
        var simplexExec="simplex";
        var simplexArgs=['-a','True',obj.projectInputFileName,obj.projectOutputFileName];
        var baseWorkDirPath=baseUserProjectPath+obj.projectWorkDir;
        //console.log("Base workdir:"+baseWorkDirPath);
        var theProcess=spawn(simplexExec,simplexArgs,{'cwd':baseWorkDirPath,'env':{PATH:process.env.PATH+':'+projectBinDir}});
        
        //Return to the clienb tub go ahead and keep running.
        //This is a poor man's solution for now.
        res.sendStatus(200);
        
	     theProcess.stdout.on('data', function (data) {
            fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardOut,data);
//		      console.log('Standard Out: "%s"', data);
	     });
	     
	     theProcess.stderr.on('data', function (data) {
            fs.writeFileSync(baseWorkDirPath+"/"+obj.projectStandardError,data);
//		      console.log('Standard Error: "%s"', data);
	     });
	     
        theProcess.on('error',function(err){
            console.error("Got an error: "+err);
        });

	     theProcess.on('close', function (exitCode) {
            obj.status="Completed";
            collectionUtils.update(req.params.collection,req.params.documentId,obj,function(error,doc){
                if(error) {
                    console.log("Could not save the updated object");
                }
                else {
                    //console.log("State changed to completed");
                    //console.log(doc);
                }
            });
		      //console.log('Exit code:', exitCode);
	     });
    })
});

//Runs the node.js execute function.
app.get('/execute/exec-test', function (req,res) {
	 exec('ls -l', function(error, stdout, stderr){
		  if(error) {
				console.error(error.stack);
				res.status(400).send(error)
		  }
		  else {
				//console.log('Standard Out:',stdout);
				//console.log('Standard Err:', stderr);
				res.status(200).send("OK");
		  }
	 });
});

//Runs the node.js spawn function
app.get('/execute/spawn-test', function(req, res) {
	 var theProcess=spawn('ls', ['-l']);

	 //Note must use the %s formatter
	 theProcess.stdout.on('data', function (data) {
		  //console.log('Standard Out: "%s"', data);
	 });
	 
	 theProcess.stderr.on('data', function (date) {
		  //console.log('Standard Error: "%s"', data);
	 });
	 
	 theProcess.on('close', function (exitCode) {
		  //console.log('Exit code:', exitCode);
		  res.status(200).send('OK');
	 });
								
});
//--------------------------------------------------

/**
* These are GeoServer functions
*/
//The jQuery .get() sends the request parameters as a query ("?"), so we need to extract the 
//value of the query from the request object.
app.get('/uavsar_flight_search/',function(req,res) {
    //TODO: need to do a better job of constructing this URL
    var queryStr=req.query.searchstring;
//    var geoServerUrl='http://gf2.ucs.indiana.edu/quaketables/uavsar/search?searchstring=';
    var geoServerUrl=uavsarSearchUrl+'searchstring=';
    restClient.get(geoServerUrl+queryStr, function(data, response){
        res.status(200).send(data);
    });
});
        
app.get('/uavsar_query/',function(req,res){
//    console.log("Query: ",req.query);
//    var geoServerUrl='http://gf2.ucs.indiana.edu/quaketables/uavsar/search?geometry=';
    var geoServerUrl=uavsarSearchUrl+'geometry=';
    var queryStr=req.query.querystr;
//    console.log(JSON.stringify(queryStr));

    restClient.get(geoServerUrl+queryStr, function(data, response){
        res.status(200).send(data);
    });

});

// has_wms query, this is the temporary solution, shall be removed later
app.get('/has_wms/', function(req,res) {
//    var geoServerUrl = "http://gf8.ucs.indiana.edu:8080/geoserver/InSAR/wms?";
    var geoServerUrl;
    if (req.query.server == 'coloring') {geoServerUrl = wmscolorUrl;} 
    else { geoServerUrl = wmsUrl;}
    var wmsParams = [
        "version=1.1.1",
        "request=DescribeLayer",
        "outputFormat=application/json",
        "exceptions=application/json"
    ];
    var layername = req.query.layername;
    var queryUrl = geoServerUrl + wmsParams.join("&") + "&layers=" + "InSAR:" + layername;
    //console.log(queryUrl);
    
    restClient.get(queryUrl, function(data, response){
        res.status(200).send(data);
    });
});

// SLD service: get_area_minmax for a image
app.get('/get_area_minmax/', function(req,res) {

    var queryUrl = sldserviceUrl + "/getminmax?";

    queryUrl += "image=" + req.query.image + "&extent=" + req.query.extent;
    //console.log(queryUrl);

    restClient.get(queryUrl, function(data, response){
        res.status(200).send(data);
    });

});

app.get('/los_query/',function(req,res) {
//	 var base_url = 'http://gf1.ucs.indiana.edu/insartool/profile?image=InSAR:uid';
	 var base_url = losQueryUrl;
    image_uid=req.query.image_uid;
    image_name = req.query.image_name;
    lat1=req.query.lat1;
    lat2=req.query.lat2;
    lng1=req.query.lng1;
    lng2=req.query.lng2;
	 latlng1 = lng1 + ',' + lat1
	 latlng2 = lng2 + ',' + lat2
    frmt=req.query.format;
    resolution=req.query.resolution;
    method=req.query.method;
    azimuth=req.query.azimuth;
    losLength=req.query.losLength;
    //The below code for averaging needs to be validated.
    average=null;
    if(method=="average"){
        average=req.query.average;
    }
    query_url= base_url + image_uid + '_unw' + '&point=' + 
	     latlng1 + "," + latlng2 + '&format=' + frmt + 
	     '&resolution=' + resolution + '&method=' + method;
    if(average!=null) {
        query_url+="&average="+average;
    }
//    console.log("Query URL: "+query_url);

    // Make the call to GeoServer.
	 // GeoServer will return lines that should have the format "lon, lat, distance, value".  
    // We pass this directly back to the client.
    
//    console.log(query_url);
    restClient.get(query_url, function(data, response){
//        console.log('response: %s',data);
        data=data.toString();
        data=data.replace(regex,'');
        res.setHeader('Content-Type','text/csv');
        res.setHeader('Content-Disposition','attachment; filename="'+image_uid+'".csv"');
        data = image_name+"\n"
            +"start, "+lat1+", "+lng1+"\n"
            +"end, "+lat2+", "+lng2+"\n"
            +"azimuth, "+azimuth+"\n"
            +"length, "+losLength+"\n"
            +"Lat, Lon, Distance (km), Displacement, Elevation Angle\n"
            +data;
//        console.log(data);
        res.status(200).send(data);
    });

});

app.get('/hgt_query/',function(req,res) {
//	 var base_url = 'http://gf1.ucs.indiana.edu/insartool/profile?image=InSAR:uid';
	 var base_url = losQueryUrl;
    image_uid=req.query.image_uid;
    lat1=req.query.lat1;
    lat2=req.query.lat2;
    lng1=req.query.lng1;
    lng2=req.query.lng2;
	 latlng1 = lng1 + ',' + lat1
	 latlng2 = lng2 + ',' + lat2
    frmt=req.query.format;
    resolution=req.query.resolution;
    method=req.query.method;
    //The below code for averaging needs to be validated.
    average=null;
    if(method=="average"){
        average=req.query.average;
    }
    query_url= base_url + image_uid + '_hgt' + '&point=' + 
	     latlng1 + "," + latlng2 + '&format=' + frmt + 
	     '&resolution=' + resolution + '&method=' + method;
    if(average!=null) {
        query_url+="&average="+average;
    }
//    console.log("Query URL: "+query_url);
    restClient.get(query_url, function(data, response){
//        console.log(data);
        res.status(200).send(data);
    });

});

/**
* This method returns all of the public projects for a specific user.  Uses the 'feed' package.
*/
app.get('/rss/:collection',function(req,res) {
    var feed=new Feed({
        title: "GeoGateway Earthquake Model Feeds",
        description: "Published models",
        link: "http://geo-gateway.org",
        image: "http://geo-gateway.org/images/logos/logo.png",
        //Creative commons license.
        author: {
            name: req.params.collection
        }
    });
    
    function getDescription(entry) {
        //The following is specific to Disloc. We will need a way to generalize this.
        //One way is to give more structure to the output to identify what should 
        //be publisehd. 
        var desc="Input File: "+makeAnchor(entry.projectInputFileNameUrl)+"<br>";
        desc+="Output File: "+makeAnchor(entry.projectOutputFileNameUrl)+"<br>";
        desc+="KML File: "+makeAnchor(entry.projectOutputKmlFileNameUrl)+"<br>";
        desc+="SAR KML: "+makeAnchor(entry.projectOutputSARImageKmlFileNameUrl)+"<br>";
        desc+="Tilt Map KML: "+makeAnchor(entry.projectOutputTiltCSVFileNameUrl)+"<br>";
        desc+="Strain Map KML : "+makeAnchor(entry.projectOutputStrainMagFileNameUrl)+"<br>";
        desc+="Project Zip: "+makeAnchor(entry.projectZipFileNameUrl)+"<br>";
        return desc;
    }
    
    function makeAnchor(someUrl){
        return "<a href='"+someUrl+"'>"+someUrl+"</a>";
        
    }

    //Get the items in the collection. This is returend as an array
    collectionUtils.findAll(req.params.collection,function(error,obj) {
        if(error) {
            console.error(error);
        }
        else {
            //The returned obj is an array with most recent entries last,
            //so reverse the order.
            for(var key=obj.length-1;key>=0;key--){
                if(obj[key].permission=="Published") {
                    //TODO: need to format the description
                    feed.addItem({
                        title:obj[key].projectName,
                        description: getDescription(obj[key]), //JSON.stringify(obj[key]),
                        date: obj[key].creationTime,
                        author:{
                            name:req.params.collection
                        }
                    });
                }
            }
        }
        res.set('Content-Type','text/xml');
        res.send(feed.render('rss-2.0'));
    });
});


//--------------------------------------------------

/**
* Local helper functions
*/ 
function myExec() {
};

function mySpawn() {
};

function handleResponse(error, obj, res) {
	 if(error) {
		  console.error(error.stack);
		  res.set('Content-Type','application/json');
		  res.status(400).send(error);
	 }
	 else {
		  //console.log(obj);
		  res.set('Content-Type','application/json');
		  res.status(200).send(obj);
	 }
	 
};
//--------------------------------------------------

/**
*This is the catch-all for bad requests.
*/
app.use(function(req,res) {
	 res.status(404).send();
});
//--------------------------------------------------

/**
* Start the server
*/
http.createServer(app).listen(app.get('port'),function() {
	 console.log('Listening...');
});


