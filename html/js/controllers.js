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

UserProjectApp.controller('LoginController',['$scope','$rootScope','$location','$cookieStore','AuthenticationServices',function($scope,$rootScope,$location,$cookieStore,AuthenticationServices,DoLogin,SetCredentials) {
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

UserProjectApp.controller('SimplexSubmitController',function($scope, $http){
    console.log("SimplexSubmitController called");
        $scope.$on('upload', function (event, arg) {
            console.log('Got the message:'+arg);
        });
        $scope.submit=function(){
            console.log("Hollow world!");
            $http.get('/execute/simplex/'+$scope.userName+'/'+$scope.projectId);
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

UserProjectApp.service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl=function(file, uploadUrl){
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
}]);

UserProjectApp.controller("UploadController", ['$scope','$rootScope','fileUpload', function($scope, $rootScope, fileUpload) {
    console.log("UploadController called");
    $scope.uploadFile=function(){
        //$scope.myfile must correspond to the value of the file-model attribute in the HTML.
        var file=$scope.myFile;
        console.log('file is '+JSON.stringify(file));
        //This is a hard-coded path for now.
        var uploadUrl="/doUpload/andrea/project2";
        fileUpload.uploadFileToUrl(file,uploadUrl);
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

                         
                       