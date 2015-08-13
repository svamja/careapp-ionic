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
    $scope.done = function() {
        $ionicHistory.nextViewOptions({
          // historyRoot: true,
          disableBack: true
        });
        $state.go("app.dashboard");
    }

    $scope.queryPassions = function(str) {
        var deferer = $q.defer();
        var result = [{id: 1, name: "Food for All"}, {id: 2, name: "Education of Children"}];
        deferer.resolve(result);
        return deferer.promise;
   };

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

