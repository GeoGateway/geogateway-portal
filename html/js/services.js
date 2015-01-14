var GeoGatewayServices=angular.module('GeoGatewayServices',['ngCookies']);

GeoGatewayServices.factory('AuthenticationServices',['$rootScope','$cookieStore',function($rootScope,$cookieStore){
    var service={};
    service.clearCredentials2=function() {    
        console.log("Clearing credentials");
        $rootScope.globals = {};
        $cookieStore.remove('globals');        
    };
    return service;
}]);
