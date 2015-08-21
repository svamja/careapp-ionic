angular.module('careapp.services', [])

.factory('UserManager', function($rootScope, $http, $q) {

    var login = function(fb_response) {
        var data = {
            fb_response: fb_response
        };
        var deferred = $q.defer();
        $http.post(server_base_url + "/users/login", data)
        .then(function(good_response) {
            if(good_response.data && good_response.data.status && good_response.data.status == "success") {
                deferred.resolve(good_response.data);
            }
            else {
                deferred.reject("SV17");
            }
        })
        .catch(function(bad_response) {
            deferred.reject("SV21");
        });
        return deferred.promise;
    };

    return {
        login: login
    };

})

;
