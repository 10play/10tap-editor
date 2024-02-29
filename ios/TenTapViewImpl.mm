#import "TenTapViewImpl.h"
#import "Utils.h"
#import <WebKit/WebKit.h>
#import <React/RCTUIManager.h>

@interface HelperViewTemp : UIView

@property (nullable, nonatomic, readwrite, strong) UIInputViewController *inputViewController;

@end

@implementation HelperViewTemp

- (BOOL)canBecomeFirstResponder
{
    // In order for our keyboard to popup - our helper view (which contains the inputViewController) must be first responder
    return YES;
}

- (BOOL)resignFirstResponder
{
    // Once no longer first responder (blur) - remove self from super view
    BOOL rv = [super resignFirstResponder];
    [self removeFromSuperview];
    return rv;
}

@end

@implementation TenTapViewImpl

- (instancetype)init {
    self = [super init];
    if (self) {
    }
    return self;
}

- (void)setKeyboardID:(NSString *)keyboardID {
    _keyboardID = keyboardID;
}

- (void)setInputTag:(NSNumber *)inputTag {
    _inputTag = inputTag;
    if(self.bridge == nil)
    {
        NSLog(@"No bridge");
        return;
    }
    
    // Get input field from tag (react ref)
    UIView* inputField = [self.bridge.uiManager viewForReactTag:inputTag];
    if(inputField != nil) {
        // Create input controller
        UIInputViewController *inputController = [[UIInputViewController alloc] init];
        UIInputView *inputView = [[UIInputView alloc] initWithFrame:CGRectZero inputViewStyle:UIInputViewStyleKeyboard];
        inputView.allowsSelfSizing = YES;
        inputView.translatesAutoresizingMaskIntoConstraints = NO;
        inputController.inputView = inputView;
        
        // Create Keyboard
        UIView *customKeyboard = nil;
        #ifdef RCT_NEW_ARCH_ENABLED
            // On new arch use fabric view
            id<RCTSurfaceProtocol> surface = [[RCTFabricSurface alloc] initWithBridge:self.bridge
                                                                       moduleName:_keyboardID
                                                                    initialProperties:{}];
            customKeyboard = [[RCTSurfaceHostingProxyRootView alloc] initWithSurface:surface];
        #else
            // on old arch use RCTRootView
            customKeyboard = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:_keyboardID initialProperties:nil];
        #endif /* RCT_NEW_ARCH_ENABLED */

        if(_rootBackground != nil){
            customKeyboard.backgroundColor = _rootBackground;
        }

        customKeyboard.translatesAutoresizingMaskIntoConstraints = NO;
        // Add keyboard to inputView
        [inputView addSubview:customKeyboard];
        
        // Activate constraints
        [NSLayoutConstraint activateConstraints:@[
            [customKeyboard.leadingAnchor constraintEqualToAnchor:inputController.view.leadingAnchor],
            [customKeyboard.trailingAnchor constraintEqualToAnchor:inputController.view.trailingAnchor],
            [customKeyboard.topAnchor constraintEqualToAnchor:inputController.view.topAnchor],
            [customKeyboard.bottomAnchor constraintEqualToAnchor:inputController.view.bottomAnchor],
            [customKeyboard.heightAnchor constraintEqualToConstant:[self.keyboardHeight floatValue]]
        ]];
        [inputView setNeedsLayout];
        
        // Create helper view
        // This view will contain our custom inputController and will be the first responder
        HelperViewTemp *helperView = [[HelperViewTemp alloc] initWithFrame:CGRectZero];
        helperView.backgroundColor = [UIColor clearColor];

        [inputField.superview addSubview:helperView];
        [inputField.superview sendSubviewToBack:helperView];

        helperView.inputViewController = inputController;
        [helperView reloadInputViews];
        [helperView becomeFirstResponder];
        return;
    }
}

- (void) setKeyboardHeight:(NSNumber *)keyboardHeight{
    _keyboardHeight = keyboardHeight;
}

@end
