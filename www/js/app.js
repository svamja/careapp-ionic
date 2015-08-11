// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('careapp', ['ionic', 'careapp.controllers'])

.run(function($ionicPlatform) {

    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }

        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

    });

})

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController'
    })

    .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu_template.html',
        controller: 'AppController'
    })

    .state('app.passions', {
        url: '/passions',
        views: {
            'mainContent': {
                templateUrl: 'templates/passions.html'
            }
        }
    })
    
    .state('app.location', {
        url: '/location',
        views: {
            'mainContent': {
                templateUrl: 'templates/location.html'
            }
        }
    })
    
    .state('app.dashboard', {
        url: '/dashboard',
        views: {
            'mainContent': {
                templateUrl: 'templates/dashboard.html'
            }
        }
    });


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

});
