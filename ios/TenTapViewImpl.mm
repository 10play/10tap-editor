#import "TenTapViewImpl.h"
#import "Utils.h"
#import <WebKit/WebKit.h>
#import <React/RCTUIManager.h>

@interface HelperViewTemp : UIView

@property (nullable, nonatomic, readwrite, strong) UIInputViewController *inputViewController;
@property (nonatomic) BOOL keepInSuperviewOnResign;

@end

@implementation HelperViewTemp

- (BOOL)canBecomeFirstResponder
{
    return YES;
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
        UIView *customKeyboard = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 300, 300)];
        customKeyboard.translatesAutoresizingMaskIntoConstraints = NO;
        customKeyboard.backgroundColor = [UIColor redColor];

        // Add keyboard to inputView
        [inputView addSubview:customKeyboard];
        
        customKeyboard.translatesAutoresizingMaskIntoConstraints = NO;
        [customKeyboard.leadingAnchor constraintEqualToAnchor:inputView.leadingAnchor].active = YES;
        [customKeyboard.trailingAnchor constraintEqualToAnchor:inputView.trailingAnchor].active = YES;
        [customKeyboard.topAnchor constraintEqualToAnchor:inputView.topAnchor].active = YES;
        [customKeyboard.bottomAnchor constraintEqualToAnchor:inputView.bottomAnchor].active = YES;
        [customKeyboard.heightAnchor constraintEqualToConstant:customKeyboard.frame.size.height].active = YES;
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
    NSLog(@"No input field");
}

@end
