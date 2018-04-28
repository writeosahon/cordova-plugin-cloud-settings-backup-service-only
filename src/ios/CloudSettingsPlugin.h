//
//  CloudSettingsPlugin.m
//  Cordova Cloud Settings
//  Copyright (c) by Dave Alden 2018
#import <Foundation/Foundation.h>
#import <Cordova/CDV.h>

@interface CloudSettingsPlugin : CDVPlugin 

@property (nonatomic) BOOL debugEnabled;

// Plugin API
-(void)enableDebug:(CDVInvokedUrlCommand*)command;
-(void)save:(CDVInvokedUrlCommand *)command;
-(void)load:(CDVInvokedUrlCommand *)command;
-(void)exists:(CDVInvokedUrlCommand *)command;
@end
