var db = new PouchDB('http://localhost:5984/careapp_user_db');

slug = function(str)
{
    return str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
};

/* Older version
categories = [
    {
        name: "Health and Basic Needs",
        sub_categories: [
            "Food",
            "Shelter",
            "Water",
            "Healthcare"
        ]
    },
    {
        name: "Social",
        sub_categories: [
            "Discrimination",
            "Local Issues"
        ]
    },
    {
        name: "Education",
        sub_categories: [
            "Child Education",
            "Teen Education",
            "Adult Education"
        ]
    },
    {
        name: "Peace and Security",
        sub_categories: [
            "Women Safety",
            "Child Safety",
            "Domestic Peace"
        ]
    },
    {
        name: "Animal Protection",
        sub_categories: [
            "Domestic Animal Protection",
            "Wild Animal Protection",
            "Other Lives Protection"
        ]
    },
    {
        name: "Environment",
        sub_categories: [
            "Plantation and Forestation",
            "Air and Atmosphere Control",
            "Earth",
            "Oceans and Water Bodies"
        ]
    },
    {
        name: "Other"
    }
];
*/

/* Newer version - only categories, no subcategories */

categories = [
    { name: "Basic Needs" },
    { name: "Health" },
    { name: "Social" },
    { name: "Children & Youth" },
    { name: "Women" },
    { name: "Seniors & Specially Abled" },
    { name: "Animals" },
    { name: "Safety" },
    { name: "Environment" },
    { name: "Spiritual" },
    { name: "Happiness" },
    { name: "Others" }
];

put_categories = function() {
    for(i in categories) {
        category = categories[i].name;
        category_slug = slug(category);
        category_id = 'cat-' + category_slug;
        var doc_diff_function = function(order, category) {
            return function(doc) {
                category_slug = slug(category);
                return {
                    "type" : "category",
                    "slug" : category_slug,
                    "name" : category,
                    "order" : order
                };
            }
        }

        i = parseInt(i);
        db.upsert(category_id, doc_diff_function(i+1, category));

        if("sub_categories" in categories[i]) {
            for(j in categories[i].sub_categories) {
                sub_category = categories[i].sub_categories[j];
                sub_category_slug = slug(sub_category);
                sub_category_id = 'sub-' + sub_category_slug;
                db.put({
                    "_id" : sub_category_id,
                    "type" : "sub_category",
                    "category_id" : category_id,
                    "slug" : sub_category_slug,
                    "name" : sub_category
                });
            }
        }
    }
}

delete_categories = function() {

    // Delete Categories
    db.query("categories/by_order")
    .then(function(result) {
        console.log(result);
        $(result.rows).each(function(i, row) {
            doc = row.value;
            db.remove(doc);
        });
    })
    .catch(function(obj) {
        console.log(obj);
    });

    // Delete Sub-categories
    db.query("sub_categories/by_category")
    .then(function(result) {
        console.log(result);
        $(result.rows).each(function(i, row) {
            doc = row.value;
            db.remove(doc);
        });
    })
    .catch(function(obj) {
        console.log(obj);
    });



}


$(function() {

});