// CareApp

angular.module('careapp', ['ionic','ionic.service.core','ionic.service.analytics', 'ngCordova', 'careapp.controllers', 'careapp.services'])

.run(function($ionicPlatform, $ionicAnalytics) {

    $ionicPlatform.ready(function() {

        // Register to ionic analytics
        $ionicAnalytics.register();

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }

        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

    });

})

.config(function($stateProvider, $urlRouterProvider, $cordovaFacebookProvider, $ionicConfigProvider) {

    $stateProvider

    .state('home', {
        url: '/home',
        controller: 'HomeController'
    })

    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController'
    })

    .state('app', {
        url: '',
        abstract: true,
        templateUrl: 'templates/menu_template.html',
        controller: 'AppController'
    })

    .state('app.location', {
        url: '/location',
        views: {
            'mainContent': {
                templateUrl: 'templates/location.html',
                controller: 'LocationsController'
            }
        }
    })
    
    .state('app.dashboard', {
        url: '/dashboard',
        views: {
            'mainContent': {
                templateUrl: 'templates/dashboard.html',
                controller: "DashboardController"
            }
        }
    })

    .state('app.passions', {
        url: '/passions',
        abstract: true,
        views: {
            'mainContent': {
                template: '<ion-nav-view></ion-nav-view>',
                controller: "PassionsController"
            }
        }
    })

    .state('app.passions.add', {
        url: '/add',
        templateUrl: 'templates/passions.html'
    })
    
    .state('app.passions.add_1', {
        url: '/add_1',
        templateUrl: 'templates/passion_add_1.html'
    })
    
    .state('app.passions.add_2', {
        url: '/add_2',
        templateUrl: 'templates/passion_add_2.html'
    })

    .state('app.feed', {
        url: '/feed/:passion_id',
        abstract: true,
        cache: false,
        views: {
            'mainContent': {
                templateUrl: 'templates/feed.html',
                controller: "FeedController"
            }
        }
    })

    .state('app.feed.messages', {
        url: '/messages',
        views: {
            'tab-messages': {
                templateUrl: 'templates/messages.html',
                controller: 'MessagesController'
            }
        }
    })

    .state('app.feed.members', {
        url: '/members',
        views: {
            'tab-members': {
                templateUrl: 'templates/members.html',
                controller: 'MembersController'
            }
        }
    })


    ;


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/home');

    // Align Titles to Left
    $ionicConfigProvider.navBar.alignTitle('left');

    // No text on back button
    $ionicConfigProvider.backButton.previousTitleText(false).text('');

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
