'use strict'; 

var UserProjectApp=angular.module('UserProjectApp',['ngRoute','ngCookies','GeoGatewayServices']);

UserProjectApp.config(['$routeProvider', function ($routeProvider) {
        
        $routeProvider
            .when('/login', {
                controller: 'LoginController',
                templateUrl: 'Login.html',
                hideMenus: true
            })
        
            .when('/', {
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
        //        $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
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
    console.log("LoginController called");
    $scope.login=function(){
        console.log("Doing the login thing");
//        ClearCredentials.clearCredentials();
        AuthenticationServices.clearCredentials2();
        $scope.dataLoading=true;
        AuthenticationServices.doLogin2($scope.username, $scope.password, function(response){
            console.log("Login response is "+JSON.stringify(response));
            console.log(response.success);
            if(response.success) {
                console.log("Authentication successful");
                AuthenticationServices.setCredentials2($scope.username, $scope.password);
                $location.path('/');
            } else {
                console.error("Authentication error");
                $scope.error = response.message;
                $scope.dataLoading = false;
            }
        });
    };
}]);
                  

UserProjectApp.controller('UserProjectController', function($scope,$http) {
    console.log("UserProjectController called");
    $http.get('projects/meptest').success(function(data){
        $scope.projects=data;
    });
    $scope.orderProp='_id';
});

UserProjectApp.controller('SubmitProjectController',function($scope, $rootScope,$http){
    console.log("SubmitProjectController called");
        $scope.$on('upload', function (event, arg) {
            console.log('Got the message:'+arg);
        });
        $scope.submit=function(){
            console.log("Hollow world!");
            console.log('/execute/simplex/'+$rootScope.globals.currentUser.username+'/'+$rootScope.globals.currentProject.projectId);
            $http.get('/execute/simplex/'+$rootScope.userName+'/'+$rootScope.projectId).
                success(function(data){
                }).
                error(function(data){
                });
        }
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

UserProjectApp.controller("UploadController", ['$scope','$rootScope','UploadService', function($scope, $rootScope, UploadService) {
    console.log("UploadController called");
    $scope.uploadFile=function(){
        //$scope.myfile must correspond to the value of the file-model attribute in the HTML.
        var file=$scope.myFile;
        console.log('file is '+JSON.stringify(file));
        //This is a hard-coded path for now.
        var uploadUrl="/doUpload/"+$rootScope.globals.currentUser.username+"/"+$rootScope.globals.currentProject.projectName+"_"+$rootScope.globals.currentProject.projectId;
        console.log(uploadUrl);
        UploadService.uploadFileToUrl2(file,uploadUrl);
    };
    $rootScope.$broadcast('upload','done');
}]);

UserProjectApp.controller("LogoutController", ['$scope','$location','AuthenticationServices', function($scope,$location,AuthenticationServices){
    console.log("LogoutController called");
    $scope.logout=function() {
        console.log("form action");
        AuthenticationServices.clearCredentials2();
        $location.path('/login');    
    };
}]);

UserProjectApp.controller("EditProjectController",['$scope','$rootScope','$http','$location', function($scope,$rootScope,$http,$location) {
    console.log("EditProjectController called");
    $scope.createNewProject=function() {
        console.log("Creating new project");
    }
    $scope.editProject=function(projectId) {
        console.log(projectId);
    }
    $scope.createProject=function(){
        $rootScope.globals.currentProject.projectName=$scope.projectName;
        var msgBody='{"projectName":'+$scope.projectName+'}';
        $http.post('/projects/:'+$scope.userName,msgBody).
            success(function(data){
            }).
            error(function(data){
            });
        $location.path('/submit');
    }
}]);
                         
                       