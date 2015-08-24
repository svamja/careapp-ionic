angular.module('careapp.controllers')

.controller('PassionsController', function($scope, $state, $ionicHistory, $q, DbManager) {
    $scope.ui_data = { button_text : "Skip" };
    $scope.user_passions = [];
    $scope.searchModel = { value: ""};

    $scope.done = function() {
        DbManager.get("profiles_db")
        .then(function(profiles_db) {
            return profiles_db.upsert(window.localStorage.user_id, function(doc) {
                new_doc = {
                    "type" : "profile",
                    "passions" : [],
                };
                for(i in $scope.user_passions) {
                    user_passion = {};
                    user_passion['id'] = $scope.user_passions[i]['id'];
                    user_passion['name'] = $scope.user_passions[i]['name'];
                    new_doc.passions.push(user_passion);
                }
                console.log(new_doc);
                return new_doc;
            });
        })
        .then(function() {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
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

    passion_ids = [];

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

    $scope.categories = [];
    $scope.sub_categories = [];

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
        $state.go("passions.add_1");
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
        $state.go("passions.add");

    }

});
