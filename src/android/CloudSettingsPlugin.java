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
    static final String LOG_TAG_JS = "CloudSettingsPlugin[native]";
    static final Object sDataLock = new Object();
    static String javascriptNamespace = "cordova.plugin.cloudsettings";

    protected boolean debugEnabled = false;

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
            if (action.equals("enableDebug")) {
                setDebug(true);
                sendPluginResult(new PluginResult(PluginResult.Status.OK));
            }else if (action.equals("saveBackup")) {
                success = saveBackup(args);
            } else {
                handleError("Invalid action: " + action);
            }
        } catch (Exception e) {
            handleException(e);
        }
        return success;
    }

    protected void setDebug(boolean enabled) {
        debugEnabled = enabled;
        d("debug: " + String.valueOf(enabled));
    }

    protected boolean saveBackup(JSONArray args) throws JSONException {
        boolean success = true;
        try {
            d("Requesting Backup");
            bm.dataChanged();
            sendPluginResult(new PluginResult(PluginResult.Status.OK));
        } catch (Exception e) {
            handleException(e, "Requesting Backup");
            success = false;
        }
        return success;
    }

    protected static void handleException(Exception e, String description) {
        handleError("EXCEPTION: " + description + ": " + e.getMessage());
    }

    protected static void handleException(Exception e) {
        handleError("EXCEPTION: " + e.getMessage());
    }

    protected static void handleError(String error) {
        e(error);
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

    protected static String jsQuoteEscape(String js) {
        js = js.replace("\"", "\\\"");
        return "\"" + js + "\"";
    }

    protected Activity getActivity() {
        return this.cordova.getActivity();
    }

    protected void sendPluginResult(PluginResult pluginResult) {
        if (callbackContext != null) {
            callbackContext.sendPluginResult(pluginResult);
            callbackContext = null;
        }else{
            handleError("No callback context is available");
        }
    }

    protected static void onRestore() {
        if(instance != null){
            jsCallback("_onRestore");
        }
    }

    protected static void d(String message) {
        Log.d(LOG_TAG, message);
        if (instance != null && instance.debugEnabled) {
            message = LOG_TAG_JS + ": " + message;
            message = instance.jsQuoteEscape(message);
            instance.executeGlobalJavascript("console.log("+message+")");
        }
    }

    protected static void i(String message) {
        Log.i(LOG_TAG, message);
        if (instance != null && instance.debugEnabled) {
            message = LOG_TAG_JS + ": " + message;
            message = instance.jsQuoteEscape(message);
            instance.executeGlobalJavascript("console.info("+message+")");
        }
    }

    protected static void w(String message) {
        Log.w(LOG_TAG, message);
        if (instance != null && instance.debugEnabled) {
            message = LOG_TAG_JS + ": " + message;
            message = instance.jsQuoteEscape(message);
            instance.executeGlobalJavascript("console.warn("+message+")");
        }
    }

    protected static void e(String message) {
        Log.e(LOG_TAG, message);
        if (instance != null && instance.debugEnabled) {
            message = LOG_TAG_JS + ": " + message;
            message = instance.jsQuoteEscape(message);
            instance.executeGlobalJavascript("console.error("+message+")");
        }
    }
}
