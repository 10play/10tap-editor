#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNTenTapSpec/RNTenTapSpec.h>

@interface TenTapKeyboard : NSObject <NativeTenTapKeyboardSpec, RCTInvalidating>
#else
@interface TenTapKeyboard : NSObject <RCTBridgeModule, RCTInvalidating>
#endif

@end
