angular.module('careapp.controllers', ['yaru22.angular-timeago'])

.controller('AppController', function($scope, $state, $ionicHistory, EnvName) {
    
    if(EnvName == 'prod') { // quiet console log for live env
        console.log = function() {};
    }

    $scope.EnvName = EnvName;
    $scope.menu_title = "Menu";
    $scope.shared = { "dashboard_refresh" : true };

    $scope.logout = function() {
        window.localStorage.removeItem("is_logged_in");
        window.localStorage.removeItem("user_id");
        window.localStorage.removeItem("user_token");
        window.localStorage.removeItem("profile_me");
        window.localStorage.removeItem("passion_ids");
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $state.go("login.1");
    };

})

.controller('HomeController', function($scope, $state, $ionicHistory) {
    $scope.$on('$ionicView.enter', function(e) {
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        if("is_logged_in" in window.localStorage) {
            $state.go("app.dashboard");
        }
        else {
            $state.go("login.1");
        }
    });
})

.controller('LoginController', function($scope, $state, $cordovaFacebook, $cordovaNetwork, $timeout,
                                        UserManager, DbManager, GeoManager, EnvName)
{
    $scope.EnvName = EnvName;

    $scope.fb_data = { status: "Not connected" };

    $scope.syncs = {};
    $scope.ui = {};
    $scope.progress = { "passions" : {}, "profiles" : {}, "messages" : {} };
    var next_state = "app.dashboard";

    var refresh_sync = function(first_time) {
        if($scope.syncs['passions'] == 'complete' && 
            $scope.syncs['profiles'] == 'complete' &&
            $scope.syncs['messages'] == 'complete') 
        {
            $state.go(next_state);
            return;
        }
        if($scope.progress.passions.value && $scope.progress.profiles.value && $scope.progress.messages.value &&
            $scope.progress.passions.value == $scope.progress.passions.max &&
            $scope.progress.profiles.value == $scope.progress.profiles.max &&
            $scope.progress.messages.value == $scope.progress.messages.max)
        {
            $state.go(next_state);
            return;
        }

        DbManager.get_local("passions_db").info().then(function(result) {
            $scope.progress.passions.value = result.doc_count;
        });
        DbManager.get_local("profiles_db").info().then(function(result) {
            $scope.progress.profiles.value = result.doc_count;
        });
        DbManager.get_local("messages_db").info().then(function(result) {
            $scope.progress.messages.value = result.doc_count;
        });
        if(first_time) {
            $timeout(refresh_sync, 50);
        }
        else {
            $timeout(refresh_sync, 2000);
        }
    };

    var flash_sync_progress = function() {
        $state.go("login.2");
        refresh_sync(true);
    };

    var init_background_sync = function() {
        $scope.syncs['passions'] = 'in_progress';

        DbManager.sync("passions_db")
        .then(function() {
            $scope.syncs['passions'] = 'complete';
        })
        .catch(function(err) {
            $scope.syncs['passions'] = 'error';
        });

        $scope.syncs['profiles'] = 'in_progress';
        DbManager.sync("profiles_db")
        .then(function() {
            $scope.syncs['profiles'] = 'complete';
        })
        .catch(function(err) {
            $scope.syncs['profiles'] = 'error';
        });

        DbManager.sync("messages_db")
        .then(function() {
            $scope.syncs['messages'] = 'complete';
        })
        .catch(function(err) {
            $scope.syncs['messages'] = 'error';
        });


        DbManager.get_remote("passions_db").info().then(function(result) {
            $scope.progress.passions.max = result.doc_count;
        });
        DbManager.get_remote("profiles_db").info().then(function(result) {
            $scope.progress.profiles.max = result.doc_count;
        });
        DbManager.get_remote("messages_db").info().then(function(result) {
            $scope.progress.messages.max = result.doc_count;
        });

        $timeout(flash_sync_progress, 1000);
    };

    $scope.login = function() {

        $scope.fb_data.status = "Connecting ..";

        if (window.cordova.platformId == "browser") {
            var appID = 1625721067678662;
            var version = "v2.0"; // or leave blank and default is v2.0
            facebookConnectPlugin.browserInit(appID, version);
        }

        // Call Facebook API
        $cordovaFacebook.login(["public_profile", "email", "user_friends"])
        .then(function(fb_response) {
            if(!fb_response.status || fb_response.status != "connected") {
                throw "CN34";
            }
            $scope.fb_data.status = "Logging in..";
            // Create/Verify user on DB Server
            return UserManager.login(fb_response);
        })
        .then(function(login_response) {
            if(login_response.status != "success" || !login_response.token) {
                throw "CN42";
            }

            // If existing profile, just return it
            var profile = {};
            if(login_response['profile']) {
                profile = login_response['profile'];
            }
            else {
                // Insert to local db
                profile['_id'] = window.localStorage.user_id;
                profile["type"] = "profile";
                profile["last_seen"] = Date.now();
                if(login_response.fb_picture) {
                    profile['fb_picture'] = login_response.fb_picture;
                }
                profile['display_name'] = login_response.display_name;
                profile['gender'] = login_response.gender;
                DbManager.get("profiles_db")
                .then(function(profiles_db) {
                    profiles_db.put(profile);
                });
            }
            return profile;
        })
        .then(function(profile_me) {
            window.localStorage.is_logged_in = 1;
            $scope.fb_data.status = "Profile fetched. Loading..";
            // Next Screens
            if(!profile_me.city) {
                next_state = "app.location";
            }
            else if(!profile_me.passions) {
                next_state = "app.passions.add";
            }
            else {
                next_state = "app.dashboard";
            }
            init_background_sync();
        })
        .catch(function (error) {
            if(window.Connection && navigator.connection.type == Connection.NONE) {
                $scope.fb_data.status = "No Internet Connection";
            }
            else {
                console.log(error);
                $scope.fb_data.status = "Unexpected Error: " + error;
            }
        });
    };

    $scope.clear_storage = function() {
        indexedDB.webkitGetDatabaseNames().onsuccess = function(sender,args)
        {
            for(var i=0; i < sender.target.result.length; i++) {
                indexedDB.deleteDatabase(sender.target.result[i]);
            }
        };
        localStorage.clear();

        var cookies = document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    };


})

.controller('LocationsController', function($scope, $state, $ionicPopover, $ionicModal, DbManager) {

    $scope.ui = { new_city : false, city : "" };
    $scope.cities = [];
    $scope.countries = [];
    $scope.selected_country = {};
    $scope.show_loading = true;

    DbManager.get("passions_db")
    .then(function(passions_db) {
        return passions_db.query("cities");
    })
    .then(function(result) {
        for(i in result.rows) {
            $scope.cities.push(result.rows[i].value);
        }
        $scope.show_loading = false;
    })
    .catch(function(err) {
        console.log(err);
    });

    DbManager.get("passions_db")
    .then(function(passions_db) {
        return passions_db.query("countries");
    })
    .then(function(result) {
        var country;
        for(i in result.rows) {
            country = result.rows[i].value;
            //TODO: Localize this based on GeoManager's input
            if(country.code == 'in') $scope.selected_country = country;
            $scope.countries.push(country);
        }
    })
    .catch(function(err) {
        console.log(err);
    });


    $scope.select_city = function(city) {
        DbManager.get("profiles_db")
        .then(function(profiles_db) {
            return profiles_db.upsert(window.localStorage.user_id, function(doc) {
                if(!doc.type) {
                    doc["type"] = "profile";
                }
                doc['city'] = city.name;
                doc['city_id'] = city._id;
                return doc;
            });
        })
        .then(function() {
            DbManager.sync("profiles_db");
        })
        .catch(function(err) {
            $scope.ui.status = "Error: " + err;
        });
        $state.go("app.passions.add");
    };

    $ionicModal.fromTemplateUrl('templates/country_selector.html', {
        scope: $scope
    })
    .then(function(modal) {
        $scope.modal = modal;
    });

    $scope.show_countries = function($event) {
        $scope.modal.show();
    };

    $scope.select_country = function(country) {
        $scope.selected_country = country;
        $scope.modal.hide();
    };

    $scope.add_city = function() {
        var city = {};
        city.name = $scope.ui.city;
        city.country_id = $scope.selected_country._id;
        city.country = $scope.selected_country.name;
        city.slug = DbManager.slug(city.name + ' ' + city.country);
        city.type = 'city';
        city._id = 'cit-' + city.slug;
        DbManager.get("passions_db")
        .then(function(passions_db) {
            return passions_db.put(city);
        });
        $scope.select_city(city);
    };

})

.controller('DashboardController', function($scope, $state, $ionicHistory, DbManager) {

    $scope.title = "TheCareApp";
    $scope.show_loading = false;
    $scope.show_actions = true;
    $scope.cards = [];
    var passion_ids = [];

    $scope.$on("$ionicView.enter", function() {
        if($scope.shared.dashboard_refresh) {
            $scope.show_loading = true;
            $scope.shared.dashboard_refresh = false;
            $scope.refresh();
        }
    });

    $scope.refresh = function() {
        DbManager.get("passions_db")
        .then(function(passions_db) {
            return DbManager.passion_ids().
            then(function(passion_ids) {
                return passions_db.allDocs({
                    include_docs: true,
                    keys: passion_ids
                });
            });
        })
        .then(function(result) {
            $scope.cards = [];
            for(i in result.rows) {
                var card = {};
                var passion = result.rows[i].doc;
                card.passion_id = passion._id;
                card.title = passion.name;
                card.text = "";
                card.order = 3;
                if(passion.stat_members) {
                    card.text = passion.stat_members + " members";
                }
                if(passion.stat_events) {
                    if(card.text.length > 0) {
                        card.text += ", ";
                    }
                    card.text += passion.stat_events + " events";
                    card.class = "item-energized";
                    card.order = 2;
                }
                if(passion.stat_messages) {
                    if(card.text.length > 0) {
                        card.text += ", ";
                    }
                    card.text += passion.stat_messages + " messages";
                    card.class = "item-balanced";
                    card.order = 1;
                }
                if(card.text.length == 0) {
                    card.text = "No Activity";
                }
                $scope.cards.push(card);
            }
            $scope.cards = $scope.cards.sort(function(a,b) {
                return a.order - b.order;
            });
            $scope.$broadcast('scroll.refreshComplete');
            $scope.show_loading = false;
        })
        .catch(function(err) {
            console.log(err);
        })
        ;
    };

})

;

