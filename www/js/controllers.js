angular.module('careapp.controllers', [])

.controller('AppController', function($scope, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

})

.controller('LoginController', function($scope, $state, $cordovaFacebook, UserManager, DbManager) {
    $scope.fb_data = { status: "Not connected" };

    //TODO: Prepare dropdown of cities in background.
    // DbManager.sync("passions_db");

    $scope.login = function() {

        //TODO: Location factory to get cached location here
        // http://ngcordova.com/docs/plugins/geolocation/
        // http://stackoverflow.com/a/6798005
        // Facebook alternative is weak, ie add permission of "user_location"

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
            $scope.fb_data.status = "Creating/Fetching Profile..";
            return UserManager.login(fb_response);
        })
        .then(function(login_response) {
            if(login_response.status != "success" || !login_response.token) {
                console.log(login_response);
                throw "CN42";
            }
            window.localStorage.user_id = login_response.user_id;
            window.localStorage.user_token = login_response.token;
            return login_response;
        })
        .then(function(login_response) {
            window.localStorage.is_logged_in = 1;
            $scope.fb_data.status = "Profile fetched. Loading..";
            if(!login_response.city) {
                $state.go("app.location");
            }
            else if("has_passions" in window.localStorage) {
                $state.go("app.dashboard");
            }
            else {
                $state.go("passions.add");
            }
        })
        .catch(function (error) {
            $scope.fb_data.status = "Unexpected Error: " + error;
        });
    }
})

.controller('LocationsController', function($scope, $state, UserManager) {
    $scope.city = "";
    $scope.save = function() {
        UserManager.update_city($scope.city);
        $state.go("app.dashboard");
    }
})

;

