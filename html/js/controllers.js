'use strict'; 

var UserProjectApp=angular.module('UserProjectApp',['ngRoute','ngCookies']);

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
    $rootScope.globals = $cookieStore.get('globals') || {};
    if ($rootScope.globals.currentUser) {
        //        $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
    }
    
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
            $location.path('/login');
        }
    });
}]);


UserProjectApp.service('DoLogin',['$timeout', function($timeout) {
    this.doLogin=function(username,password, callback) {
        console.log("Calling login");
        $timeout(function(){
            var response={};
            response.success=true;
            response.message="Authentication successful";
            callback(response);
        }, 10);
    }
}]);

UserProjectApp.service('SetCredentials', ['$rootScope','$cookieStore', function($rootScope,$cookieStore) { 
    //            var authdata = Base64.encode(username + ':' + password);
    this.setCredentials=function(username,password) {
        console.log("Setting new credentials");
        $rootScope.globals = {
            currentUser: {
                username: username,
                password: password
            }
        };
        $cookieStore.put('globals', $rootScope.globals);
    }
}]);
                                           
UserProjectApp.service('ClearCredentials',['$rootScope','$cookieStore',function($rootScope,$cookieStore){
    this.clearCredentials=function(){
        console.log("Clearing old credentials");
        $rootScope.globals = {};
        $cookieStore.remove('globals');
    }
}]);
        

UserProjectApp.controller('LoginController',['$scope','$rootScope','$location','$cookieStore','ClearCredentials','DoLogin','SetCredentials',function($scope,$rootScope,$location,$cookieStore,ClearCredentials,DoLogin,SetCredentials) {
    $scope.login=function(){
        console.log("Doing the login thing");
        ClearCredentials.clearCredentials();
        $scope.dataLoading=true;
        DoLogin.doLogin($scope.username, $scope.password, function(response){
            console.log("Login response is "+JSON.stringify(response));
            console.log(response.success);
            if(response.success) {
                console.log("Authentication successful");
                SetCredentials.setCredentials($scope.username, $scope.password);
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
    $http.get('projects/meptest').success(function(data){
        console.log(data);
        $scope.projects=data;
    });
    $scope.orderProp='_id';
});

UserProjectApp.controller('SimplexSubmitController',function($scope, $http){
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


                         
                       