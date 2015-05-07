var GeoGatewayServices=angular.module('GeoGatewayServices',['ngCookies']);

GeoGatewayServices.factory('AuthenticationServices',['$rootScope','$cookieStore', '$http', function($rootScope,$cookieStore,$http){
    var service={};
    //Note this will also clear current project and anything else.
    service.clearCredentials2=function() {    
        console.log("Clearing credentials");
        $rootScope.globals = {
            //User can still do stuff.
            currentUser: {
                username: "anonymous",
                password: ""
            },
            currentProject: {
                //This is a barebones project
                projectName: "anoymousProject",
                readyToSubmit: false
            }
        };
    };
    service.doLogin2=function(username, password, callback){
        console.log("Doing the login");
        var response={};
        response.success=true;
        response.message="Authentication successful";
        callback(response);
    };
    service.setCredentials2=function(username, password){
        console.log("Setting new credentials for "+username);
        //This sets only the currentUser. The currentProject will be set later.
        $rootScope.globals = {
            currentUser: {
                username: username,
                password: password
            },
            currentProject: {
                projectName: username+"Project",
                status: "New",                
            }
        };
        //Create a new project for the authenticated user.
        var newProject={};
        newProject.projectName=$rootScope.globals.currentProject.projectName;
        //Need to see if necessary to stringify newProject or if it can be passed directly.
        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
            success(function(project){
                console.log("Project created for "+$rootScope.globals.currentUser.username+": "+project._id);
                //Set or update the current project
                $rootScope.globals.currentProject=project;
                $rootScope.globals.currentProject.status="New"; 
            }).
            error(function(data){
                console.error("Could not create the new project");
            });
        
        //        $cookieStore.put('globals', $rootScope.globals);
    }
    return service;
}]);


GeoGatewayServices.factory('UploadService', ['$http',function($http) {
    var service={};
    service.uploadFileToUrl2=function(file, uploadUrl) {
        var fd=new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity, 
            headers:{'Content-Type':undefined}
        })
            .success(function() {
            })
            .error(function() {
            } );
    }
    return service;
}]);