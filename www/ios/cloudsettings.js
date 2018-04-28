var onRestoreFn = function(){};

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
            return fail("parsing settings to JSON", e.message);
        }
        try{
            onSuccess(oData);
        }catch(e){
            return fail("calling success callback", e.message);
        }
    }, fail.bind(this, "loading settings"), 'CloudSettingsPlugin', 'load', []);
};

cloudsettings.save = function(settings, onSuccess, onError){
    var fail = function (operation, error) {
        if (onError) onError("CloudSettingsPlugin ERROR " + operation + ": " + error);
    };

    if(typeof settings !== "object" || typeof settings.length !== "undefined") throw "settings must be a key/value object!";

    // Record the data types
    var key, value, dataTypes = {};
    for(key in settings){
        value = settings[key];
        if(typeof value === "object"){
            if(typeof value.length === "undefined"){
                dataTypes[key] = "object";
            }else{
                dataTypes[key] = "array";
            }
        }else{
            dataTypes[key] = "string";
        }
    }

    try{
        var data = JSON.stringify(settings);
        dataTypes = JSON.stringify(dataTypes);
    }catch(e){
        return fail("convert settings to JSON", e.message);
    }
    cordova.exec(function(){
        try{
            onSuccess();
        }catch(e){
            return fail("calling success callback", e.message);
        }
    }, fail.bind(this, "saving settings"), 'CloudSettingsPlugin', 'save', [data, dataTypes]);
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

