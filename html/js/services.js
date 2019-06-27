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
            currentProject: {}
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
            currentProject:{}
        };
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
            .success(function(res) { console.log("success");
            })
            .error(function(error) { console.log(error);
            } );
    }
    return service;
}]);