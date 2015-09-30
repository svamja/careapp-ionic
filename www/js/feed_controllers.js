angular.module('careapp.controllers')

.controller('FeedController', function($scope, $state, $stateParams, $ionicHistory, DbManager) {

    $scope.ui = {};
    $scope.ui.class = {
        "messages" : "dark",
        "events" : "dark",
        "members" : "dark"
    };
    var passion_id = $stateParams.passion_id;
    $scope.passion_id = passion_id;
    DbManager.get("passions_db")
    .then(function(passions_db) {
        return passions_db.get(passion_id);
    })
    .then(function(passion) {
        $scope.passion = passion;
    });

    $scope.switch_to = function(sub_state) {
        $ionicHistory.nextViewOptions({
            disableAnimate: true
        });
        $state.go("app.feed." + sub_state, { passion_id: passion_id });
        $scope.ui.class = {
            "messages" : "dark",
            "events" : "dark",
            "members" : "dark"
        };
        if(sub_state == 'create_event') {
            $scope.ui.class['events'] = "calm";
        }
        else {
            $scope.ui.class[sub_state] = "calm";
        }
    };


})

.controller('MessagesController', function($scope, $state, $stateParams, 
                    $timeout, $ionicHistory, $ionicScrollDelegate, DbManager)
{

    $scope.messages = [];
    $scope.chat = { text : "", class: "positive" };
    $scope.ui.class.messages = "calm";
    var last_ts = 0;

    DbManager.me()
    .then(function(profile_me) {
        $scope.profile_me = profile_me;
    });

    var my_state_name = $ionicHistory.currentView().stateName;
    var scroll_handle = $ionicScrollDelegate.$getByHandle('messages-content');
    var scroll_animation = false;

    var refresh_messages = function() {
        if($ionicHistory.currentView().stateName != my_state_name) return;
        DbManager.get_local("messages_db")
        .then(function(messages_db) {
            return messages_db.query("messages/by_passion_ts", {
                startkey : [$stateParams.passion_id, last_ts + 1],
                endkey : [$stateParams.passion_id, Date.now() + 1000000],
            });
        })
        .then(function(result) {
            if(!result.rows || result.rows.length == 0) {
                return;
            }
            for(i in result.rows) {
                var message = result.rows[i].value;
                message.text = message.text.replace(/(?:\r\n|\r|\n)/g, '<br />');
                $scope.messages.push(message);
                last_ts = message.posted_on;
            }
            $timeout(function() {
                scroll_handle.scrollBottom(scroll_animation);
                if(!scroll_animation) {
                    scroll_animation = true;
                }
            }, 50);
        })
        .catch(function(err) {
            console.log(err);
            //TODO: Show Error
        });
        DbManager.sync("messages_db"); // background sync of messages
        $timeout(refresh_messages, 3000);
    };

    $scope.send_message = function() {
        if(!$scope.profile_me) return; // wait until user profile loads up

        DbManager.get("messages_db")
        .then(function(messages_db) {
            return messages_db.post({
                passion_id: $stateParams.passion_id,
                author_id: $scope.profile_me._id,
                author_name: $scope.profile_me.display_name,
                city: $scope.profile_me.city,
                fb_picture: $scope.profile_me.fb_picture,
                text: $scope.chat.text,
                posted_on: Date.now()
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

.controller('MembersController', function($scope, $state, $stateParams, $ionicHistory, DbManager) {

    $scope.members = [];
    $scope.ui.class.members = "calm";
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
    });

})

.controller('EventsController', function($scope, $state, $stateParams, $ionicHistory, DbManager) {
    $scope.ui.class.events = "calm";
    $scope.ui.centered_button = false;
    $scope.ui.footer_button = false;
    $scope.events = [];
    var last_ts = 0;
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    $scope.new_event = {
        start_date: tomorrow,
        start_time: new Date(1970, 0, 1, 10, 00, 0),
        passion_id: $stateParams.passion_id,
        author_id: window.localStorage.user_id
    };

    var get_events = function() {
        DbManager.get_local("events_db")
        .then(function(events_db) {
            // Upcoming Events
            var options = {
                startkey : [$stateParams.passion_id, Date.now() - 3600 ],
                endkey : [$stateParams.passion_id, Date.now() + 31536000000]
            };
            console.log(options);
            return events_db.query("events/by_passion_ts", options);

        })
        .then(function(result) {
            console.log(result);
            if(result.rows && result.rows.length > 0) {
                $scope.$apply(function() {
                    $scope.events = [];
                    for(i in result.rows) {
                        var event = result.rows[i].value;
                        $scope.events.push(event);
                        last_ts = event.start_time;
                    }
                })
            }
            $scope.ui.footer_button = $scope.events.length > 0;
            $scope.ui.centered_button = !$scope.ui.footer_button;
        })
        .catch(function(err) {
            console.log(err);
            //TODO: Show Error
        });
        DbManager.sync("events_db");
    };

    $scope.$on("$ionicView.enter", function() {
        if($ionicHistory.currentView().stateName == "app.feed.events")
        {
            get_events();
        }
    });

    $scope.create_event = function(form) {
        if(form.$invalid) {
            return;
        }
        DbManager.get_local("events_db")
        .then(function(events_db) {
            var new_event = angular.copy($scope.new_event);
            var date_time = angular.copy(new_event.start_date);
            date_time.setHours(new_event.start_time.getHours());
            date_time.setMinutes(new_event.start_time.getMinutes());
            date_time.setSeconds(0);
            new_event.type = 'event';
            new_event.start_ts = date_time.getTime();
            delete new_event.start_date;
            delete new_event.start_time;
            return events_db.post(new_event);
        })
        .then(function(result) {
            $state.go("app.feed.events");
        })
        .catch(function(err) {
            console.log(err);
            //TODO: Show Error
        });
    };


})

;
