#import "TenTapViewImpl.h"
#import "TentapUtils.h"
#import <WebKit/WebKit.h>
#import <React/RCTUIManager.h>
#import <objc/runtime.h>
#import <objc/message.h>
#import <React/RCTBridge.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>

static UIView *globalCustomKeyboard; // Store the custom keyboard reference globally

@interface HelperViewTemp : UIView

@property (nullable, nonatomic, readwrite, strong) UIInputViewController *inputViewController;

@end

@implementation HelperViewTemp

- (BOOL)canBecomeFirstResponder {
    // In order for our keyboard to popup - our helper view (which contains the inputViewController) must be first responder
    return YES;
}

- (BOOL)resignFirstResponder {
    // Once no longer first responder (blur) - remove self from super view
    BOOL rv = [super resignFirstResponder];
    [self removeFromSuperview];
    return rv;
}

@end

@implementation TenTapViewImpl

- (instancetype)init {
    self = [super init];
    return self;
}



- (void)cleanupKeyboard {
    // Remove the custom keyboard from its superview
    if (globalCustomKeyboard) {
        [globalCustomKeyboard removeFromSuperview];
        globalCustomKeyboard = nil;
    }
}

- (void)setKeyboardID:(NSString *)keyboardID {
    _keyboardID = keyboardID;

    // When keyboardID is unset, clean up the keyboard
    if ([_keyboardID isEqualToString:@""]) {
        [self cleanupKeyboard];
    }
}

- (void)setInputTag:(NSNumber *)inputTag {
    _inputTag = inputTag;

    if (self.bridge == nil) {
        NSLog(@"No bridge");
        return;
    }

    // Get input field from tag (react ref)
    UIView *inputField = [self.bridge.uiManager viewForReactTag:inputTag];
    if (inputField != nil) {
        // Create input controller
        UIInputViewController *inputController = [[UIInputViewController alloc] init];
        UIInputView *inputView = [[UIInputView alloc] initWithFrame:CGRectZero inputViewStyle:UIInputViewStyleKeyboard];
        inputView.allowsSelfSizing = YES;
        inputView.translatesAutoresizingMaskIntoConstraints = NO;
        inputController.inputView = inputView;

        UIView *customKeyboard = nil;
#ifdef RCT_NEW_ARCH_ENABLED
        // On new arch we create RCTSurfaceHostingProxyRootView via rootViewFactory which is on AppDelegate
        // using the viewWithModuleName function
        id appDelegate = [UIApplication sharedApplication].delegate;

        // Ensure the app delegate responds to `rootViewFactory`
        if ([appDelegate respondsToSelector:NSSelectorFromString(@"rootViewFactory")]) {
            id rootViewFactory = [appDelegate valueForKey:@"rootViewFactory"];
            SEL viewWithModuleNameSelector = NSSelectorFromString(@"viewWithModuleName:initialProperties:");
            if ([rootViewFactory respondsToSelector:viewWithModuleNameSelector]) {
              RCTSurfaceHostingProxyRootView *hostingRootView = (RCTSurfaceHostingProxyRootView *)((UIView *(*)(id, SEL, NSString *, NSDictionary *))
                                    objc_msgSend)(rootViewFactory, viewWithModuleNameSelector, _keyboardID, @{});
              customKeyboard = hostingRootView;
            } else {
                NSLog(@"rootViewFactory does not respond to viewWithModuleName:initialProperties:");
                return;
            }
        } else {
            NSLog(@"AppDelegate does not have a rootViewFactory property");
            return;
        }
#else
    // on old arch use legacy RCTRootView
    customKeyboard = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:_keyboardID initialProperties:nil];
#endif

        if (_rootBackground != nil) {
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
        HelperViewTemp *helperView = [[HelperViewTemp alloc] initWithFrame:CGRectZero];
        helperView.backgroundColor = [UIColor clearColor];

        [inputField.superview addSubview:helperView];
        [inputField.superview sendSubviewToBack:helperView];

        helperView.inputViewController = inputController;
        [helperView reloadInputViews];
        [helperView becomeFirstResponder];

        // Store the custom keyboard reference globally
        globalCustomKeyboard = customKeyboard;
        return;
    }
}

- (void)setKeyboardHeight:(NSNumber *)keyboardHeight {
    _keyboardHeight = keyboardHeight;
}

@end
