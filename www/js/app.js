// CareApp

var user_db = new PouchDB('careapp_user_db');
var remote_user_db = new PouchDB('http://localhost:5984/careapp_user_db');
user_id = 1;

user_db
.sync(remote_user_db, {
    filter: 'app/by_user',
    query_params: { "user_id": user_id }
})
.on('complete', function() {
    console.log('sync complete');
})
.on('error', function() {
    console.log('sync error');
});

var full_db = new PouchDB('http://localhost:5984/careapp_full_db');

slug = function(str)
{
    return str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
};

angular.module('careapp', ['ionic', 'ngCordova', 'careapp.controllers'])

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

.config(function($stateProvider, $urlRouterProvider, $cordovaFacebookProvider) {

    // var appID = 1625721067678662;
    // var version = "v2.0"; // or leave blank and default is v2.0
    // $cordovaFacebookProvider.browserInit(appID, version);

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
    })

    .state('passions', {
        url: '/passions',
        abstract: true,
        templateUrl: 'templates/menu_template.html',
        controller: 'PassionsController'
    })

    .state('passions.add', {
        url: '/add',
        views: {
            'mainContent': {
                templateUrl: 'templates/passions.html',
            }
        }
    })
    
    .state('passions.add_1', {
        url: '/add_1',
        views: {
            'mainContent': {
                templateUrl: 'templates/passion_add_1.html',
            }
        }
    })
    
    .state('passions.add_2', {
        url: '/add_2',
        views: {
            'mainContent': {
                templateUrl: 'templates/passion_add_2.html',
            }
        }
    })

    ;


    // if none of the above states are matched, use this as the fallback
    if("is_logged_in" in window.localStorage) {
        $urlRouterProvider.otherwise('/app/dashboard');
    }
    else {
        $urlRouterProvider.otherwise('/login');
    }

})

.directive('ionSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            getData: '&source',
            model: '=?',
            searchModel: '=?'
        },
        link: function(scope, element, attrs) {
            attrs.minLength = attrs.minLength || 0;
            scope.placeholder = attrs.placeholder || '';
            // scope.search = {value: ''};

            if (attrs.class)
                element.addClass(attrs.class);

            if (attrs.source) {
                scope.$watch('searchModel.value', function (newValue, oldValue) {
                    if (newValue.length > attrs.minLength) {
                        scope.getData({str: newValue}).then(function (results) {
                            scope.model = results;
                        });
                    } else {
                        scope.model = [];
                    }
                });
            }

            scope.clearSearch = function() {
                scope.searchModel.value = '';
            };
        },
        template: '<div class="item-input-wrapper">' +
                    '<i class="icon ion-android-search"></i>' +
                    '<input type="search" placeholder="{{placeholder}}" ng-model="searchModel.value">' +
                    '<i ng-if="searchModel.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                  '</div>'
    };
})

;
