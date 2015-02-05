'use strict'; 

var UserProjectApp=angular.module('UserProjectApp',['ngRoute','ngCookies','GeoGatewayServices']);

UserProjectApp.config(['$routeProvider', function ($routeProvider) {
        
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

            .when('/submit', {
                controller: 'EditProjectController',
                templateUrl: 'SubmitProject.html'
            })
        
            .otherwise({ redirectTo: '/login' });
    }]);

UserProjectApp.run(['$rootScope','$location','$cookieStore','$http',function ($rootScope, $location, $cookieStore, $http) {
    // keep user logged in after page refresh
    console.log("Globals:"+JSON.stringify($cookieStore.get('globals')));
    $rootScope.globals = $cookieStore.get('globals') || {};
    if ($rootScope.globals.currentUser) {
        //Current user is set
    }
    
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

    //Set $scope's myproject 
    if(typeof $rootScope.globals.currentProject !== 'undefined') {
        $scope.myproject=$rootScope.globals.currentProject;
    }

    //Set readyToSubmit
    if((typeof $rootScope.globals.currentProject !== 'undefined') && (typeof $rootScope.globals.currentProject.readyToSubmit !== 'undefined')) {
        $scope.readyToSubmit=$rootScope.globals.currentProject.readyToSubmit;
        
    }
    else {
        $scope.readyToSubmit=false;
    }

    
    $scope.createProject=function(){
        var newProject={};
        newProject.projectName=$scope.projectName;
        //Need to see if necessary to stringify newProject or if it can be passed directly.
        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
            success(function(project){
                //Set or update the current project
                $rootScope.globals.currentProject=project;
                $rootScope.globals.currentProject.readyToSubmit=false; 
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
                $rootScope.globals.currentProject.readyToSubmit=true;     
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

/**
    $scope.$on('loadProject', function(event, arg) {
        console.log("Event received:"+event+" "+arg);
        $scope.readyToSubmit=true;
        $scope.myproject=arg;
    });
*/

    $scope.$on('upload', function (event, arg) {
        //        console.log('Got the message:'+event+" "+arg);
        $scope.readyToSubmit=$rootScope.globals.currentProject.readyToSubmit;
        console.log("Ready to submit set to false; sanity:"+$scope.readyToSubmit);
        $scope.myproject=arg;        
        //        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id).success(function(data){
        //            console.log("project data:"+JSON.stringify(data));
        //            $scope.myproject=data;
        
        //});
        
    });
    
    //This runs the blocking version of the executable wrapper
    $scope.submit=function(){
        //        console.log("Current project:"+JSON.stringify($rootScope.globals.currentProject));
        //        console.log("URL for exec:"+'/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id);
        $http.get('/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                console.log("Successful exec:"+JSON.stringify(data));
                $location.path('/projects');
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
            });
    }

    //This runs the non-blocking version of the executable wrapper
    $scope.submitNonblocking=function(){
        //        console.log("Current project:"+JSON.stringify($rootScope.globals.currentProject));
        //        console.log("URL for exec:"+'/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id);
        $http.get('/spawn/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                console.log("Successful exec:"+JSON.stringify(data));
                $rootScope.globals.currentProject.status="Submitted";
                //Push the job's status to the DB.
                $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).success(function(data, status) { 
                    console.log("Updated the job status");
                });
                $location.path('/projects');
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
            });
    }
    
}]);
                         
                       
UserProjectApp.controller("UploadController", ['$scope','$rootScope','$http','UploadService', function($scope, $rootScope, $http, UploadService) {
    $scope.uploadFile=function(){
        //$scope.myfile must correspond to the value of the file-model attribute in the HTML.
        var file=$scope.myFile;

        //doUpload is the REST method in GeoGatewayServer. The rest are parameters.
        //Note: need to consolidate these naming conventions in some variable or function.
        var uploadUrl="/doUpload/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;
        console.log("Upload URL:"+uploadUrl);
        UploadService.uploadFileToUrl2(file,uploadUrl);
        
        $rootScope.globals.currentProject.projectInputFileName=file.name;
        $rootScope.globals.currentProject.projectOutputFileName=$rootScope.globals.currentProject.projectName+".out";
        $rootScope.globals.currentProject.projectWorkDir=$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"-"+$rootScope.globals.currentProject._id;
        $rootScope.globals.currentProject.projectStandardOut=$rootScope.globals.currentProject.projectName+".stdout";
        $rootScope.globals.currentProject.projectStandardError=$rootScope.globals.currentProject.projectName+".stderr";
        $rootScope.globals.currentProject.readyToSubmit=true;
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

/**
UserProjectApp.controller('SubmitProjectController',function($scope, $rootScope,$http){
    $scope.readyToSubmit=false;
    $scope.username=$rootScope.globals.currentUser.username;
    $scope.$on('loadProject', function(event, arg) {
        console.log("Event received:"+event+" "+arg);
        $scope.readyToSubmit=true;
        $scope.myproject=arg;
    });
    $scope.$on('upload', function (event, arg) {
        //        console.log('Got the message:'+event+" "+arg);
        $scope.readyToSubmit=true;
        $scope.myproject=arg;        
        //        $http.get('projects/'+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id).success(function(data){
        //            console.log("project data:"+JSON.stringify(data));
        //            $scope.myproject=data;

        //});

    });

    $scope.submit=function(){
//        console.log("Current project:"+JSON.stringify($rootScope.globals.currentProject));
//        console.log("URL for exec:"+'/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id);
        $http.get('/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
            success(function(data){
                console.log("Successful exec:"+JSON.stringify(data));
            }).
            error(function(data){
                console.error("Unsuccessful exec:"+JSON.stringify(data));
            });
    }
});
*/


UserProjectApp.controller("LogoutController", ['$scope','$location','AuthenticationServices', function($scope,$location,AuthenticationServices){
    $scope.logout=function() {
        console.log("form action");
        AuthenticationServices.clearCredentials2();
        $location.path('/login');    
    };
}]);