/**
 *  Implementation of Unique Objects.
 *  Create a new object by:
 *  1. var Testing = Parse.UniqueObject.extend("Testing", {_uniqueKey: 'uniqColumn'});
 *  2. var Testing = Parse.UniqueObject("Testing", {uniqueKey:'entry'})
 *
 *  To save a unique object by the uniqueKey column, simply run obj.save()
 *  If you want to save a list of object to save latency, use Parse.UniqueObject.saveAllUnique
 *  instead of Parse.Object.saveAll.
 *
 **/ (function () {
    var tmpObj = {
        loaded: function () {
            Parse.UniqueObject = Parse.UniqueObject || _.extend(Parse.Object);
            Parse.UniqueObject.prototype.initialize = function () {
                if (!this._uniqueKey && this.attributes['uniqueKey']) {
                    this._uniqueKey = this.get('uniqueKey');
                    this.unset('uniqueKey');
                }
                if (this._uniqueKey) {
                    this.saveUnique = function () {
                        var args = Array.prototype.slice.call(arguments),
                            q = new Parse.Query(this.className),
                            options = args[args.length - 1];
                        if (args.length == 2 && args[0] !== null) {
                            this.set(args[0], args[1]);
                        } else if (args.length == 3) {
                            this.set(args[0], args[1], args[2]);
                        }
                        q.equalTo(this._uniqueKey, this.get(this._uniqueKey));
                        q.first({
                            success: function (result) {
                                if (!result) {
                                    Parse.Object.save.apply(this, args);
                                } else {
                                    if (options && options.exists && _.isFunction(options.exists)) {
                                        options.exists.apply(this, arguments);
                                    } else {
                                        console.log("exists");
                                    }
                                }
                            },
                            error: function (r) {
                                throw new Error("Could not check remote for object existence");
                            }
                        });
                    };
                }
            }
            Parse.UniqueObject.saveAllUnique = function (aToSave, oOptions) {
                var oldSave = Parse.Object.saveAll,
                    oClassContained = {},
                    aClassObjectToSave = [],
                    oUniqueClasses = {},
                    oClassKeys = {};
                _.each(aToSave, function (obj, i) {
                    var sClass = obj.className;
                    if (obj._uniqueKey) {
                        var objUniqueValue = obj.get(obj._uniqueKey);
                        oClassKeys[sClass] ? true : oClassKeys[sClass] = obj._uniqueKey;
                        oClassContained[sClass] ? oClassContained[sClass].push(objUniqueValue) : oClassContained[sClass] = [objUniqueValue];
                        oUniqueClasses[sClass] ? oUniqueClasses[sClass][objUniqueValue] = obj : (oUniqueClasses[sClass] = {
                            objUniqueValue: obj
                        });
                    } else {
                        aClassObjectToSave.push(obj);
                    }
                })
                console.log("Grouped items for unique save", oClassKeys, oClassContained, aClassObjectToSave);

                _.each(_.keys(oClassContained), function (sClass, i) {
                    var uniqueKey = oClassKeys[sClass],
                        queryObj = new Parse.Query(sClass);
                    queryObj.containedIn(uniqueKey, oClassContained[sClass]);
                    queryObj.find({
                        success: function (res) {
                            _.each(res, function (found, i) {
				// attempt to update
				var data = oClassContained[sClass][found.get(uniqueKey)];
				if (data && data instanceof Parse.Object) {
					found.save(data.toJSON(), {success:function(r){console.log(r.get(uniqueKey) + ' successfully updated')},error:function(r){console.log(r.get(uniqueKey) + ' was not updated')}});
				}
                                delete(oClassContained[sClass][found.get(uniqueKey)]);
                            });
                            // call old saveAll on remaining objects.
                            oldSave.call(null, oClassContained[sClass], oOptions);
                            console.log("Would have called the old save here");
                        },
                        error: function (res) {
                            console.log("Error attempting to find " + oClassContained[sClass].join(',') + " in class " + sClass + " under column " + uniqueKey);
                        }
                    });
                });

                oldSave.call(null, aClassObjectToSave, oOptions);
            }

            function TestUniqueObject() {
                var Testing = Parse.UniqueObject.extend("Testing", {
                    _uniqueKey: 'entry'
                });

                a = new Testing({
                    "entry": "doorway"
                });
                b = new Testing({
                    "entry": "alleyway"
                });
                c = new Testing({
                    "entry": "garage"
                });
                a.save();
                a.save(null, {
                    exists: function () {
                        console.log("this already exists")
                    }
                });
                b.save({
                    "entry": "entryValue",
                    "foo": "bar"
                }, {});
                c.save('entry', 'entryValue', {});

                d = new Testing({
                    "entry": "gangam style"
                });
                e = new Testing({
                    "entry": "blue ribbon"
                });

                Parse.UniqueObject.saveAllUnique([d, e], {
                    success: function (a) {
                        console.log("success: ", a);
                    },
                    error: function (b) {
                        console.log("error: ", b)
                    }
                });
            }
            //TestUniqueObject();

        },
        watch: function () {
            var that = this;
            this.timer = setInterval(function () {
                if (window.Parse) {
                    clearInterval(that.timer);
                    that.loaded();
                } else {
                    console.log("Parse not loaded yet");
                }
            }, 100);
        },
        timer: null
    }

    tmpObj.watch()

})();
