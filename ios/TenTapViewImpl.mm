#import "TenTapViewImpl.h"
#import "TentapUtils.h"
#import <WebKit/WebKit.h>
#import <React/RCTUIManager.h>
#import <objc/runtime.h>
#import <objc/message.h>
#import <React/RCTBridge.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>

static id globalFabricSurface; // Use id to store the Fabric surface reference dynamically

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
    return self;
}

- (void)dealloc {
    [self cleanupKeyboard];
}

- (void)cleanupKeyboard {
    if (globalFabricSurface) {
#ifdef RCT_NEW_ARCH_ENABLED
      RCTFabricSurface *fabricSurface = (RCTFabricSurface *)globalFabricSurface;

       // Access the private _surfacePresenter using the runtime
       Ivar surfacePresenterIvar = class_getInstanceVariable([RCTFabricSurface class], "_surfacePresenter");
       RCTSurfacePresenter *surfacePresenter = object_getIvar(fabricSurface, surfacePresenterIvar);

       if (surfacePresenter) {
           // Unregister the surface
           [surfacePresenter unregisterSurface:fabricSurface];
           NSLog(@"Successfully unregistered Fabric surface.");
       } else {
           NSLog(@"Surface presenter is nil. Cannot unregister Fabric surface.");
       }
#endif
    }
}

- (void)setKeyboardID:(NSString *)keyboardID {
    _keyboardID = keyboardID;
}

- (void)setInputTag:(NSNumber *)inputTag {
    _inputTag = inputTag;
    if (self.bridge == nil) {
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

        UIView *customKeyboard = nil;
#ifdef RCT_NEW_ARCH_ENABLED
        id appDelegate = [UIApplication sharedApplication].delegate;
      // Ensure the app delegate responds to `bridgeAdapter`
        if ([appDelegate respondsToSelector:NSSelectorFromString(@"rootViewFactory")]) {
            id rootViewFactory = [appDelegate valueForKey:@"rootViewFactory"];
            SEL viewWithModuleNameSelector = NSSelectorFromString(@"viewWithModuleName:initialProperties:");
            if ([rootViewFactory respondsToSelector:viewWithModuleNameSelector]) {
                UIView *rootView = ((UIView *(*)(id, SEL, NSString *, NSDictionary *))
                                    objc_msgSend)(rootViewFactory, viewWithModuleNameSelector, _keyboardID, @{});
                customKeyboard = rootView;
                RCTSurfaceHostingProxyRootView *hostingRootView = (RCTSurfaceHostingProxyRootView *)rootView;
                globalFabricSurface = (RCTFabricSurface * )hostingRootView.surface;
            } else {
                NSLog(@"rootViewFactory does not respond to viewWithModuleName:initialProperties:");
                return;
            }
        } else {
            NSLog(@"AppDelegate does not have a rootViewFactory property");
            return;
        }
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

- (void)setKeyboardHeight:(NSNumber *)keyboardHeight {
    _keyboardHeight = keyboardHeight;
}

@end
