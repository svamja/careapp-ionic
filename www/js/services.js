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

.factory('DbManager', function($rootScope, $http, $q) {

    var dbs = {
        "messages_db" : {
            name : "careapp_messages_db",
            options : {},
            promise : false
        }
    };

    var sync = function(db_id) {
        console.log("syncing " + db_id);
        var deferred = $q.defer();
        var local_db = new PouchDB(dbs[db_id]);
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
        if(dbs[db_id].promise) {
            return dbs[db_id].promise;
        }
        return sync(db_id);
    }

    return {
        get : get_promise,
        sync: sync
    };


})


;
