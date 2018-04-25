var cloudsettings = {
  save: function(data, success, fail) {
    cordova.exec(success, fail, 'CloudSettingsPlugin', 'saveBackup', [data]);
  },

  restore: function(success, fail) {
    cordova.exec(success, fail, 'CloudSettingsPlugin', 'checkForRestore', []);
  }
};
module.exports = cloudsettings;
