#import "TenTapViewImpl.h"
#import "Utils.h"
#import <WebKit/WebKit.h>
#import <React/RCTUIManager.h>

@interface HelperViewTemp : UIView

@property (nullable, nonatomic, readwrite, strong) UIInputViewController *inputViewController;

@end

@implementation HelperViewTemp

// In order for our keyboard to popup - our helper view (which contains the inputViewController) must be first responder
- (BOOL)canBecomeFirstResponder
{
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
        RCTRootView *customKeyboard = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:@"keyboard.color" initialProperties:nil];

        customKeyboard.translatesAutoresizingMaskIntoConstraints = NO;

        // Add keyboard to inputView
        [inputView addSubview:customKeyboard];
        [customKeyboard.leadingAnchor constraintEqualToAnchor:inputController.view.leadingAnchor].active = YES;
        [customKeyboard.trailingAnchor constraintEqualToAnchor:inputController.view.trailingAnchor].active = YES;
        [customKeyboard.topAnchor constraintEqualToAnchor:inputController.view.topAnchor].active = YES;
        [customKeyboard.bottomAnchor constraintEqualToAnchor:inputController.view.bottomAnchor].active = YES;
        [customKeyboard.heightAnchor constraintEqualToConstant:[self.keyboardHeight floatValue]].active = YES;
        [inputView setNeedsLayout];
        
        // Create helper view
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
