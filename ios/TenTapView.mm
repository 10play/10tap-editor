#ifdef RCT_NEW_ARCH_ENABLED
#import "TenTapView.h"

#import <react/renderer/components/RNTenTapViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNTenTapViewSpec/EventEmitters.h>
#import <react/renderer/components/RNTenTapViewSpec/Props.h>
#import <react/renderer/components/RNTenTapViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "Utils.h"

using namespace facebook::react;

@interface TenTapView () <RCTTenTapViewViewProtocol>

@end

@implementation TenTapView {
    UIView * _view;
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

    _view = [[UIView alloc] init];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<TenTapViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<TenTapViewProps const>(props);

    if (oldViewProps.color != newViewProps.color) {
        NSString * colorToConvert = [[NSString alloc] initWithUTF8String: newViewProps.color.c_str()];
        [_view setBackgroundColor: [Utils hexStringToColor:colorToConvert]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> TenTapViewCls(void)
{
    return TenTapView.class;
}

@end
#endif
