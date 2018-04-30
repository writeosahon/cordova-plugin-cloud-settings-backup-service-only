var FILE_NAME = "cloudsettings.json";
var dirPath, filePath;

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

var resolveFilepath = function(){
    if(filePath) return;
    dirPath = cordova.file.dataDirectory;
    filePath = dirPath + FILE_NAME;
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
    resolveFilepath();
    var fail = function (operation, error) {
        if (onError) onError("CloudSettingsPlugin ERROR " + operation + ": " + error);
    };

    window.resolveLocalFileSystemURL(dirPath, function (dirEntry) {
        dirEntry.getFile(FILE_NAME, {
            create: false,
            exclusive: false
        }, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function() {
                    try{
                        var data = JSON.parse(this.result);
                    }catch(e){
                        return fail("parsing file contents to JSON", e.message);
                    }
                    try{
                        onSuccess(data);
                    }catch(e){
                        return fail("calling success callback", e.message);
                    }
                };
                reader.readAsText(file);
            }, fail.bind(this, "getting file handle"));
        }, fail.bind(this, "getting file entry"));
    }, fail.bind(this, "resolving storage directory"));
};

cloudsettings.save = function(settings, onSuccess, onError, overwrite){
    if(typeof settings !== "object" || typeof settings.length !== "undefined") throw "settings must be a key/value object!";

    resolveFilepath();
    var fail = function (operation, error) {
        if (onError) onError("CloudSettingsPlugin ERROR " + operation + ": " + error);
    };

    var doSave = function(){
        settings.timestamp = (new Date()).valueOf();
        try{
            var data = JSON.stringify(settings);
        }catch(e){
            return fail("converting settings to JSON", e.message);
        }
    
        window.resolveLocalFileSystemURL(dirPath, function (dirEntry) {
            dirEntry.getFile(FILE_NAME, {
                create: true,
                exclusive: false
            }, function (fileEntry) {
                fileEntry.createWriter(function (writer) {
                    writer.onwriteend = function (evt) {
                        cordova.exec(function(){
                            try{
                                onSuccess(settings);
                            }catch(e){
                                fail("calling success callback",e.message);
                            }
                        }, fail.bind(this, "requesting backup"), 'CloudSettingsPlugin', 'saveBackup', []);
    
                    };
                    writer.write(data);
                }, fail.bind(this, "creating file writer"));
            }, fail.bind(this, "getting file entry"));
        }, fail.bind(this, "resolving storage directory"));
    };

    if(overwrite){
        doSave();
    }else{
        // Load stored settings and merge them with new settings
        cloudsettings.load(function(stored){
            settings = merge(stored, settings);
            doSave();
        }, onError);
    }
};

cloudsettings.exists = function(onSuccess){
    resolveFilepath();
    window.resolveLocalFileSystemURL(filePath, function() {
        onSuccess(true);
    }, function(){
        onSuccess(false);
    });
};

cloudsettings.onRestore = function(fn){
    onRestoreFn = fn;
};

cloudsettings._onRestore = function(){
    onRestoreFn();
};

module.exports = cloudsettings;

