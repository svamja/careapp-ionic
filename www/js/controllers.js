angular.module('careapp.controllers', [])

.controller('AppController', function($scope, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

})

.controller('LoginController', function($scope, $state, $cordovaFacebook, UserManager, DbManager, GeoManager) {
    $scope.fb_data = { status: "Not connected" };

    // Fetch Geolocation info in background.
    GeoManager.get_city_info();

    $scope.login = function() {

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

.controller('LocationsController', function($scope, $state, UserManager, GeoManager) {
    $scope.ui_data = {
        status: "Fetching location ..",
        input_disabled : true
    };
    $scope.city_info = {};
    
    GeoManager.get_city_info()
    .then(function(city_info) {
        $scope.ui_data.status = "Successfully fetched! Updating profile..";
        $scope.city_info = city_info;
    })
    .catch(function(err) {
        $scope.ui_data.status = "Error fetching your location. Enter your city name manually!";
        $scope.ui_data.input_disabled = false;
    });

    $scope.save = function() {
        UserManager.update_city($scope.city_info)
        .then(function() {
            $scope.ui_data.status = "Profile updated. Moving on..";
            $state.go("app.dashboard");
        })
        .catch(function(err) {
            $scope.ui_data.status = "Error: " + err;
        })
        ;
    }
})

;

