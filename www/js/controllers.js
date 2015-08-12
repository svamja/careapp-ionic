angular.module('careapp.controllers', [])

.controller('AppController', function($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});


})

.controller('LoginController', function($scope, $stateParams, $cordovaFacebook) {
    $scope.fb_data = {};
    $scope.fb_data.status = "uninitialized";

    $scope.login = function() {

        if (window.cordova.platformId == "browser") {
            var appID = 1625721067678662;
            var version = "v2.0"; // or leave blank and default is v2.0
            facebookConnectPlugin.browserInit(appID, version);
            // var appId = prompt("Enter FB Application ID", "");
            // facebookConnectPlugin.browserInit(appId);
        }

        $cordovaFacebook.login(["public_profile", "email", "user_friends"]).then(
            function(success) {
                $scope.fb_data.status = "connected";
                console.log(success);
            },
            function (error) {
                $scope.fb_data.status = "connect_error";
                console.log(error);
            }
        );
    }
});

