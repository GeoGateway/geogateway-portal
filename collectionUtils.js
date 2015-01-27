/**
* I've freely borrowed code from 
* http://www.raywenderlich.com/61078/write-simple-node-jsmongodb-web-service-ios-app
*/ 
var ObjectID = require('mongodb').ObjectID;

CollectionUtils = function(db) {
  this.db = db;
};

CollectionUtils.prototype.createCollection = function(collectionName, callback) {
	 this.db.createCollection(collectionName, function(error, result) {
		  callback(error, result);
	 });
};

CollectionUtils.prototype.getCollection = function(collectionName, callback) {
	 this.db.collection(collectionName, function(error, the_collection) {
		  callback(error, the_collection);
	 });
};

//find all objects for a collection
CollectionUtils.prototype.findAll = function(collectionName, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
        if( error ) callback(error)
        else {
				the_collection.find().toArray(function(error, results) { 
					 callback(error, results)
				});
      }
    });
};


//Find a specific object
CollectionUtils.prototype.getById = function(collectionName, id, callback) { 
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error)
        else {
            var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$"); 
            if (!checkForHexRegExp.test(id)) callback({error: "invalid id"});
            else the_collection.findOne({'_id':ObjectID(id)}, function(error,doc) { 
            	if (error) callback(error)
            	else callback(null, doc);
            });
        }
    });
}

//Save new object
//Note that .insert method is very strict on JSON formatting.
CollectionUtils.prototype.save = function(collectionName, obj, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
        if( error ) callback(error)
        else {
				obj.creationTime = new Date(); 
            obj.status="New";
				the_collection.insert(obj, function() { 
					 callback(null, obj);
				});
        }
    });
};

//Update a specific object
CollectionUtils.prototype.update = function(collectionName, entityId, obj, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error)
        else {
				//Find the original object.  We'll retain the creationTime value but
				//discard everything else.
				the_collection.findOne({'_id':ObjectID(entityId)},function(error, doc){
					 if(error) {
						  console.log(error);
					 }
					 else {
						  obj._id = ObjectID(entityId); //Convert to a real obj id
						  obj.creationTime=doc.creationTime;
						  obj.updateTime = new Date(); 
						  the_collection.save(obj, function(error,doc) {
            				if (error) callback(error)
            				else callback(null, obj);
						  });
						  
					 }
				});
        }
    });
}

//Delete a specific object
CollectionUtils.prototype.delete = function(collectionName, entityId, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
        if (error) {
				console.error("Could not get the collection:",error);
				callback(error);
		  }
        else {
            the_collection.remove({'_id':ObjectID(entityId)}, function(error,doc) { 
            	 if (error) {
						  console.error("Could not remove the document from the collection", error);
						  callback(error);
					 }
            	else callback(null, doc);
            });
        }
    });
}

exports.CollectionUtils = CollectionUtils;