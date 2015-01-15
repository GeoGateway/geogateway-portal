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
            }
        };
        $cookieStore.put('globals', $rootScope.globals);
    }
    return service;
}]);
