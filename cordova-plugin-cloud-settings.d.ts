// Type definitions for cordova-plugin-cloud-settings
// Project: https://github.com/dpa99c/cordova-diagnostic-plugin
// Definitions by: Dave Alden <https://github.com/dpa99c/>

/// <reference types="cordova" />

/**
 * Provides a mechanism to store key/value app settings in the form of a JSON structure which will persist in cloud storage so if the user re-installs the app or installs it on a different device, the settings will be restored and available in the new installation.
 */
interface CloudSettings {

    /**
     * Outputs verbose log messages from the native plugin components to the JS console.
     * @param {function} successCallback - callback function to invoke when debug mode has been enabled
     */
    enableDebug: (
        successCallback: () => void,
    ) => void;

    /**
     * Indicates if any stored cloud settings currently exist for the current user.
     * @param {function} successCallback - callback function to invoke with the result.
     * Will be passed a boolean flag which indicates whether an store settings exist for the user.
     */
    exists: (
        successCallback: (available: boolean) => void,
    ) => void;

    /**
     * Saves the settings to cloud backup.
     * @param {object} settings - a JSON structure representing the user settings to save to cloud backup.
     * @param {function} successCallback - (optional) callback function to invoke on successfuly saving settings and scheduling for backup.
     Will be passed a single object argument which contains the saved settings as a JSON object.
     * @param {function} errorCallback - (optional) callback function to invoke on failure to save settings or schedule for backup.
     Will be passed a single string argument which contains a description of the error.
     * @param {boolean} overwrite - (optional) if true, existing settings will be replaced rather than updated. Defaults to false.
     - If false, existing settings will be merged with the new settings passed to this function.
     */
    save: (
        settings: object,
        successCallback: (savedSettings: object) => void,
        errorCallback: (error: string) => void,
        overwrite: boolean = false
    ) => void;

    /**
     * Loads the current settings.
     * @param {settings
     * @param {function} successCallback - (optional) callback function to invoke on successfuly loading settings.
     Will be passed a single object argument which contains the current settings as a JSON object.
     * {function} errorCallback - (optional) callback function to invoke on failure to load settings.
     Will be passed a single string argument which contains a description of the error.
     */
    load: (
        successCallback: (savedSettings: object) => void,
        errorCallback: (error: string) => void
    ) => void;

    /**
     * Registers a function which will be called if/when settings on the device have been updated from the cloud.
     * @param {function} successCallback - callback function to invoke when device settings have been updated from the cloud.
     */
    onRestore: (
        successCallback: () => void,
    ) => void;

}

interface CordovaPlugin {
    cloudsettings: CloudSettings
}
