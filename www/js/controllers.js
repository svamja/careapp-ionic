angular.module('careapp.controllers', [])

.controller('AppController', function($scope, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

})

.controller('PassionsController', function($scope, $state, $ionicHistory, $q) {
    $scope.ui_data = { button_text : "Skip" };
    $scope.ui_data.passions = [];
    $scope.user_passions = [];
    $scope.searchModel = { value: "book"};

    $scope.done = function() {
        $ionicHistory.nextViewOptions({
          // historyRoot: true,
          disableBack: true
        });
        $state.go("app.dashboard");
    }

    $scope.queryPassions = function(str) {
        var deferer = $q.defer();

        db.search({
            query: str,
            fields: ['name', 'search_keywords'],
            include_docs: true,
            highlighting: true
        })
        .then(function(res) {
            var passions = [];
            for(i in res.rows) {
                passion = {
                    id: res.rows[i].doc._id,
                    name: res.rows[i].doc.name
                };
                passions.push(passion);
            }
            deferer.resolve(passions);
        });


        // var result = [{id: 1, name: "Food for All"}, {id: 2, name: "Education of Children"}];
        // deferer.resolve(result);
        return deferer.promise;
    };

    passion_ids = [];

    $scope.add = function(passion) {
        if(passion_ids.indexOf(passion.id) == -1) {
            $scope.user_passions.push(passion);
            passion_ids.push(passion.id);
        }
        $scope.searchModel.value = "";
    }

    $scope.remove = function(passion) {
        var i = passion_ids.indexOf(passion.id);
        if(i > -1) {
            $scope.user_passions.splice(i, 1);
            passion_ids.splice(i, 1);
        }
    }

})

.controller('LoginController', function($scope, $state, $cordovaFacebook) {
    $scope.fb_data = { status: "Not connected" };

    $scope.login = function() {

        $scope.fb_data.status = "Connecting ..";

        if (window.cordova.platformId == "browser") {
            var appID = 1625721067678662;
            var version = "v2.0"; // or leave blank and default is v2.0
            facebookConnectPlugin.browserInit(appID, version);
            // var appId = prompt("Enter FB Application ID", "");
            // facebookConnectPlugin.browserInit(appId);
        }

        $cordovaFacebook.login(["public_profile", "email", "user_friends"]).then(
            function(success) {
                $scope.fb_data.status = "Connected";
                window.localStorage.is_logged_in = 1;
                if("has_passions" in window.localStorage) {
                    $state.go("app.dashboard");
                }
                else {
                    $state.go("app.passions");
                }
            },
            function (error) {
                $scope.fb_data.status = "Authentication Error";
                console.log(error);
            }
        );
    }
});

