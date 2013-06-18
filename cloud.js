/***
**
**  The following is a sample beforeSave function for a Parse.Object which must be
**  unique on a single key "uniqueKey". This enforces the uniqueness on the server
**  by checking for any existing objects with the same uniqueKey value.
**
***/
Parse.Cloud.beforeSave("MyUniqueClass", function(req, res) {
	if (!req.object.get("uniqueKey")) {
		res.error("MyUniqueClass must provide a non-empty uniqueKey");
	} else {
		var q = new Parse.Query("MyUniqueClass");
		q.equalTo("uniqueKey", req.object.get("uniqueKey"));
		q.first({
			success:function(obj) { 
				if(obj){
					var json = obj.toJSON();
					console.log("existing object: " ); 
					console.log(json.objectId);
					console.log("request obj: ");
					console.log(req.object.toJSON());
					res.error(obj);
				} else{	
					res.success();
				}
			},
			error:function(error) { 
				res.error("Could not check uniqueness for this object" + req.object.get("uniqueKey")); 
			}
		});
	}
});

