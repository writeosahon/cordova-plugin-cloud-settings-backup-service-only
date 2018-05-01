var onRestoreFn = function(){};

var merge = function () {
    var destination = {},
        sources = [].slice.call(arguments, 0);
    sources.forEach(function (source) {
        var prop;
        for (prop in source) {
            if (prop in destination && Array.isArray(destination[prop])) {

                // Concat Arrays
                destination[prop] = destination[prop].concat(source[prop]);

            } else if (prop in destination && typeof destination[prop] === "object") {

                // Merge Objects
                destination[prop] = merge(destination[prop], source[prop]);

            } else {

                // Set new values
                destination[prop] = source[prop];

            }
        }
    });
    return destination;
};

var cloudsettings = {};

cloudsettings.enableDebug = function(onSuccess) {
    return cordova.exec(onSuccess,
        null,
        'CloudSettingsPlugin',
        'enableDebug',
        []);
};

cloudsettings.load = function(onSuccess, onError){
    var fail = function (operation, error) {
        if (onError) onError("CloudSettingsPlugin ERROR " + operation + ": " + error);
    };
    cordova.exec(function(sData){
        try{
            var oData = JSON.parse(sData);
        }catch(e){
            return fail("parsing stored settings to JSON", e.message);
        }
        try{
            onSuccess(oData);
        }catch(e){
            return fail("calling success callback", e.message);
        }
    }, fail.bind(this, "loading stored settings"), 'CloudSettingsPlugin', 'load', []);
};

cloudsettings.save = function(settings, onSuccess, onError, overwrite){
    if(typeof settings !== "object" || typeof settings.length !== "undefined") throw "settings must be a key/value object!";

    var fail = function (operation, error) {
        if (onError) onError("CloudSettingsPlugin ERROR " + operation + ": " + error);
    };

    var doSave = function(){
        settings.timestamp = (new Date()).valueOf();
        try{
            var data = JSON.stringify(settings);
        }catch(e){
            return fail("convert settings to JSON", e.message);
        }
        cordova.exec(function(){
            try{
                onSuccess(settings);
            }catch(e){
                return fail("calling success callback", e.message);
            }
        }, fail.bind(this, "saving settings"), 'CloudSettingsPlugin', 'save', [data]);
    };

    if(overwrite){
        doSave();
    }else{
        cloudsettings.exists(function(exists){
            if(exists){
                // Load stored settings and merge them with new settings
                cloudsettings.load(function(stored){
                    settings = merge(stored, settings);
                    doSave();
                }, onError);
            }else{
                doSave();
            }
        });
    }
    
};

cloudsettings.exists = function(onSuccess){
    cordova.exec(onSuccess, null, 'CloudSettingsPlugin', 'exists', []);
};

cloudsettings.onRestore = function(fn){
    onRestoreFn = fn;
};

cloudsettings._onRestore = function(){
    onRestoreFn();
};

module.exports = cloudsettings;

