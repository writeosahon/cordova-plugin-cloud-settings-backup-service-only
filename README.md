Cordova Cloud Settings Plugin

# Summary
This plugin provides a mechanism to store key/value app settings in the form of a JSON structure which will persist in cloud storage so if the user re-installs the app or installs it on a different device, the settings will be restored and available in the new installation.

Note: Settings cannot be shared between Android and iOS installations.

## Android
The plugin uses [Android's Data Backup service](http://developer.android.com/guide/topics/data/backup.html).

- On Android 6+ the [Auto Backup](http://androiddoc.qiniudn.com/training/backup/autosyncapi.html) mechanism is used.
- On Android 5 and below, the [manual Backup API](http://androiddoc.qiniudn.com/training/backup/backupapi.html) is used.
- You need to [register your app](https://developer.android.com/google/backup/signup.html?csw=1) to use Google Data Backup in order to obtain an API key
- Supports Android v2.2 (API level 8) and above

## iOS

The plugin uses the iCloud [NSUbiquitousKeyValueStore class](https://developer.apple.com/documentation/foundation/nsubiquitouskeyvaluestore).

Note:
 - The total amount of space available in your app’s key-value store, for a given user, is 1 MB.
 - There is a per-key value size limit of 1 MB
 - There is a maximum of 1024 keys.
 - You need to enable iCloud for your App Identifier in the [Apple Member Centre](https://developer.apple.com/membercenter/index.action).
    - [See here](http://codecoach.blogspot.co.uk/2016/01/how-to-enable-ios-app-for-icloud.html) for details how to do this.
 - Supports iOS v5.0 and above

# Installation

## Install the plugin

```sh
cordova plugin add cordova-plugin-cloud-settings --variable ANDROID_BACKUP_SERVICE_KEY="<API_KEY>"
```


# Usage lifecycle

A typical lifecycle is as follows:
 - User installs your app for the first time
 - App starts, calls `exists()`, sees it has no existing data
 - Users uses your app, generates data: app calls `save()` to backup data to cloud
 - Further use, further backups...
 - User downloads your app onto a new device
 - App starts, calls `exists()`, sees it has existing data
 - App calls `load()` to access existing data
 - User continues where they left off

# API

## Backup

### `plugins.backup.save(data, [successCallback], [errorCallback]);`

```javascript
var appData = {
  user: {
    id: 1678,
    name: 'Fred',

    preferences: {
      mute: true,
      locale: 'en_GB'
    }
  }
}

plugins.backup.save(appData);
```


# Testing

## Testing Android

### Test backup
To test backup of settings you need to manually invoke the backup manager (as instructed in [the Android documentation](https://developer.android.com/guide/topics/data/testingbackup)) to force backing up of the updated values:

First make sure the backup manager is enabled and setup for verbose logging:

```bash
    $ adb shell bmgr enabled
    $ adb shell setprop log.tag.GmsBackupTransport VERBOSE
    $ adb shell setprop log.tag.BackupXmlParserLogging VERBOSE
```

#### Android 7.0 and above

Run the following command to perform a backup:

```bash
    $ adb shell bmgr backupnow <APP_PACKAGE_ID>
```

#### Android 6

* Run the following command:
```bash
    $ adb shell bmgr backup @pm@ && adb shell bmgr run
```

* Wait until the command in the previous step finishes by monitoring `adb logcat` for the following output:
```
    I/BackupManagerService: K/V backup pass finished.
```

* Run the following command to perform a backup:
```bash
    $ adb shell bmgr fullbackup <APP_PACKAGE_ID>
```


#### Android 5.1 and below
Run the following commands to perform a backup:

```bash
    $ adb shell bmgr backup <APP_PACKAGE_ID>
    $ adb shell bmgr run
```

### Test restore

To manually initiate a restore, run the following command:
```bash
    $ adb shell bmgr restore <TOKEN> <APP_PACKAGE_ID>
```

* To look up backup tokens run `adb shell dumpsys backup`.
* The token is the hexidecimal string following the labels `Ancestral:` and `Current:`
    * The ancestral token refers to the backup dataset that was used to restore the device when it was initially setup (with the device-setup wizard).
    * The current token refers to the device's current backup dataset (the dataset that the device is currently sending its backup data to).
* You can use a regex to filter the output for just your app ID, for example if your app package ID is `io.cordova.plugin.cloudsettings.test`:
```bash
    $ adb shell dumpsys backup | grep -P '^\S+\: | \: io\.cordova\.plugin\.cloudsettings\.test'
```

You also can test automatic restore for your app by uninstalling and reinstalling your app either with adb or through the Google Play Store app.

### Wipe backup data
To wipe the backup data for your app:

```bash
    $ adb shell bmgr list transports
    # note the one with an * next to it, it is the transport protocol for your backup
    $ adb shell bmgr wipe [* transport-protocol] <APP_PACKAGE_ID>
```

## Testing iOS

TODO

# Authors

[Dave Alden](https://github.com/dpa99c)

Based on the plugins:
- https://github.com/cloakedninjas/cordova-plugin-backup
- https://github.com/alexdrel/cordova-plugin-icloudkv
- https://github.com/jcesarmobile/FilePicker-Phonegap-iOS-Plugin

# Licence

The MIT License

Copyright (c) 2018, Dave Alden (Working Edge Ltd.)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
