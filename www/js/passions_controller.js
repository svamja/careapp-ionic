angular.module('careapp.controllers')

.controller('PassionsController', function($scope, $state, $ionicHistory, $q, $timeout, DbManager) {
    $scope.ui_data = { button_text : "Skip" };
    $scope.user_passions = [];
    $scope.searchModel = { value: ""};
    passion_ids = [];
    $scope.categories = [];


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
            $scope.dashboard_refresh = true;
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
            $scope.dashboard_refresh = true;
            $state.go("app.dashboard");
        })
        .catch(function(error) {
            //TODO: Display error to user
            console.log(error);
        });

    }

    $scope.queryPassions = function(str) {
        return DbManager.get("passions_db")
        .then(function(passions_db) {
            return passions_db.search({
                query: str,
                fields: ['name', 'search_keywords'],
                filter: function (doc) {
                    return doc.type === 'passion'; // only index persons
                },
                include_docs: true,
            });
        })
        .then(function(res) {
            var passions = [];
            for(i in res.rows) {
                passion = {
                    id: res.rows[i].doc._id,
                    name: res.rows[i].doc.name
                };
                passions.push(passion);
            }
            return passions;
        });
    };

    $scope.add = function(passion) {
        if(passion_ids.indexOf(passion.id) == -1) {
            $scope.user_passions.push(passion);
            passion_ids.push(passion.id);
        }
        $scope.searchModel.value = "";
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

    $scope.new_passion = {};
    $scope.add_passion = function() {
        $scope.new_passion.name = $scope.searchModel.value;
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
        $state.go("app.passions.add");
        var prev_value = $scope.searchModel.value;
        $scope.searchModel.value = "";
        $timeout(function() {
            $scope.searchModel.value = prev_value;
        }, 1000);

    }

});
