angular.module('careapp.controllers', [])

.controller('AppController', function($scope, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

})

.controller('LoginController', function($scope, $state, $cordovaFacebook, UserManager) {
    $scope.fb_data = { status: "Not connected" };

    $scope.login = function() {

        $scope.fb_data.status = "Connecting ..";

        if (window.cordova.platformId == "browser") {
            var appID = 1625721067678662;
            var version = "v2.0"; // or leave blank and default is v2.0
            facebookConnectPlugin.browserInit(appID, version);
        }

        $cordovaFacebook.login(["public_profile", "email", "user_friends"]).then(
            function(response) {
                UserManager.log_fb_response(response)
                .then(function(obj){

                }, function(obj){
                    console.log("attempt write failed");
                });
                if(response.status && response.status == "connected") {
                    $scope.fb_data.status = "Connected";
                    window.localStorage.is_logged_in = 1;
                    if("has_passions" in window.localStorage) {
                        $state.go("app.dashboard");
                    }
                    else {
                        $state.go("passions.add");
                    }
                }
                else {
                    $scope.fb_data.status = "Unexpected Error CN41";
                    console.log(success);
                }
            },
            function (error) {
                $scope.fb_data.status = "Authentication Error";
                console.log(error);
            }
        );
    }
});

