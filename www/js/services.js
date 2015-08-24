angular.module('careapp.services', [])

.factory('UserManager', function($rootScope, $http, $q) {

    var server_base_url = "http://careapp.localhost";

    var login = function(fb_response) {
        var data = {
            fb_response: fb_response
        };
        var deferred = $q.defer();
        $http.post(server_base_url + "/users/login", data)
        .then(function(good_response) {
            if(good_response.data && good_response.data.status && good_response.data.status == "success" && good_response.data.token) {
                login_response = good_response.data;
                login_response.user_id = 'fb-' + fb_response.authResponse.userID;
                deferred.resolve(login_response);
            }
            else {
                deferred.reject("SV17");
            }
        })
        .catch(function(bad_response) {
            console.log(bad_response);
            deferred.reject("SV21");
        });
        return deferred.promise;
    };

    var update_city = function(city) {
        window.localStorage.user_city = $scope.city;
        //TODO: Send server request to update user's city
        //TODO: Update profile db
    }

    return {
        login: login,
        update_city: update_city
    };

})

.factory('DbManager', function($rootScope, $http, $q) {

    var slug = function(str)
    {
        return str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
    };

    var dbs = {
        "messages_db" : {
            name : "careapp_messages_db",
            options :
            {
                filter: 'filters/by_passions',
                query_params: 
                {
                    "passions": window.localStorage.user_passions, 
                    "city" :  window.localStorage.user_city
                }
            },
            promise : false
        },

        "passions_db" : {
            name : "careapp_passions_db",
            options : {},
            promise : false
        },

        "locations_db" : {
            name : "careapp_locations_db",
            options : {},
            promise : false
        },

        "profiles_db" : {
            name : "careapp_profiles_db",
            options :
            {
                // filter: 'filters/by_user',
                // query_params: 
                // {
                //     "user_id" : window.localStorage.user_id,
                //     "passions": window.localStorage.user_passions,
                //     "city" :  window.localStorage.user_city
                // }
            },
            promise : false
        }

    };

    var sync = function(db_id) {
        console.log("syncing " + db_id);
        var deferred = $q.defer();
        var local_db = new PouchDB(dbs[db_id].name);
        var remote_db = new PouchDB('http://localhost:5984/' + dbs[db_id].name);
        var options = {};
        local_db.sync(remote_db, options)
        .on('complete', function() {
            deferred.resolve(local_db);
        })
        .on('error', function(error) {
            deferred.reject(error);
        });
        deferred.resolve(local_db);
        dbs[db_id].promise = deferred.promise;
        return dbs[db_id].promise;
    }

    var get_promise = function(db_id) {
        if(!dbs[db_id]) {
            var deferred = $q.defer();
            deferred.reject("Invalid db_id");
            return deferred.promise;
        }
        if(dbs[db_id].promise) {
            return dbs[db_id].promise;
        }
        return sync(db_id);
    }

    return {
        get : get_promise,
        sync: sync,
        slug: slug
    };


})


;
