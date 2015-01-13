var GeoGatewayServices=angular.module('GeoGatewayServices',['ngCookies']);

GeoGatewayServices.factory('AuthenticationServices',['$rootScope','$cookieStore',function($rootScope,$cookieStore){
    var service={};
    service.clearCredentials2=function() {
        $rootScope.globals = {};
        $cookieStore.remove('globals');        
    };x
    return service;
}]);
