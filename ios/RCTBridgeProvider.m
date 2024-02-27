//
//  RCTBridgeProvider.m
//  tentap
//
//  Created by Amir Angel on 27/02/2024.
//

#import <Foundation/Foundation.h>
#import "RCTBridgeProvider.h"

@implementation RCTBridgeProvider

// This serves as a global way to access the bridge
// In the old arch, we could just init TenTapImpl with the bridge from
// the ViewManager, however in the new arch this is not possible, so instead
// we call a method on the JS side "setBridge" on IOS which then sets the bridge here
// and later on the TenTap Fabric component will pull the bridge from here.
+ (instancetype)shared {
    static RCTBridgeProvider *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

@end
