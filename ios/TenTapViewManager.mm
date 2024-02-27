#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "Utils.h"
#import "TenTapViewImpl.h"
#import "RCTBridgeProvider.h"

@interface TenTapViewManager : RCTViewManager
@end

@implementation TenTapViewManager

RCT_EXPORT_MODULE(TenTapView)

- (UIView *)view
{
  TenTapViewImpl *view = [[TenTapViewImpl alloc] init];
  view.bridge = self.bridge;
  return view;
}

RCT_EXPORT_VIEW_PROPERTY(inputTag, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(keyboardID, NSString)
RCT_EXPORT_VIEW_PROPERTY(keyboardHeight, NSNumber)
RCT_CUSTOM_VIEW_PROPERTY(rootBackground, NSString, TenTapViewImpl)
{
    view.rootBackground = [RCTConvert UIColor:json];
}

RCT_EXPORT_METHOD(setBridge){
    NSLog(@"Bridge: %@", self.bridge);
    [RCTBridgeProvider shared].bridge = self.bridge;
}

@end
