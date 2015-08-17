// Views

{
   "_id": "_design/categories",
   "language": "javascript",
   "views": {
       "by_order": {
           "map": "function(doc) { if(doc.type == 'category') { emit([doc.order], doc); }  }"
       }
   }
}

{
   "_id": "_design/sub_categories",
   "language": "javascript",
   "views": {
       "by_category": {
           "map": "function(doc) { if(doc.type == 'sub_category') { emit([doc.category_id], doc); }  }"
       }
   }
}

{
   "_id": "_design/passions",
   "language": "javascript",
   "views": {
       "by_passion": {
           "map": "function(doc) { if(doc.type == 'passion') { emit([doc._id], doc); }  }"
       }
   }
}

// Filters


{
   "_id": "_design/app",
   "filters": {
       "by_user": "function(doc, req) { return true || doc.user_id === req.query.user_id; }"
   }
}

