angular.module('careapp.controllers')

.controller('PassionsController', function($scope, $state, $ionicHistory, $q, $timeout, DbManager) {
    $scope.ui = { search_val : "", queried_passions: [], trigger_search: false };
    $scope.user_passions = [];
    $scope.searchModel = { value: ""};
    passion_ids = [];
    $scope.categories = [];
    $scope.new_passion = {};

    $scope.$on("$ionicView.enter", function() {
        if($ionicHistory.currentView().stateName == "app.passions.add" &&
            $scope.ui.trigger_search) 
        {
            $scope.search_passions();
        }
    });


    DbManager.me()
    .then(function(me) {
        if(me && me.passions) {
            $scope.user_passions = me.passions;
            for(i in me.passions) {
                passion_ids.push(me.passions[i].id);
            }
        }
    });

    $scope.save = function() {
        // Check if there is any change detected
        DbManager.me()
        .then(function(me) {
            var new_passions = [];
            for(i in $scope.user_passions) {
                user_passion = {};
                user_passion['id'] = $scope.user_passions[i]['id'];
                user_passion['name'] = $scope.user_passions[i]['name'];
                new_passions.push(user_passion);
            }
            if(me && me.passions && 
                JSON.stringify(new_passions) == JSON.stringify(me.passions))
            {
                return $q.reject("no_change");
            }
            me.passions = new_passions;
            return me;
        })
        .then(function(me) {
            return DbManager.get("profiles_db")
            .then(function(profiles_db) {
                return profiles_db.put(me);
            });
        })
        .then(function(res) {
            DbManager.sync(true); // background sync of user profile
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $scope.shared.dashboard_refresh = true;
            $state.go("app.dashboard");
        })
        .catch(function(error) {
            if(error == "no_change") {
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go("app.dashboard");
                return;
            }
            //TODO: Display error to user
            console.log(error);
        });

    }

    $scope.search_passions = function() {
        var search_val = $scope.ui.search_val;
        if(search_val.length == 0) {
            $scope.ui.queried_passions = [];
        }
        if(search_val.length < 3) return;
        DbManager.get("passions_db")
        .then(function(passions_db) {
            return passions_db.query("passions/by_passion", {
                include_docs: true
            });
        })
        .then(function(res) {
            var queried_passions = [];
            for(i in res.rows) {
                passion = {
                    id: res.rows[i].doc._id,
                    name: res.rows[i].doc.name
                };
                if(passion['name'].toLowerCase().indexOf(search_val.toLowerCase()) != -1) {
                    queried_passions.push(passion);
                }
            }
            $scope.$apply(function() {
                $scope.ui.queried_passions = queried_passions;
            });
        });
    };

    $scope.add = function(passion) {
        if(passion_ids.indexOf(passion.id) == -1) {
            $scope.user_passions.push(passion);
            passion_ids.push(passion.id);
        }
        $scope.ui.search_val = "";
    }

    $scope.remove = function(passion) {
        var i = passion_ids.indexOf(passion.id);
        if(i > -1) {
            $scope.user_passions.splice(i, 1);
            passion_ids.splice(i, 1);
        }
    }

    DbManager.get("passions_db")
    .then(function(passions_db) {
        return passions_db.query("categories/by_order", {
            include_docs: true
        });
    })
    .then(function(result) {
        $scope.categories = [];
        if("rows" in result) {
            for(i in result.rows) {
                $scope.categories.push(result.rows[i].doc);
            }
        }
    })
    .catch(function(obj) {
        console.log(obj);
    });

    $scope.add_passion = function() {
        $scope.new_passion.name = $scope.ui.search_val;
        $state.go("app.passions.add_1");
    }

    $scope.select_category = function(category) {
        $scope.new_passion.category_id = category._id;

        // Save New Passion
        var passion = $scope.new_passion;
        passion.slug = DbManager.slug(passion.name);
        passion.type = 'passion';
        passion._id = 'pas-' + passion.slug;
        DbManager.get("passions_db")
        .then(function(passions_db) {
            return passions_db.put(passion);
        })

        // Go back to Add Passions screen
        $scope.ui.trigger_search = true;
        $state.go("app.passions.add");

    }

});
