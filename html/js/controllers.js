'use strict'; 

var UserProjectApp=angular.module('UserProjectApp',['ngRoute','ngCookies','GeoGatewayServices']);

UserProjectApp.config(['$routeProvider',function ($routeProvider) {
    $routeProvider
        .when('/login', {
            controller: 'LoginController',
            templateUrl: 'Login.html',
            hideMenus: true
        })

        .when('/loginGeo', {
            controller: 'LoginController',
            templateUrl: 'main.html'
        })
    
        .when('/projects', {
            controller: 'UserProjectController',
            templateUrl: 'UserProjects.html'
        })
    
        .when('/view', {
            controller: 'EditProjectController',
            templateUrl: 'ViewProjectDetails.html'
        })
    
        .when('/submit', {
            controller: 'EditProjectController',
            templateUrl: 'SubmitProject.html'
        })
    
        .otherwise({ redirectTo: '/login' });
}]);

UserProjectApp.run(['$rootScope','$location','$cookieStore','$http',function ($rootScope, $location, $cookieStore, $http) {
    
//    console.log("userProjectApp.run() called");
//    $rootScope.globals = $cookieStore.get('globals') || {};
    $rootScope.globals={};
    if ($rootScope.globals.currentUser) {
        //Current user is set
        console.log("User is set:"+$rootScope.globals.currentUser.username);
    }
    else {
        $rootScope.globals = {
            //Anonymous user can still do stuff.
            currentUser: {
                username: "anonymous",
                password: ""
            },
            currentProject:{}
        }
    };
        
        //Create an anonymous project for unauthenticated users.
//        var newProject={};
//        newProject.projectName=$rootScope.globals.currentProject.projectName;
//        //Need to see if necessary to stringify newProject or if it can be passed directly.
//        //        console.log("Creating anonymous project");
//        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
//            success(function(project){
//                console.log("Anon project created: "+project._id);
//                //Set or update the current project
//                $rootScope.globals.currentProject=project;
//                $rootScope.globals.currentProject.status="New"; 
//            }).
//            error(function(data){
//                console.error("Could not create the new project");
//            });

//        $cookieStore.put('globals', $rootScope.globals);        
//    }

    // keep user logged in after page refresh
    
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
            $location.path('/login');
        }
    });
}]);

UserProjectApp.controller('LoginController',['$scope','$rootScope','$location','$cookieStore','AuthenticationServices',function($scope,$rootScope,$location,$cookieStore,AuthenticationServices) {
    $scope.authenticated=$rootScope.authenticated;
    $scope.username=$rootScope.globals.currentUser.username;
    
    //Old code, worked with pre-main.html versions of the user interface.
    $scope.login=function(){
        AuthenticationServices.clearCredentials2();
        $scope.dataLoading=true;
        AuthenticationServices.doLogin2($scope.username, $scope.password, function(response){
            if(response.success) {
                AuthenticationServices.setCredentials2($scope.username, $scope.password);
                $location.path('/projects');
            } else {
                console.error("Authentication error");
                $scope.error = response.message;
                $scope.dataLoading = false;
            }
        });
        $rootScope.authenticated=$scope.authenticated;
    }

    //This is the code that handles login for master.html.
    $scope.loginGeo=function(){
        console.log("In loginGeo:"+$scope.username);
        AuthenticationServices.clearCredentials2();
        $scope.dataLoading=true;
        AuthenticationServices.doLogin2($scope.username, $scope.password, function(response){
            if(response.success) {
                AuthenticationServices.setCredentials2($scope.username, $scope.password);
                $scope.authenticated=true;
            } else {
                console.error("Authentication error");
                $scope.error = response.message;
                    $scope.dataLoading = false;
            }
        });
        $rootScope.authenticated=$scope.authenticated;
        $rootScope.$broadcast('loginEvent',$scope.username);
        console.log("Login complete, status: "+$rootScope.authenticated);

    };
    
    $scope.logoutGeo=function() {
        AuthenticationServices.clearCredentials2();
        console.log("LogoutGeo() called");
        $scope.authenticated=false;
        $rootScope.authenticated=$scope.authenticated;
        $rootScope.$broadcast('loginEvent',$rootScope.globals.currentUser.username);
    };

    $scope.isAuthenticated=function() {
        $scope.authenticated=$rootScope.authenticated;
      //  console.log($scope.authenticated);
        if($scope.authenticated == null) {
            $scope.authenticated=false;
        }
        $rootScope.authenticated=$scope.authenticated;
        return $scope.authenticated;
    };
    $scope.username=$rootScope.globals.currentUser.username;

}]);
                  
//TODO: consolidate this with the other controllers, or at least with EditProjectController
UserProjectApp.controller('UserProjectController', function($scope,$rootScope,$http) {
//    $http.get('projects/'+$rootScope.globals.currentUser.username).success(function(data){
//        $scope.projects=data;
//    });
 
    $scope.orderProp="-creationTime";

    $scope.$on('refresh', function(event,arg) {
        $http.get('projects/'+$rootScope.globals.currentUser.username).success(function(data){
            $scope.projects=data;
        });
    });
    
    $scope.$on('loginEvent', function(event,arg) {
        $scope.username=$rootScope.globals.currentUser.username;
        $scope.authenticated=$rootScope.authenticated;
        console.log("Getting all the projects for "+$rootScope.globals.currentUser.username);
        $http.get('projects/'+$rootScope.globals.currentUser.username).success(function(data){
            $scope.projects=data;
        });
    });
               
});


/**
* I took the following snippets from 
* http://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs
*/
//This will transform the file-model attributes when the page is compiled.
UserProjectApp.directive('fileModel', ['$parse', function($parse) {
    return {
        //restrict: tells AngularJS's compiler to only match attribute names
        //link: 
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model=$parse(attrs.fileModel);
            var modelSetter=model.assign;
            element.bind('change', function(){
                scope.$apply(function() {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

UserProjectApp.controller("EditProjectController",['$scope','$rootScope','$http','$location', function($scope,$rootScope,$http,$location) {
    $scope.username=$rootScope.globals.currentUser.username;

    $scope.$on('loginEvent', function(event,arg) {
//        console.log("Login event",arg, $rootScope.authenticated);
        $scope.username=$rootScope.globals.currentUser.username;
        $scope.authenticated=$rootScope.authenticated;
        $scope.viewList=true;
    });
  
    $scope.$on('selectProjectEvent',function(event,arg) {
        console.log("selectprojectevent",arg);
        $scope.viewList=arg;
    });
    
    //Set $scope's myproject. 
    //Note this will only be called if the project isn't anonymous.
    //TODO: Clean this up.  
    if(typeof $rootScope.globals.currentProject !== 'undefined') {
        $scope.myproject=$rootScope.globals.currentProject;
    }

    //Set state
    if((typeof $rootScope.globals.currentProject !== 'undefined') && (typeof $rootScope.globals.currentProject.state !== 'undefined')) {
        $scope.status=$rootScope.globals.currentProject.status;
    }
    else {
        //Must be a new project
        $scope.status="New";
    }
    
    $scope.viewCompleteList=function(){
        $rootScope.$broadcast("selectProjectEvent",true);
    }

    //The following are functions that can be associated with submit actions.
    $scope.viewProject=function(projectId) {
        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+projectId).
            success(function(project) {
                console.log("Got the project:"+JSON.stringify(project));
                $rootScope.globals.currentProject=project;
                $scope.myproject=$rootScope.globals.currentProject;
                $rootScope.$broadcast("selectProjectEvent",false);
            }).
            error(function(data){
                console.log("Could not load the old project");
            });
    }
    $scope.createProject=function(){
        var newProject={};
        newProject.projectName=$scope.projectName;
        //        newProject.projectName=$rootScope.globals.currentProject.projectName;
        //Need to see if necessary to stringify newProject or if it can be passed directly.
        //        console.log("Creating anonymous project");
        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
            success(function(project){
                console.log("Anon project created: "+project._id);
                //Set or update the current project
                $rootScope.globals.currentProject=project;
                $rootScope.globals.currentProject.status="New"; 
            }).
            error(function(data){
                console.error("Could not create the new project");
            });        
    }
    
    //User will review or edit a previous project
    $scope.editProject=function(projectId) {
        console.log('Project GET request:'+'projects/'+$rootScope.globals.currentUser.username+"/"+projectId);
        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+projectId).
            success(function(project) {
                console.log("Got the project:"+JSON.stringify(project));
                $rootScope.globals.currentProject=project;
                $scope.myproject=$rootScope.globals.currentProject;
                $location.path('/submit');
            }).
            error(function(data){
                console.log("Could not load the old project");
            });
        
    }

    //User will delete the selected project.
    $scope.deleteProject=function(projectId){
        $http.delete('/projects/'+$rootScope.globals.currentUser.username+"/"+projectId).
            success(function(data){
                console.log("Delete response:"+data);
            }).
            error(function(data){
                console.error("Could not delete project:"+JSON.stringify(data));
            });
        //Refresh the projects display
        $rootScope.$broadcast("refresh","true");
    }

    //Show refreshed project information
    $scope.refreshView=function() {
        console.log("Refresh view");
        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id).
            success(function(project) {
                //Replace the $rootScope.globals.currentProject with its updated values
                //from the MongoDB collection.
                console.log("Got the project:"+JSON.stringify(project));
                $rootScope.globals.currentProject=project;
                $scope.myproject=$rootScope.globals.currentProject;
            }).
            error(function(data){
                console.log("Could not load the project");
            });
    }

    $scope.$on('upload', function (event, arg) {
        //        console.log('Got the message:'+event+" "+arg);
        $scope.status=$rootScope.globals.currentProject.status;
        console.log("Ready to submit set to false; sanity:"+$scope.status);
        $scope.myproject=arg;        
    });

    function urlify(filename){
        var urlFilename=$location.protocol()+"://"+$location.host()+":"+$location.port()+"/userUploads/";
        urlFilename+=$rootScope.globals.currentUser.username+"/";
        urlFilename+=$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id+"/";
        urlFilename+=filename;
//        console.log(urlFilename);
        return urlFilename;
    }
    //This runs the blocking version of the executable wrapper
    $scope.submitdisloc=function(appName){
        //Note status is completed because we made a blocking call.
        $rootScope.globals.currentProject.status="Completed";
        $rootScope.globals.currentProject.appName=appName;
        $rootScope.globals.currentProject.projectWorkDir=$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;

        //Input file
        $rootScope.globals.currentProject.projectInputFileNameUrl=urlify($rootScope.globals.currentProject.projectInputFileName);

        //Output file
        $rootScope.globals.currentProject.projectOutputFileName=$rootScope.globals.currentProject.projectName+".out";
        $rootScope.globals.currentProject.projectOutputFileNameUrl=urlify($rootScope.globals.currentProject.projectName+".out");

        //Log file
        $rootScope.globals.currentProject.projectLogFileName=$rootScope.globals.currentProject.projectName+".log";
        $rootScope.globals.currentProject.projectLogFileNameUrl=urlify($rootScope.globals.currentProject.projectName+".log");

        //Standard out
        $rootScope.globals.currentProject.projectStandardOut=$rootScope.globals.currentProject.projectName+".stdout";
        $rootScope.globals.currentProject.projectStandardOutUrl=urlify($rootScope.globals.currentProject.projectName+".stdout");

        //Standard error
        $rootScope.globals.currentProject.projectStandardError=$rootScope.globals.currentProject.projectName+".stderr";
        $rootScope.globals.currentProject.projectStandardErrorUrl=urlify($rootScope.globals.currentProject.projectName+".stderr");

        //output file name for kml plotting
        $rootScope.globals.currentProject.projectOutputKMLFileName=$rootScope.globals.currentProject.projectName+".out.kml";
        $rootScope.globals.currentProject.projectOutputKMLFileNameUrl=urlify($rootScope.globals.currentProject.projectName+".out.kml");

        //output file name for SARImage plotting
        $rootScope.globals.currentProject.projectOutputSARImageKMLFileName=$rootScope.globals.currentProject.projectName+".out.insar.kml";
        $rootScope.globals.currentProject.projectOutputSARImageKMLFileNameUrl=urlify($rootScope.globals.currentProject.projectName+".out.insar.kml");

        //output file name for tiltmap
        $rootScope.globals.currentProject.projectOutputTiltCSVFileName=$rootScope.globals.currentProject.projectName+".out.tilt.csv";
        $rootScope.globals.currentProject.projectOutputTiltCSVFileNameUrl=urlify($rootScope.globals.currentProject.projectName+".out.tilt.csv");

        //output file name for strainMag.kml plot
        $rootScope.globals.currentProject.projectOutputStrainMagFileName = $rootScope.globals.currentProject.projectName + ".out.tilt_strainMag.kml";
        $rootScope.globals.currentProject.projectOutputStrainMagFileNameUrl = urlify($rootScope.globals.currentProject.projectName + ".out.tilt_strainMag.kml");

        //zip file name
        $rootScope.globals.currentProject.projectZipFileName = $rootScope.globals.currentProject._id + ".zip";
        $rootScope.globals.currentProject.projectZipFileNameUrl = urlify($rootScope.globals.currentProject._id + ".zip");
        
        //paramters
        $rootScope.globals.currentProject.insarElevation = $("#disloc_elevation").val();
        $rootScope.globals.currentProject.insarAzimuth = $("#disloc_azimuth").val();
        $rootScope.globals.currentProject.insarFrequency = $("#disloc_frequency").val();

        //Put the updated project in the DB.
        $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
            success(function(data, status) { 
            }).
            error(function(data){
                console.log("Couldn't update the db");
            });
        
        //disbale submit button

        $http.get('/execute_disloc2/'+appName+'/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                console.log("Successful exec:"+JSON.stringify(data));
                $scope.myproject=$rootScope.globals.currentProject;
                //alert("run loaddislocKmlLayer");
                loaddislocKmlLayer("disloc_outputkml",$rootScope.globals.currentProject.projectOutputKMLFileName);
                loaddislocKmlLayer("disloc_sarimagekml",$rootScope.globals.currentProject.projectOutputSARImageKMLFileName);
                loaddislocKmlLayer("disloc_strainmagkml",$rootScope.globals.currentProject.projectOutputStrainMagFileName);
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
                $rootScope.globals.currentProject.status="Failed";
                $scope.myproject=$rootScope.globals.currentProject;
            });
    }
    
    //This runs the blocking version of the executable wrapper
    //TODO: this is not currently used, need to merge with other methods.
    $scope.submit=function(appName){
        console.log("appName:"+appName);
        //        console.log("Current project:"+JSON.stringify($rootScope.globals.currentProject));
        //        console.log("URL for exec:"+'/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id);
        //Note status is completed because we made a blocking call.
        $rootScope.globals.currentProject.status="Completed";
        $rootScope.globals.currentProject.projectOutputFileName=$rootScope.globals.currentProject.projectName+".out";
        $rootScope.globals.currentProject.projectLogFileName=$rootScope.globals.currentProject.projectName+".log";
        $rootScope.globals.currentProject.projectFaultFileName=$rootScope.globals.currentProject.projectName+".fault";
        $rootScope.globals.currentProject.projectWorkDir=$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;
        $rootScope.globals.currentProject.projectStandardOut=$rootScope.globals.currentProject.projectName+".stdout";
        $rootScope.globals.currentProject.projectStandardError=$rootScope.globals.currentProject.projectName+".stderr";
        $rootScope.globals.currentProject.appName=appName;

        //Put the updated project in the DB.
        $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
            success(function(data, status) { 
            }).
            error(function(data){
                console.log("Couldn't update the db");
            });
        
        $http.get('/execute/'+appName+'/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                console.log("Successful exec:"+JSON.stringify(data));
                $scope.myproject=$rootScope.globals.currentProject;
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
                $rootScope.globals.currentProject.status="Failed";
                $scope.myproject=$rootScope.globals.currentProject;
            });
    }
    
    //This runs the non-blocking version of the executable wrapper
    $scope.submitNonblocking=function(appName){
        //        console.log("Current project:"+JSON.stringify($rootScope.globals.currentProject));
        //        console.log("URL for exec:"+'/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id);
        //        console.log("appName:"+appName);
        $rootScope.globals.currentProject.status="Submitted";
        //TODO: This is crappy
        $rootScope.globals.currentProject.projectOutputFileName=$rootScope.globals.currentProject.projectName+".out";
        $rootScope.globals.currentProject.projectLogFileName=$rootScope.globals.currentProject.projectName+".log";
        $rootScope.globals.currentProject.projectFaultFileName=$rootScope.globals.currentProject.projectName+".fault";
        $rootScope.globals.currentProject.projectWorkDir=$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;
        $rootScope.globals.currentProject.projectStandardOut=$rootScope.globals.currentProject.projectName+".stdout";
        $rootScope.globals.currentProject.projectStandardError=$rootScope.globals.currentProject.projectName+".stderr";
        
        //                console.log("Submitted Project Metadata:",$rootScope.globals.currentProject);

        //Push the job's status to the DB.
        $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
            success(function(data, status) { 
                console.log("Updated the job status");
            }).
            error(function(data){
                console.log("Couldn't update the db");
            });
        
        $http.get('/spawn/'+appName+'/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                $scope.myproject=$rootScope.globals.currentProject;
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
                $rootScope.globals.currentProject.status="Failed";
                $scope.myproject=$rootScope.globals.currentProject;
            });
    }
    

}]);

/**
* The upload controller is used to upload files to the server.
* TODO: We may want to merge this with UserProjectController.
* TODO: Generalize the functions so that we don't need a specialized upload for each case
*/                       
UserProjectApp.controller("UploadController", ['$scope','$rootScope','$http','$location','UploadService',function($scope, $rootScope, $http, $location, UploadService) {
    //This version is used to plot a KML file on KmlMapper (standalone version)
    $scope.uploadFileForKmlOld=function(){
        var file=$scope.myFile;
        var projectName="anonymousKmlProject-"+Math.floor(Math.random()*100000000)+"/";
        var uploadUrl="/doUpload/anonymousKmlUser/"+projectName;
        UploadService.uploadFileToUrl2(file,uploadUrl);
        $scope.kmlUrl=$location.protocol()+"://"+$location.host()+":"+$location.port()+"/userUploads/anonymousKmlUser/"+projectName+file.name;
        document.getElementById("kmlUrl").value=$scope.kmlUrl;
    }

    //This version uploads and plots KML file in the mapper tool embedded into main.html
    $scope.uploadFileForKml=function(){
        var file=$scope.myFile;
        var projectName="anonymousKmlProject-"+Math.floor(Math.random()*100000000)+"/";
        var uploadUrl="/doUpload/anonymousKmlUser/"+projectName;
        UploadService.uploadFileToUrl2(file,uploadUrl);
        $scope.kmlUrl=$location.protocol()+"://"+$location.host()+":"+$location.port()+"/userUploads/anonymousKmlUser/"+projectName+file.name;
        //document.getElementById("kmlMapperUrl").value=$scope.kmlUrl;
        if($scope.uploadedKmlFiles == null) $scope.uploadedKmlFiles=[];
        var uploadedFile={};
        uploadedFile["name"]=file.name;
        uploadedFile["url"]=$scope.kmlUrl;
        $scope.uploadedKmlFiles.push(uploadedFile);
    }

    //This version is integrated with Disloc/Simplex submission
    $scope.uploadFile=function(){
        //$scope.myfile must correspond to the value of the file-model attribute in the HTML.
        var file=$scope.myFile;
        
        //Create a new project
        //TODO: the user's project is set up here, which is awkward.  Should be able to call createProject().
        var newProject={};
        newProject.projectName=$rootScope.globals.currentUser.username+"Project";
        newProject.projectInputFileName=file.name;
        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
            success(function(project){
                //Set the currentProject
                console.log("Newly registered project:",project);
                $rootScope.globals.currentProject=project;
                //Notify other controllers that this is done.
                console.log("Root scope project,",$rootScope.globals.currentProject);
                
                //Upload the file
                //doUpload is the REST method in GeoGatewayServer. The rest are parameters.
                //Note: need to consolidate these naming conventions in some variable or function.
                var uploadUrl="/doUpload/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;
                console.log("Upload URL:"+uploadUrl);
                UploadService.uploadFileToUrl2(file,uploadUrl);

                //Update the project
                $rootScope.globals.currentProject.status="Ready";
                $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
                    success(function(project){
                        console.log("updated project:"+JSON.stringify(project));
                        $rootScope.$broadcast('upload','done');
                        $rootScope.$broadcast('upload',project);
                    }).
                    error(function(data){
                        console.error("Could not update project: "+data);
                    });
            }).
            error(function(data){
                console.error("Could not create the new project");
            });
    };
}]);

/**
* This controller handles logouts.
* TODO: merge into UserProjectController. Probably don't need to keep this separate.
*/ 
UserProjectApp.controller("LogoutController", ['$scope','$location','AuthenticationServices', function($scope,$location,AuthenticationServices){
    $scope.logout=function() {
//        console.log("form action");
        AuthenticationServices.clearCredentials2();
        $location.path('/login');    
    }
    
    $scope.logoutGeo=function() {
        AuthenticationServices.clearCredentials2();
        $scope.authenticated=false;
    };
    
}]);

/**
* This controller is used to display feeds.
* TODO: merge
*/ 
UserProjectApp.controller("FeedCtrl", ['$scope','FeedService', function ($scope,Feed) {    
    $scope.loadButonText="Load";
    $scope.loadFeed=function(e){        
        Feed.parseFeed($scope.feedSrc).then(function(res){
            $scope.loadButonText=angular.element(e.target).text();
            $scope.feeds=res.data.responseData.feed.entries;
        });
    }
}]);

UserProjectApp.controller("FeedCtrlBlog", ['$scope','FeedService', function ($scope,Feed) {    
    $scope.loadFeed=function(){   
        var feedSrc='http://geo-gateway.blogspot.com/feeds/posts/default';
        Feed.parseFeed(feedSrc).then(function(res){
            $scope.feeds=res.data.responseData.feed.entries;
        });
    }
}]);

UserProjectApp.controller("FeedCtrlJira", ['$scope','FeedService', function ($scope,Feed) {    
    $scope.loadFeed=function(){   
        var feedSrc='https://gateways.atlassian.net/activity?maxResults=10&streams=key+IS+GEOG&providers=thirdparty+tempo-provider+dvcs-streams-provider+issues';
        Feed.parseFeed(feedSrc).then(function(res){
            $scope.feeds=res.data.responseData.feed.entries;
        });
    }
}]);

UserProjectApp.factory('FeedService',['$http',function($http){
    return {
        parseFeed : function(url){
            return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
        }
    }
}]);