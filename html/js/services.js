var GeoGatewayServices=angular.module('GeoGatewayServices',['ngCookies']);

GeoGatewayServices.factory('AuthenticationServices',['$rootScope','$cookieStore',function($rootScope,$cookieStore){
    var service={};
    service.clearCredentials2=function() {    
        console.log("Clearing credentials");
        $rootScope.globals = {};
        $cookieStore.remove('globals');        
    };
    service.doLogin2=function(username, password, callback){
        console.log("Doing the login");
        var response={};
        response.success=true;
        response.message="Authentication successful";
        callback(response);
    };
    service.setCredentials2=function(username, password){
        console.log("Setting new credentials");
        $rootScope.globals = {
            currentUser: {
                username: username,
                password: password
            },
            currentProject: {
                projectName: "",
                projectId:""
            }
        };
        $cookieStore.put('globals', $rootScope.globals);
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