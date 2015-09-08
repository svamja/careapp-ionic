angular.module('careapp.services', ['careapp.constants'])

.factory('UserManager', function($rootScope, $http, $q, EnvApiUrl) {

    // var server_base_url = "http://careapp.localhost";
    // var server_base_url = "http://server.thecareapp.org";
    var server_base_url = EnvApiUrl;

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
                window.localStorage.user_id = login_response.user_id;
                window.localStorage.user_token = login_response.token;
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

    // var update_city = function(city_info) {
    //     var data = {
    //         city_info: city_info,
    //         user_id: window.localStorage.user_id,
    //         user_token: window.localStorage.user_token,
    //     };
    //     return $http.post(server_base_url + "/users/update_city", data)
    //     .then(function(response) {
    //         if(response.data && response.data.status && response.data.status == "success") {
    //             return "success";
    //         }
    //         return $q.reject("SV41");
    //     });
    // }

    return {
        login: login
    };

})

.factory('DbManager', function($rootScope, $http, $q, EnvDbUrl) {

    // var remote_base_url = 'http://localhost:5984/';
    // var remote_base_url = 'http://db.thecareapp.org:5984/';
    var remote_base_url = EnvDbUrl;

    var slug = function(str)
    {
        return str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
    };

    var dbs = {

        "users_db" : {
            name: "_users",
            remote_only: true
        },

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
        if(!dbs[db_id]) {
            return $q.reject("Invalid db_id");
        }
        var auth_options = {
            username: window.localStorage.user_id,
            password: window.localStorage.user_token
        };

        if(dbs[db_id].remote_only) {
            var remote_db = new PouchDB(remote_base_url + dbs[db_id].name, {
                auth: auth_options
            });
            return $q.when(remote_db);
        }
        var deferred = $q.defer();
        var local_db = new PouchDB(dbs[db_id].name);
        var remote_db = new PouchDB(remote_base_url + dbs[db_id].name, {
            auth: auth_options
        });
        var options = {};
        local_db.sync(remote_db, options)
        .on('complete', function() {
            deferred.resolve(local_db);
        })
        .on('error', function(error) {
            deferred.reject(error);
        });
        dbs[db_id].promise = deferred.promise;
        return dbs[db_id].promise;
    }

    var get_promise = function(db_id) {
        if(!dbs[db_id]) {
            return $q.reject("Invalid db_id");
        }
        if(dbs[db_id].promise) {
            return dbs[db_id].promise;
        }
        return sync(db_id);
    }

    var me = function(refresh) {
        if(window.localStorage.profile_me && !refresh)
        {
            var profile_me = JSON.parse(window.localStorage.profile_me);
            return $q.when(profile_me);
        }
        return get_promise("profiles_db")
        .then(function(profiles_db) {
            return profiles_db.get(window.localStorage.user_id);
        })
        .then(function(profile_me) {
            window.localStorage.profile_me = JSON.stringify(profile_me);
            return profile_me;
        })
        ;
    };

    var passion_ids = function(refresh) {
        if(window.localStorage.passion_ids && !refresh)
        {
            var passion_ids = JSON.parse(window.localStorage.passion_ids);
            return $q.when(passion_ids);
        }
        return me(refresh)
        .then(function(profile_me) {
            var passion_ids = [];
            for(i in profile_me.passions) {
                passion_ids.push(profile_me.passions[i].id);
            }
            window.localStorage.passion_ids = JSON.stringify(passion_ids);
            return passion_ids;
        })
        ;
    };

    return {
        get : get_promise,
        sync: sync,
        slug: slug,
        me: me,
        passion_ids: passion_ids
    };


})


.factory('GeoManager', function($cordovaGeolocation, $q) {

    var get_city_info = function(expiry) {

        if(!expiry) {
            expiry = 3600; // 1 hour of validity
        }
        if(!window.localStorage.geo_status) {
            window.localStorage.geo_status = "in_progress";
        }

        var curr_ts = Math.floor(Date.now() / 1000);
        if(window.localStorage.geo_status == "success" && 
            parseInt(window.localStorage.geo_timestamp) + expiry > curr_ts)
        {
            var city_info = JSON.parse(window.localStorage.geo_city_info);
            return $q.when(city_info);
        }
        return $cordovaGeolocation
        .getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 10*3600*1000 // 10 hours
        })
        .then(function (position) {
            var deferred = $q.defer();
            if("google" in window && google.maps) {
                var geocoder = new google.maps.Geocoder();
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                var latlng = new google.maps.LatLng(lat, lng);
                geocoder.geocode({'latLng': latlng}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results && results.length > 0) {
                            deferred.resolve(results);
                        }
                    }
                    deferred.reject("geocoder failed");
                });
            }
            else {
                deferred.reject("google maps api not loaded");
            }
            return deferred.promise;
        })
        .then(function(results) {
            var city_info = {};
            var city;
            for (var i=0; i < results.length; i++) {
                if (results[i].address_components[0].types[0] == "administrative_area_level_2") {
                    city = results[i].address_components[0].long_name;
                    city_info['city'] = city;
                    city_info['city_id'] = results[i].place_id;
                }
                else if (results[i].address_components[0].types[0] == "country") {
                    city_info['country'] = results[i].address_components[0].long_name;
                    city_info['country_code'] = results[i].address_components[0].short_name;
                }
            }
            if(city) {
                window.localStorage.geo_status = "success";
                window.localStorage.geo_timestamp = Math.floor(Date.now() / 1000);
                window.localStorage.geo_city_info = JSON.stringify(city_info);
                return city_info;
            }
        });
    };

    return {
        get_city_info: get_city_info
    }

})

;
