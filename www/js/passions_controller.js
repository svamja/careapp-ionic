angular.module('careapp.controllers')

.controller('PassionsController', function($scope, $state, $ionicHistory, $q) {
    $scope.ui_data = { button_text : "Skip" };
    $scope.user_passions = [];
    $scope.searchModel = { value: ""};

    $scope.done = function() {
        //TODO: Save user_passions
        console.log($scope.user_passions);

        $ionicHistory.nextViewOptions({
          // historyRoot: true,
          disableBack: true
        });
        $state.go("app.dashboard");
    }

    $scope.queryPassions = function(str) {
        var deferer = $q.defer();

        user_db.search({
            query: str,
            fields: ['name', 'search_keywords'],
            filter: function (doc) {
                return doc.type === 'passion'; // only index persons
            },
            include_docs: true,
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
            deferer.resolve(passions);
        });

        return deferer.promise;
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

    user_db.query("categories/by_order", {
        include_docs: true
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

        // Get Sub-categories
        // user_db.query("sub_categories/by_category", {
        //     key: [category._id],
        //     include_docs: true
        // })
        // .then(function(result) {
        //     $scope.sub_categories = [];
        //     if("rows" in result) {
        //         for(i in result.rows) {
        //             $scope.sub_categories.push(result.rows[i].doc);
        //         }
        //     }
        // })
        // .catch(function(obj) {
        //     console.log(obj);
        // });
        // $state.go("passions.add_2");

        // Save New Passion
        var passion = $scope.new_passion;
        passion.slug = slug(passion.name);
        passion.type = 'passion';
        passion._id = 'pas-' + passion.slug;
        user_db.put(passion);

        // Go back to Add Passions screen
        $state.go("passions.add");

    }

    // $scope.select_sub_category = function(sub_category) {
    //     $scope.new_passion.sub_category_id = sub_category._id;
    //     var passion = $scope.new_passion;
    //     passion.slug = slug(passion.name);
    //     passion.type = 'passion';
    //     passion._id = 'pas-' + passion.slug;
    //     user_db.put(passion);
    //     $state.go("passions.add");
    // }

});
