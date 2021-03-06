// CareApp

angular.module('careapp', ['ionic', /*'ionic.service.core','ionic.service.analytics',*/ 'ngCordova', 'careapp.controllers', 'careapp.services'])

.run(function($ionicPlatform/*, $ionicAnalytics */) {

    $ionicPlatform.ready(function() {

        // Register to ionic analytics
        // $ionicAnalytics.register();

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
        abstract: true,
        template: '<ion-nav-view></ion-nav-view>',
        controller: 'LoginController'
    })

    .state('login.1', {
        url: '/1',
        templateUrl: 'templates/login.html'
    })

    .state('login.2', {
        url: '/2',
        templateUrl: 'templates/sync_progress.html'
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
        templateUrl: 'templates/messages.html',
        controller: 'MessagesController'
    })

    .state('app.feed.members', {
        url: '/members',
        templateUrl: 'templates/members.html',
        controller: 'MembersController'
    })

    .state('app.feed.events', {
        url: '/events',
        templateUrl: 'templates/events.html',
        controller: 'EventsController'
    })

    .state('app.feed.create_event', {
        url: '/create_event',
        templateUrl: 'templates/create_event.html',
        controller: 'EventsController'
    })
    ;


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/home');

    // Align Titles to Left
    $ionicConfigProvider.navBar.alignTitle('left');

    // No text on back button
    $ionicConfigProvider.backButton.previousTitleText(false).text('');

})

.directive('expandingTextarea', function() {
    return {
        restrict: 'A',
        controller: function($scope, $element) {
            $element.css('overflow-y','hidden');
            $element.css('resize','none');
            resetHeight();
            adjustHeight();

            function resetHeight() {
                $element.css('height', 0 + 'px');
            }

            function adjustHeight() {
                var height = angular.element($element)[0]
                    .scrollHeight;
                $element.css('height', height + 'px');
                $element.css('max-height', height + 'px');
            }

            function keyPress(event) {
                // this handles backspace and delete
                // if (_.contains([8, 46], event.keyCode)) {
                if (event.keyCode == 8 || event.keyCode == 46) {
                    resetHeight();
                }
                adjustHeight();
            }

            $element.bind('keyup change blur', keyPress);

        }
    };
})

;
