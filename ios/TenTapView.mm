#ifdef RCT_NEW_ARCH_ENABLED
#import "TenTapView.h"

#import <react/renderer/components/RNTenTapViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNTenTapViewSpec/EventEmitters.h>
#import <react/renderer/components/RNTenTapViewSpec/Props.h>
#import <react/renderer/components/RNTenTapViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

#import "TenTapViewImpl.h"

using namespace facebook::react;

@interface TenTapView () <RCTTenTapViewViewProtocol>
    
@end

@implementation TenTapView {
    TenTapViewImpl * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<TenTapViewComponentDescriptor>();
}


- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TenTapViewProps>();
    _props = defaultProps;
    _view = [[TenTapViewImpl alloc] init];
    // Get RCTBridge from shared bridge provider
    _view.bridge = [RCTBridgeProvider shared].bridge;
    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<TenTapViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<TenTapViewProps const>(props);

    if (oldViewProps.keyboardID != newViewProps.keyboardID) {
        NSString *newKeyboardID = [NSString stringWithUTF8String:newViewProps.keyboardID.c_str()];
        [_view setKeyboardID:newKeyboardID];
    }

    if (oldViewProps.rootBackground != newViewProps.rootBackground) {
        NSNumber *colorProp = @(newViewProps.rootBackground);
        [_view setRootBackground:[RCTConvert UIColor:colorProp]];
    }
    if (oldViewProps.keyboardHeight != newViewProps.keyboardHeight) {
        [_view setKeyboardHeight:[NSNumber numberWithInt:newViewProps.keyboardHeight]];
    }
    if (oldViewProps.inputTag != newViewProps.inputTag) {
        [_view setInputTag:[NSNumber numberWithInt:newViewProps.inputTag]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> TenTapViewCls(void)
{
    return TenTapView.class;
}

@end
#endif
