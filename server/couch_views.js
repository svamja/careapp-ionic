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


{
   "_id": "_design/cities",
   "language": "javascript",
   "views": {
       "all": {
           "map": "function(doc) { if(doc.type == 'city') { emit([doc._id], doc); }  }"
       }
   }
}


{
   "_id": "_design/profiles",
   "language": "javascript",
   "views": {
       "by_passion": {
           "map": "function(doc) { if(doc.type != 'profile' || !doc.passions) return; for(var i = 0, len = doc.passions.length; i < len; i++) emit(doc.passions[i].id, doc); }"
       }
   }
}

{
   "_id": "_design/messages",
   "language": "javascript",
   "views": {
       "by_passion_ts": {
           "map": "function(doc) { if(doc.passion_id && doc.posted_on) { emit([doc.passion_id, doc.posted_on], doc); } }"
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

