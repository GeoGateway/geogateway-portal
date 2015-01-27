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
                controller: 'SubmitProjectController',
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
        console.log("Got projects:"+data);
        $scope.projects=data;
    });
    
    $scope.$on('refresh', function(even,arg) {
        console.log("Event detected");
        $http.get('projects/'+$rootScope.globals.currentUser.username).success(function(data){
            console.log("Got projects:"+data);
            $scope.projects=data;
        });
    });
    
    $scope.orderProp='_id';
               
});


/**
* I took the following three snippets from 
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
    $scope.editProject=function(projectId) {
        console.log("Selected project ID:"+projectId);
    }

    $scope.deleteProject=function(projectId){
        console.log("Delete project: "+projectId);
        console.log('/projects/'+$rootScope.globals.currentUser.username+"/"+projectId);
        $http.delete('/projects/'+$rootScope.globals.currentUser.username+"/"+projectId).
            success(function(data){
                console.log("Delete response:"+JSON.stringify(data));
            }).
            error(function(data){
                console.error("Could not delete project:"+JSON.stringify(data));
            });
        //Refresh the projects display
        $rootScope.$broadcast("refresh","true");
    }

    $scope.createProject=function(){
        var newProject={};
        newProject.projectName=$scope.projectName;
        //Need to see if necessary to stringify newProject or if it can be passed directly.
        $http.post('/projects/'+$rootScope.globals.currentUser.username,newProject).
            success(function(project){
                console.log("Here is the updated project:"+JSON.stringify(project));
                //Set or update the current project
                $rootScope.globals.currentProject=project;
                console.log("And our rootScope copy:"+JSON.stringify($rootScope.globals.currentProject));
            }).
            error(function(data){
                console.error("Could not create the new project");
            });
        $location.path('/submit');
    }
}]);
                         
                       
UserProjectApp.controller("UploadController", ['$scope','$rootScope','$http','UploadService', function($scope, $rootScope, $http, UploadService) {
    $scope.uploadFile=function(){
        //$scope.myfile must correspond to the value of the file-model attribute in the HTML.
        var file=$scope.myFile;

        //doUpload is the REST method in GeoGatewayServer. The rest are parameters.
        var uploadUrl="/doUpload/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id;
        console.log("Upload URL:"+uploadUrl);
        UploadService.uploadFileToUrl2(file,uploadUrl);
        
        $rootScope.globals.currentProject.projectInputFileName=file.name;
        $rootScope.globals.currentProject.projectOutputFileName=$rootScope.globals.currentProject.projectName+".out";
        $rootScope.globals.currentProject.projectWorkDir=$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id;
        //Now update the project object
        console.log("Here is the URL:"+"/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id);

        $http.put("/projects/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject._id,$rootScope.globals.currentProject).
            success(function(project){
                console.log("updated project:"+JSON.stringify(project));
            }).
            error(function(data){
                console.error("Could not update project: "+data);
            });

    };
    $rootScope.$broadcast('upload','done');
}]);

UserProjectApp.controller('SubmitProjectController',function($scope, $rootScope,$http){
        $scope.$on('upload', function (event, arg) {
            console.log('Got the message:'+arg);
        });
        $scope.submit=function(){
            console.log("Current project:"+JSON.stringify($rootScope.globals.currentProject));
            console.log("URL for exec:"+'/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id);
            $http.get('/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject._id).
                success(function(data){
                    console.log("Successful exec:"+JSON.stringify(data));
                }).
                error(function(data){
                    console.error("Unsuccessful exec:"+JSON.stringify(data));
                });
        }
    });


UserProjectApp.controller("LogoutController", ['$scope','$location','AuthenticationServices', function($scope,$location,AuthenticationServices){
    $scope.logout=function() {
        console.log("form action");
        AuthenticationServices.clearCredentials2();
        $location.path('/login');    
    };
}]);