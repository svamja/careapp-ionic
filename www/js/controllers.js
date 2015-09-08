angular.module('careapp.controllers', [])

.controller('AppController', function($scope, $state, $ionicHistory) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    
    $scope.logout = function() {
        window.localStorage.removeItem("is_logged_in");
        window.localStorage.removeItem("user_id");
        window.localStorage.removeItem("user_token");
        window.localStorage.removeItem("profile_me");
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        $state.go("login");
    };
    $scope.menu_title = "Menu";
})

.controller('LoginController', function($scope, $state, $cordovaFacebook, UserManager, DbManager, GeoManager) {
    $scope.fb_data = { status: "Not connected" };

    // Fetch Geolocation info in background.
    GeoManager.get_city_info();

    $scope.login = function() {

        //TODO: Handle No Internet use case
        $scope.fb_data.status = "Connecting ..";

        if (window.cordova.platformId == "browser") {
            var appID = 1625721067678662;
            var version = "v2.0"; // or leave blank and default is v2.0
            facebookConnectPlugin.browserInit(appID, version);
        }

        $cordovaFacebook.login(["public_profile", "email", "user_friends"])
        .then(function(fb_response) {
            if(!fb_response.status || fb_response.status != "connected") {
                throw "CN34";
            }
            $scope.fb_data.status = "Fetching Profile..";
            return UserManager.login(fb_response);
        })
        .then(function(login_response) {
            if(login_response.status != "success" || !login_response.token) {
                console.log(login_response);
                throw "CN42";
            }
            return DbManager.me();
        })
        .then(function(profile_me) {
            window.localStorage.is_logged_in = 1;
            $scope.fb_data.status = "Profile fetched. Loading..";
            if(!profile_me.city) {
                $state.go("app.location");
            }
            else if(profile_me.passions) {
                $state.go("app.dashboard");
            }
            else {
                $state.go("passions.add");
            }
        })
        .catch(function (error) {
            console.log(error);
            $scope.fb_data.status = "Unexpected Error: " + error;
        });
    }
})

.controller('LocationsController', function($scope, $state, $ionicHistory, DbManager, GeoManager) {
    $scope.ui_data = {
        status: "Fetching location ..",
        input_disabled : true
    };
    $scope.city_info = {};
    $scope.manual_link_flag = false;

    GeoManager.get_city_info()
    .then(function(city_info) {
        $scope.ui_data.status = "Location fetched!";
        $scope.city_info = city_info;
        $scope.manual_link_flag = true;
    })
    .catch(function(err) {
        console.log(err);
        $scope.ui_data.status = "Error fetching your location! Enter Manually.";
        $scope.ui_data.input_disabled = false;
    });

    $scope.enable_manual_entry = function() {
        $scope.ui_data.input_disabled = false;
        $scope.city_info = {};
    };

    $scope.save = function() {
        DbManager.get("profiles_db")
        .then(function(profiles_db) {
            return profiles_db.upsert(window.localStorage.user_id, function(doc) {
                if(!doc.type) {
                    doc["type"] = "profile";
                }
                doc["city_info"] = $scope.city_info;
                doc['city'] = $scope.city_info.city;
                return doc;
            });
        })
        .then(function() {
            DbManager.sync("profiles_db"); // Background Sync
            $scope.ui_data.status = "Profile updated. Moving on..";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            if("has_passions" in window.localStorage) {
                $state.go("app.dashboard");
            }
            else {
                $state.go("passions.add");
            }
        })
        .catch(function(err) {
            $scope.ui_data.status = "Error: " + err;
        })
        ;
    }
})

.controller('DashboardController', function($scope, $state, $ionicHistory, DbManager) {
    $scope.title = "TheCareApp";
    $scope.show_loading = false;
    $scope.show_actions = true;
    $scope.cards = [];
    var passion_ids = [];

    // DbManager.me()
    // .then(function(me) {
    //     if(me && me.city) {
    //         $scope.title = "My " + me.city;
    //     }
    //     return me;
    // });

    if(window.localStorage.cached_cards) {
        $scope.cards = JSON.parse(window.localStorage.cached_cards);
    }
    else {
        $scope.refresh();
        $scope.show_loading = true;
    }

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
            console.log($scope.cards);
            $scope.cards = $scope.cards.sort(function(a,b) {
                return a.order - b.order;
            });
            window.localStorage.cached_cards = JSON.stringify($scope.cards);
            $scope.$broadcast('scroll.refreshComplete');
        })
        ;
    }

})

;

