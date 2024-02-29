//
//  RCTBridgeProvider.h
//  Pods
//
//  Created by Amir Angel on 27/02/2024.
//

#ifndef RCTBridgeProvider_h
#define RCTBridgeProvider_h


#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface RCTBridgeProvider : NSObject

@property (class, nonatomic, readonly) RCTBridgeProvider *shared;
@property (nonatomic, strong) RCTBridge *bridge;

@end


#endif /* RCTBridgeProvider_h */
