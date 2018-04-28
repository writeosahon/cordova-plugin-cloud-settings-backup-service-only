package cordova.plugin.cloudsettings;

import android.app.Activity;
import android.app.backup.BackupManager;
import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;


public class CloudSettingsPlugin extends CordovaPlugin {

    static final String LOG_TAG = "CloudSettingsPlugin";
    static final Object sDataLock = new Object();
    static String javascriptNamespace = "cordova.plugin.cloudsettings";

    public static CloudSettingsPlugin instance = null;
    static CordovaWebView webView;

    CallbackContext callbackContext;

    static BackupManager bm;

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The CordovaWebView Cordova is running in.
     */
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        bm = new BackupManager(cordova.getActivity().getApplicationContext());
        instance = this;
        this.webView = webView;
    }

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        this.callbackContext = callbackContext;
        boolean success = false;
        try {
            if (action.equals("saveBackup")) {
                success = saveBackup(args);
            } else {
                handleError("Invalid action: " + action);
            }
        } catch (Exception e) {
            handleException(e);
        }
        return success;
    }

    private boolean saveBackup(JSONArray args) throws JSONException {
        boolean success = true;
        try {
            Log.d(LOG_TAG, "Requesting Backup");
            bm.dataChanged();
            sendPluginResult(new PluginResult(PluginResult.Status.OK));
        } catch (Exception e) {
            handleException(e);
            success = false;
        }
        return success;
    }

    private void handleException(Exception e, String description) {
        handleError(description + ": " + e.getMessage());
    }

    private void handleException(Exception e) {
        handleError(e.getMessage());
    }

    private void handleError(String error) {
        Log.e(LOG_TAG, error);
        if (callbackContext != null) {
            sendPluginResult(new PluginResult(PluginResult.Status.ERROR, error));
        }
    }

    protected static void executeGlobalJavascript(final String jsString) {
        instance.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    webView.loadUrl("javascript:" + jsString);
                } catch (Exception e) {
                    instance.handleException(e);
                }
            }
        });
    }

    protected static void jsCallback(String name) {
        String jsStatement = String.format(javascriptNamespace + "[\"%s\"]();", name);
        executeGlobalJavascript(jsStatement);
    }

    private Activity getActivity() {
        return this.cordova.getActivity();
    }

    private void sendPluginResult(PluginResult pluginResult) {
        if (callbackContext != null) {
            callbackContext.sendPluginResult(pluginResult);
            callbackContext = null;
        }else{
            handleError("No callback context is available");
        }
    }

    protected static void onRestore() {
        jsCallback("_onRestore");
    }
}
