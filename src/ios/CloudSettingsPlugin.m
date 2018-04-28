//
//  CloudSettingsPlugin.m
//  Cordova Cloud Settings
//  Copyright (c) by Dave Alden 2018

#import "CloudSettingsPlugin.h"

@interface CloudSettingsPlugin (private)
- (void) cloudNotification:(NSNotification *)receivedNotification;
@end

@implementation CloudSettingsPlugin

static NSString*const LOG_TAG = @"CloudSettingsPlugin[native]";

static NSString*const javascriptNamespace = @"cordova.plugin.cloudsettings";

/********************************/
#pragma mark - Plugin API
/********************************/

-(void)enableDebug:(CDVInvokedUrlCommand*)command{
    self.debugEnabled = true;
    [self d:@"Debug enabled"];
}

-(void)save:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        @try {
            NSString* sNewData = [command.arguments objectAtIndex:0];
            NSString* sNewDataTypes = [command.arguments objectAtIndex:1];
            NSDictionary* dNewData = [jsonStringToDictionary sNewData];
            NSDictionary* dNewDataTypes = [jsonStringToDictionary sNewDataTypes];
            NSDictionary* dStoredData = [[NSUbiquitousKeyValueStore defaultStore] dictionaryRepresentation];

            // Store new/updated values
            for (NSString* key in dNewData) {
                id value = [dNewData objectForKey:key];
                NSString* type = [dNewDataTypes objectForKey:key];
                NSString* sValue;
                if([type isEqual: @"object"]){
                    sValue = [self objectToJsonString value];
                }else if([type isEqual: @"array"]){
                    sValue = [self arrayToJsonString value];
                }else{
                    sValue = (NSString*) value;
                }
                [[NSUbiquitousKeyValueStore defaultStore] setString:sValue forKey:key];
            }

            // Remove stored values where key is not present in new data
            for (NSString* key in dStoredData) {
                if([dStoredData objectForKey:key] == nil){
                    [[NSUbiquitousKeyValueStore defaultStore] removeObjectForKey:key];
                }
            }
            
            // sync memory values to disk (in preparation for next iCloud sync)
            BOOL success = [[NSUbiquitousKeyValueStore defaultStore] synchronize];
            if (success){
                [self sendPluginSuccess:command];
            }else{
                [self sendPluginError:@"synchronize failed" command:command];
            }
        }@catch (NSException *exception) {
            [self handlePluginException:exception :command];
        }
    }];
}


-(void)load:(CDVInvokedUrlCommand *)command  
{
    [self.commandDelegate runInBackground:^{
        @try {
            NSDictionary* dStoredData = [[NSUbiquitousKeyValueStore defaultStore] dictionaryRepresentation];
            NSString* sStoredData = [self objectToJsonString:dStoredData];
            [self sendPluginResultString:sStoredData command:command];
        }@catch (NSException *exception) {
            [self handlePluginException:exception :command];
        }
    }];
}

-(void)exists:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
         @try {
            NSDictionary* dStoredData = [[NSUbiquitousKeyValueStore defaultStore] dictionaryRepresentation];
            if([dStoredData count] > 0)
                [self sendPluginResultBool:TRUE command:command];
            else
                [self sendPluginResultBool:FALSE command:command];
            }];
        }@catch (NSException *exception) {
            [self handlePluginException:exception :command];
        }
}

- (void)cloudNotification:(NSNotification *)receivedNotification
{
    @try {
        d(@"iCloud notification received");
        int cause=[[[receivedNotification userInfo] valueForKey:NSUbiquitousKeyValueStoreChangeReasonKey] intValue];
        NSString* msg;
        switch(cause) {
            case NSUbiquitousKeyValueStoreQuotaViolationChange:
                msg = @"storage quota exceeded";
                [self e:msg];
                break;
            case NSUbiquitousKeyValueStoreInitialSyncChange:
                msg = @"initial sync notification";
                [self d:msg];
                break;
            case NSUbiquitousKeyValueStoreServerChange:
                msg = @"change sync notification";
                [self d:msg];
                break;
        }
        [self jsCallbackWithArguments:@"onRestore" :msg];
    }@catch (NSException *exception) {
        [self e:exception.reason];
    }
}

/********************************/
#pragma mark - Internal functions
/********************************/

- (void)pluginInitialize {
    @try {
        [super pluginInitialize];
        self.debugEnabled = false;
        [[NSNotificationCenter defaultCenter] addObserver:self 
            selector:@selector(cloudNotification:)
            name:NSUbiquitousKeyValueStoreDidChangeExternallyNotification 
            object:[NSUbiquitousKeyValueStore defaultStore]];
    }@catch (NSException *exception) {
        [self e:exception.reason];
    }
}

/********************************/
#pragma mark - Send results
/********************************/

- (void) sendPluginResult: (CDVPluginResult*)result :(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) sendPluginResultBool: (BOOL)result :(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult;
    if(result) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:1];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:0];
    }
    [self sendPluginResult:pluginResult command:command];
}

- (void) sendPluginResultString: (NSString*)result :(CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:result];
    [self sendPluginResult:pluginResult command:command];
}

- (void) sendPluginSuccess: (CDVInvokedUrlCommand*)command
{
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self sendPluginResult:pluginResult command:command];

- (void) sendPluginError: (NSString*) errorMessage :(CDVInvokedUrlCommand*)command
{
    [self e:errorMessage];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errorMessage];
    [self sendPluginResult:pluginResult command:command];
}

- (void) handlePluginException: (NSException*) exception :(CDVInvokedUrlCommand*)command
{
    [self e:[NSString stringWithFormat:@"EXCEPTION: %@", exception.reason]];
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:exception.reason];
    [self sendPluginResult:pluginResult command:command];
}

- (void)executeGlobalJavascript: (NSString*)jsString
{
    [self.commandDelegate evalJs:jsString];
}

- (NSString*) arrayToJsonString:(NSArray*)inputArray
{
    NSError* error;
    NSData* jsonData = [NSJSONSerialization dataWithJSONObject:inputArray options:NSJSONWritingPrettyPrinted error:&error];
    NSString* jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    return jsonString;
}

- (NSString*) objectToJsonString:(NSDictionary*)inputObject
{
    NSError* error;
    NSData* jsonData = [NSJSONSerialization dataWithJSONObject:inputObject options:NSJSONWritingPrettyPrinted error:&error];
    NSString* jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    return jsonString;
}

- (NSArray*) jsonStringToArray:(NSString*)jsonStr
{
    NSError* error = nil;
    NSArray* array = [NSJSONSerialization JSONObjectWithData:[jsonStr dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:&error];
    if (error != nil){
        array = nil;
    }
    return array;
}

- (NSDictionary*) jsonStringToDictionary:(NSString*)jsonStr
{
    return (NSDictionary*) [self jsonStringToArray:jsonStr];
}

- (bool)isNull: (NSString*)str
{
    return str == nil || str == (id)[NSNull null] || str.length == 0 || [str isEqual: @"<null>"];
}

- (void)jsCallback: (NSString*)name
{
    NSString* jsString = [NSString stringWithFormat:@"%@[%@]", javascriptNamespace, name];
    [self executeGlobalJavascript:jsString];
}

- (void)jsCallbackWithArguments: (NSString*)name : (NSString*)arguments
{
    NSString* jsString = [NSString stringWithFormat:@"%@[%@](%@)", javascriptNamespace, name, [self escapeDoubleQuotes:arguments]];
    [self executeGlobalJavascript:jsString];
}

/********************************/
#pragma mark - utility functions
/********************************/

- (void)d: (NSString*)msg
{
    if(self.debugEnabled){
        NSLog(@"%@ DEBUG: %@", LOG_TAG, msg);
        NSString* jsString = [NSString stringWithFormat:@"console.log(\"%@: %@\")", LOG_TAG, [self escapeDoubleQuotes:msg]];
        [self executeGlobalJavascript:jsString];
    }
}

- (void)i: (NSString*)msg
{
    if(self.debugEnabled){
        NSLog(@"%@ INFO: %@", LOG_TAG, msg);
        NSString* jsString = [NSString stringWithFormat:@"console.info(\"%@: %@\")", LOG_TAG, [self escapeDoubleQuotes:msg]];
        [self executeGlobalJavascript:jsString];
    }
}

- (void)w: (NSString*)msg
{
    if(self.debugEnabled){
        NSLog(@"%@ WARN: %@", LOG_TAG, msg);
        NSString* jsString = [NSString stringWithFormat:@"console.warn(\"%@: %@\")", LOG_TAG, [self escapeDoubleQuotes:msg]];
        [self executeGlobalJavascript:jsString];
    }
}

- (void)e: (NSString*)msg
{
    NSLog(@"%@ ERROR: %@", LOG_TAG, msg);
    if(self.debugEnabled){
        NSString* jsString = [NSString stringWithFormat:@"console.error(\"%@: %@\")", LOG_TAG, [self escapeDoubleQuotes:msg]];
        [self executeGlobalJavascript:jsString];
    }
}

- (NSString*)escapeDoubleQuotes: (NSString*)str
{
    NSString *result =[str stringByReplacingOccurrencesOfString: @"\"" withString: @"\\\""];
    return result;
}

@end