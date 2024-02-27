#import <UIKit/UIKit.h>
#import <React/RCTUIManager.h>

#ifdef RCT_NEW_ARCH_ENABLED
// Fabric
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>

#endif // RCT_NEW_ARCH_ENABLED

@interface TenTapViewImpl : UIView

@property (nonatomic, copy) NSNumber *inputTag;
@property (nonatomic, copy) NSString *keyboardID;
@property (nonatomic, copy) NSNumber *keyboardHeight;
@property (nonatomic, copy) UIColor *rootBackground;
@property (nonatomic, weak) RCTBridge *bridge;

@end
