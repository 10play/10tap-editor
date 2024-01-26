// This guard prevent this file to be compiled in the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef TenTapViewNativeComponent_h
#define TenTapViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface TenTapView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END

#endif /* TenTapViewNativeComponent_h */
#endif /* RCT_NEW_ARCH_ENABLED */
