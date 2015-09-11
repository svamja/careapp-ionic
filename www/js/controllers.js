angular.module('careapp.controllers', ['yaru22.angular-timeago'])

.directive('expandingTextarea', function() {
  return {
    restrict: 'A',
    controller: function($scope, $element) {
      $element.css('overflow-y','hidden');
      $element.css('resize','none');
      resetHeight();
      adjustHeight();

      function resetHeight() {
        $element.css('height', 0 + 'px');
      }

      function adjustHeight() {
        var height = angular.element($element)[0]
          .scrollHeight;
        $element.css('height', height + 'px');
        $element.css('max-height', height + 'px');
      }

      function keyPress(event) {
        // this handles backspace and delete
        // if (_.contains([8, 46], event.keyCode)) {
        if (event.keyCode == 8 || event.keyCode == 46) {
          resetHeight();
        }
        adjustHeight();
      }

      $element.bind('keyup change blur', keyPress);

    }
  };
})

.controller('AppController', function($scope, $state, $ionicHistory) {

    $scope.logout = function() {
        window.localStorage.removeItem("is_logged_in");
        window.localStorage.removeItem("user_id");
        window.localStorage.removeItem("user_token");
        window.localStorage.removeItem("profile_me");
        window.localStorage.removeItem("passion_ids");
        $ionicHistory.nextViewOptions({
            historyRoot: true
        });
        $state.go("login");
    };
    $scope.menu_title = "Menu";
})

.controller('HomeController', function($scope, $state) {
    $scope.$on('$ionicView.enter', function(e) {
        if("is_logged_in" in window.localStorage) {
            $state.go("app.dashboard");
        }
        else {
            $state.go("login");
        }
    });
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

        // Call Facebook API
        $cordovaFacebook.login(["public_profile", "email", "user_friends"])
        .then(function(fb_response) {
            if(!fb_response.status || fb_response.status != "connected") {
                throw "CN34";
            }
            $scope.fb_data.status = "Fetching Profile..";
            // Create user on DB Server
            return UserManager.login(fb_response);
        })
        .then(function(login_response) {
            if(login_response.status != "success" || !login_response.token) {
                console.log(login_response);
                throw "CN42";
            }
            // Save User on Profiles DB on Local
            return DbManager.get("profiles_db")
            .then(function(profiles_db) {
                // Upsert User Profile
                return profiles_db.upsert(window.localStorage.user_id, function(doc) {
                    doc["type"] = "profile";
                    doc["last_seen"] = Date.now();
                    if(login_response.fb_picture) {
                        doc['fb_picture'] = login_response.fb_picture;
                    }
                    doc['display_name'] = login_response.display_name;
                    doc['gender'] = login_response.gender;
                    return doc;
                });
            })
        })
        .then(function() {
            // Get User Profile from Local DB
            return DbManager.me();
        })
        .then(function(profile_me) {
            window.localStorage.is_logged_in = 1;

            $scope.fb_data.status = "Profile fetched. Loading..";
            // Redirect
            if(!profile_me.city) {
                $state.go("app.location");
            }
            else if(!profile_me.passions) {
                $state.go("app.passions.add");
            }
            else {
                $state.go("app.dashboard");
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
                historyRoot: true
            });
            if("has_passions" in window.localStorage) {
                $state.go("app.dashboard");
            }
            else {
                $state.go("app.passions.add");
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
            window.localStorage.cached_cards = JSON.stringify($scope.cards);
            $scope.$broadcast('scroll.refreshComplete');
            $scope.show_loading = false;
        })
        ;
    };

    if(window.localStorage.cached_cards) {
        $scope.cards = JSON.parse(window.localStorage.cached_cards);
    }
    else {
        $scope.refresh();
        $scope.show_loading = true;
    }


})

.controller('FeedController', function($scope, $state, $stateParams, DbManager) {
    var passion_id = $stateParams.passion_id;
    $scope.passion_id = passion_id;
    DbManager.get("passions_db")
    .then(function(passions_db) {
        return passions_db.get(passion_id);
    })
    .then(function(passion) {
        $scope.passion = passion;
    });
})

.controller('MembersController', function($scope, $state, $stateParams, DbManager) {
    $scope.members = [];
    DbManager.get("profiles_db")
    .then(function(profiles_db) {
        return profiles_db.query("profiles/by_passion", {
            key : $stateParams.passion_id
        });
    })
    .then(function(result) {
        for(i in result.rows) {
            var member = result.rows[i].value;
            $scope.members.push(member);
        }
    })
    .catch(function(err) {
        console.log(err);
        //TODO: Show Error
    })
    ;

})

.controller('MessagesController', function($scope, $state, $stateParams, DbManager) {
    $scope.messages = [];
    $scope.chat = { text : "", class: "positive" };

    var refresh_messages = function() {
        $scope.messages = [];
        DbManager.get("messages_db", true)
        .then(function(messages_db) {
            return messages_db.query("messages/by_passion_ts", {
                startkey : [$stateParams.passion_id, 1],
                endkey : [$stateParams.passion_id, Date.now() + 1000000],
            });
        })
        .then(function(result) {
            for(i in result.rows) {
                var message = result.rows[i].value;
                message.text = message.text.replace(/(?:\r\n|\r|\n)/g, '<br />');
                $scope.messages.push(message);
            }
        })
        .catch(function(err) {
            console.log(err);
            //TODO: Show Error
        });
    };

    $scope.send_message = function() {
        DbManager.get("messages_db")
        .then(function(messages_db) {
            return DbManager.me()
            .then(function(profile_me) {
                return messages_db.post({
                    passion_id: $stateParams.passion_id,
                    author_id: profile_me._id,
                    author_name: profile_me.display_name,
                    city: profile_me.city,
                    fb_picture: profile_me.fb_picture,
                    text: $scope.chat.text,
                    posted_on: Date.now()
                });
            });
        })
        .then(function() {
            $scope.chat.text = "";
            refresh_messages();
        })
        .catch(function() {
            $scope.chat.class = "assertive";
        })
        ;
    };

    refresh_messages();


})

;

