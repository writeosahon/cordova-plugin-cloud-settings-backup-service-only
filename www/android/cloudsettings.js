var FILE_NAME = "cloudsettings.json";
var dirPath, filePath;

var onRestoreFn = function(){};

var resolveFilepath = function(){
    if(filePath) return;
    dirPath = cordova.file.dataDirectory;
    filePath = dirPath + FILE_NAME;
};

var cloudsettings = {};

cloudsettings.load = function(onSuccess, onError){
    resolveFilepath();
    var fail = function (operation, error) {
        if (onError) onError(error);
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
                        onSuccess(data);
                    }catch(e){
                        fail("parse file contents to JSON", e.message);
                    }
                };
                reader.readAsText(file);
            }, fail.bind(this, "getting file handle"));
        }, fail.bind(this, "getting file entry"));
    }, fail.bind(this, "resolving storage directory"));
};

cloudsettings.save = function(settings, onSuccess, onError){
    resolveFilepath();
    var fail = function (operation, error) {
        if (onError) onError(error);
    };

    try{
        var data = JSON.stringify(settings);
    }catch(e){
        return fail("convert settings to JSON", e.message);
    }

    window.resolveLocalFileSystemURL(dirPath, function (dirEntry) {
        dirEntry.getFile(FILE_NAME, {
            create: true,
            exclusive: false
        }, function (fileEntry) {
            fileEntry.createWriter(function (writer) {
                writer.onwriteend = function (evt) {
                    try{
                        cordova.exec(onSuccess, fail.bind(this, "requesting backup"), 'CloudSettingsPlugin', 'saveBackup', []);
                    }catch(ex){
                        fail("calling success callback",ex.message);
                    }
                };
                writer.write(data);
            }, fail.bind(this, "creating file writer"));
        }, fail.bind(this, "getting file entry"));
    }, fail.bind(this, "resolving storage directory"));
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

