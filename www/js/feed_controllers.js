angular.module('careapp.controllers')

.controller('FeedController', function($scope, $state, $stateParams, $ionicHistory, DbManager) {

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
    };

})

.controller('MessagesController', function($scope, $state, $stateParams, $ionicHistory, DbManager) {

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

.controller('MembersController', function($scope, $state, $stateParams, $ionicHistory, DbManager) {

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

;
