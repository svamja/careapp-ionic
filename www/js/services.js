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
            name : "careapp_messages_db"
        },

        "events_db" : {
            name : "careapp_events_db"
        },

        "passions_db" : {
            name : "careapp_passions_db"
        },

        "locations_db" : {
            name : "careapp_locations_db"
        },

        "profiles_db" : {
            name : "careapp_profiles_db"
        }
    };

    for(db_id in dbs) {
        dbs[db_id].promise = false;
        dbs[db_id].sync_in_progress = false;
        if(!dbs[db_id].options) {
            dbs[db_id].options = {};
        }
    }

    var sync = function(db_id) {
        console.log("sync init: " + db_id);
        if(!dbs[db_id]) {
            return $q.reject("Invalid db_id");
        }
        if(dbs[db_id].sync_in_progress) {
            return dbs[db_id].promise;
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
        //TODO: Wait for the remote_db connection to be successful, before starting sync
        var options = {};
        dbs[db_id].sync_in_progress = true;
        var sync_start_time = Date.now();
        local_db.sync(remote_db, options)
        .on('complete', function() {
            deferred.resolve(local_db);
            dbs[db_id].sync_in_progress = false;
            console.log("sync time: " + db_id + " : " + (Date.now()- sync_start_time) + " ms.");
        })
        .on('error', function(error) {
            deferred.reject(error);
            dbs[db_id].sync_in_progress = false;
        });
        dbs[db_id].promise = deferred.promise;
        return dbs[db_id].promise;
    };

    var get = function(db_id, refresh) {
        if(!dbs[db_id]) {
            return $q.reject("Invalid db_id");
        }
        if(!refresh) {
            return get_local(db_id);
        }
        if(dbs[db_id].promise) {
            return dbs[db_id].promise;
        }
        return sync(db_id);
    };

    var get_local = function(db_id) {
        return new PouchDB(dbs[db_id].name);
    };

    var get_remote = function(db_id) {
        var auth_options = {
            username: window.localStorage.user_id,
            password: window.localStorage.user_token
        };
        var remote_db = new PouchDB(remote_base_url + dbs[db_id].name, {
            auth: auth_options
        });
        return remote_db;
    };

    var me = function(refresh) {
        return get("profiles_db", refresh)
        .then(function(profiles_db) {
            return profiles_db.get(window.localStorage.user_id);
        })
        ;
    };

    var passion_ids = function(refresh) {
        return me(refresh)
        .then(function(profile_me) {
            var passion_ids = [];
            for(i in profile_me.passions) {
                passion_ids.push(profile_me.passions[i].id);
            }
            return passion_ids;
        })
        ;
    };

    return {
        get : get,
        get_local: get_local,
        get_remote: get_remote,
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
