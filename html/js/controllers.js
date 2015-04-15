'use strict'; 

var UserProjectApp=angular.module('UserProjectApp',['ngRoute','ngCookies','GeoGatewayServices']);

UserProjectApp.config(['$routeProvider',function ($routeProvider) {
    $routeProvider
        .when('/login', {
            controller: 'LoginController',
            templateUrl: 'Login.html',
            hideMenus: true
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
    
    $rootScope.globals = $cookieStore.get('globals') || {};
    if ($rootScope.globals.currentUser) {
        //Current user is set
    }
    else {
        $rootScope.globals = {
            //User can still do stuff.
            currentUser: {
                username: "anonymous",
                password: ""
            },
            currentProject: {
                //This is a barebones project
                projectName: "anoymousProject",
                status: "New",
            }
        };
        $cookieStore.put('globals', $rootScope.globals);        
    }

    // keep user logged in after page refresh
    
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        console.log("Globals:"+JSON.stringify($cookieStore.get('globals')));
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
            $location.path('/login');
        }
    });
}]);

UserProjectApp.controller('LoginController',['$scope','$rootScope','$location','$cookieStore','AuthenticationServices',function($scope,$rootScope,$location,$cookieStore,AuthenticationServices) {
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
    };
}]);
                  
//TODO: consolidate this with the other controllers, or at least with EditProjectController
UserProjectApp.controller('UserProjectController', function($scope,$rootScope,$http) {
    $http.get('projects/'+$rootScope.globals.currentUser.username).success(function(data){
        $scope.projects=data;
    });
    
    $scope.$on('refresh', function(event,arg) {
        $http.get('projects/'+$rootScope.globals.currentUser.username).success(function(data){
            $scope.projects=data;
        });
    });
    
    $scope.orderProp='_id';
               
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
    
    //This function is done to create a new anonymous project
    //TODO: Remove hard coding of string "anonymous"
    if($scope.username="anonymous") {
        var newProject={};
        newProject.projectName=$rootScope.globals.currentProject.projectName;
        //Need to see if necessary to stringify newProject or if it can be passed directly.
        console.log("Creating anonymous project");
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

    //The following are functions that can be associated with submit actions.
    $scope.viewProject=function(projectId) {
        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+projectId).
            success(function(project) {
                console.log("Got the project:"+JSON.stringify(project));
                $rootScope.globals.currentProject=project;
                $scope.myproject=$rootScope.globals.currentProject;
                $location.path('/view');
            }).
            error(function(data){
                console.log("Could not load the old project");
            });
    }
    
    $scope.createProject=function(){
        var newProject={};
        newProject.projectName=$scope.projectName;
        //Need to see if necessary to stringify newProject or if it can be passed directly.
        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
            success(function(project){
                //Set or update the current project
                $rootScope.globals.currentProject=project;
                $location.path('/submit');
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
        //        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id).success(function(data){
        //            console.log("project data:"+JSON.stringify(data));
        //            $scope.myproject=data;
        
        //});
        
    });

    //This runs the blocking version of the executable wrapper
    $scope.submitdisloc=function(appName){
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
        //output file name for kml plotting
        $rootScope.globals.currentProject.projectOutputKMLFileName=$rootScope.globals.currentProject.projectName+".out.kml";
        //output file name for SARImage plotting
        $rootScope.globals.currentProject.projectOutputSARImageKMLFileName=$rootScope.globals.currentProject.projectName+".out.insar.kml";
        //output file name for tiltmap
        $rootScope.globals.currentProject.projectOutputTiltCSVFileName=$rootScope.globals.currentProject.projectName+".out.tilt.csv";
        //output file name for strainMag.kml plot
        $rootScope.globals.currentProject.projectOutputStrainMagFileName = $rootScope.globals.currentProject.projectName + ".out.tilt_strainMag.kml";
        //zip file name
        $rootScope.globals.currentProject.projectZipFileName = $rootScope.globals.currentProject._id + ".zip";
        
        //Put the updated project in the DB.
        $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
            success(function(data, status) { 
            }).
            error(function(data){
                console.log("Couldn't update the db");
            });
        
        $http.get('/execute_disloc/'+appName+'/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                console.log("Successful exec:"+JSON.stringify(data));
                $scope.myproject=$rootScope.globals.currentProject;
                //alert("run loaddislocKmlLayer");
                loaddislocKmlLayer("disloc_outputkml",$rootScope.globals.currentProject.projectOutputKMLFileName);
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
                $rootScope.globals.currentProject.status="Failed";
                $scope.myproject=$rootScope.globals.currentProject;
            });
    }
    
    //This runs the blocking version of the executable wrapper
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
                       
UserProjectApp.controller("UploadController", ['$scope','$rootScope','$http','$location','UploadService',function($scope, $rootScope, $http, $location, UploadService) {
    //This version is used to plot a KML file
    $scope.uploadFileForKml=function(){
        var file=$scope.myFile;
        var projectName="anonymousKmlProject-"+Math.floor(Math.random()*100000000)+"/";
        var uploadUrl="/doUpload/anonymousKmlUser/"+projectName;
        UploadService.uploadFileToUrl2(file,uploadUrl);
        $scope.kmlUrl=$location.protocol()+"://"+$location.host()+":"+$location.port()+"/userUploads/anonymousKmlUser/"+projectName+file.name;
        document.getElementById("kmlMapperUrl").value=$scope.kmlUrl;
    }

    //This version is integrated with Disloc/Simplex submission
    $scope.uploadFile=function(){
        //$scope.myfile must correspond to the value of the file-model attribute in the HTML.
        var file=$scope.myFile;

        //doUpload is the REST method in GeoGatewayServer. The rest are parameters.
        //Note: need to consolidate these naming conventions in some variable or function.
        var uploadUrl="/doUpload/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;
        console.log("Upload URL:"+uploadUrl);
        UploadService.uploadFileToUrl2(file,uploadUrl);
        
        $rootScope.globals.currentProject.projectInputFileName=file.name;
        $rootScope.globals.currentProject.status="Ready";
        //Now update the project object
//        console.log("Here is the URL:"+"/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id);

        $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
            success(function(project){
                console.log("updated project:"+JSON.stringify(project));
//                $rootScope.$broadcast('upload','done');
                $rootScope.$broadcast('upload',project);
            }).
            error(function(data){
                console.error("Could not update project: "+data);
            });
    };
}]);


UserProjectApp.controller("LogoutController", ['$scope','$location','AuthenticationServices', function($scope,$location,AuthenticationServices){
    $scope.logout=function() {
        console.log("form action");
        AuthenticationServices.clearCredentials2();
        $location.path('/login');    
    };
}]);