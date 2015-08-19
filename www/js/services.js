angular.module('careapp.services', [])

.factory('UserManager', function($rootScope, $http, $q) {

    var log_fb_response = function(fb_response) {
        var data = {
            fb_response: fb_response
        };
        return $http.post(server_base_url + "/users/log_fb_response", data);
    };

    return {
        log_fb_response: log_fb_response
    };

})

;
