#import "TenTapKeyboard.h"

#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

// Keyboard frames shorter than this are an empty input view or the iPad
// shortcut bar, not a system keyboard. Mirrors the JS keyboard store rule.
static const CGFloat TTMinimumKeyboardHeight = 80;

static const void *const TTInputViewKey = &TTInputViewKey;

static __weak UIResponder *TTCapturedResponder;

@implementation UIResponder (TenTapFirstResponder)

- (void)tentap_captureFirstResponder:(__unused id)sender
{
  TTCapturedResponder = self;
}

@end

// The nil-targeted action lands on the first responder that accepts it.
// WKContentView declines unknown actions, so for a focused web page this is
// the enclosing WKWebView rather than the content view itself.
static UIResponder *TTActionTargetResponder(void)
{
  TTCapturedResponder = nil;
  [UIApplication.sharedApplication sendAction:@selector(tentap_captureFirstResponder:)
                                           to:nil
                                         from:nil
                                     forEvent:nil];
  UIResponder *responder = TTCapturedResponder;
  TTCapturedResponder = nil;
  return responder;
}

static UIView *TTFirstResponderInView(UIView *view)
{
  if (view.isFirstResponder) {
    return view;
  }
  for (UIView *subview in view.subviews) {
    UIView *responder = TTFirstResponderInView(subview);
    if (responder != nil) {
      return responder;
    }
  }
  return nil;
}

/// The web view whose content owns the first responder, or nil.
static WKWebView *TTFocusedWebView(void)
{
  UIResponder *target = TTActionTargetResponder();
  UIView *view = [target isKindOfClass:UIView.class] ? (UIView *)target : nil;
  while (view != nil && ![view isKindOfClass:WKWebView.class]) {
    view = view.superview;
  }
  return TTFirstResponderInView(view) != nil ? (WKWebView *)view : nil;
}

// WebKit answers -[WKContentView inputView] with -[WKWebView inputView], so
// overriding the selector on the web view's class is enough while the content
// view stays first responder. The override is added once per class (never by
// changing an instance's isa) and only affects instances carrying an
// associated input view; every other web view keeps the original behaviour.
static void TTInstallInputViewHook(Class cls)
{
  static NSMutableSet<NSString *> *hookedClasses;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    hookedClasses = [NSMutableSet new];
  });
  NSString *className = NSStringFromClass(cls);
  if ([hookedClasses containsObject:className]) {
    return;
  }
  [hookedClasses addObject:className];

  SEL selector = @selector(inputView);
  Method method = class_getInstanceMethod(cls, selector);
  IMP original = method_getImplementation(method);
  IMP hook = imp_implementationWithBlock(^UIView *(UIView *webView) {
    UIView *inputView = objc_getAssociatedObject(webView, TTInputViewKey);
    return inputView ?: ((UIView * (*)(id, SEL)) original)(webView, selector);
  });
  if (!class_addMethod(cls, selector, hook, method_getTypeEncoding(method))) {
    method_setImplementation(method, hook);
  }
}

@implementation TenTapKeyboard {
  __weak WKWebView *_suppressedWebView;
  __weak UIResponder *_assistantResponder;
  NSArray<UIBarButtonItemGroup *> *_savedLeadingGroups;
  NSArray<UIBarButtonItemGroup *> *_savedTrailingGroups;
  BOOL _systemKeyboardVisible;
}

RCT_EXPORT_MODULE(TenTapKeyboard)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (instancetype)init
{
  if (self = [super init]) {
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center addObserver:self
               selector:@selector(keyboardDidShow:)
                   name:UIKeyboardDidShowNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(keyboardDidHide:)
                   name:UIKeyboardDidHideNotification
                 object:nil];
  }
  return self;
}

- (void)keyboardDidShow:(NSNotification *)notification
{
  CGRect frame = [notification.userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  _systemKeyboardVisible = CGRectGetHeight(frame) >= TTMinimumKeyboardHeight;
}

- (void)keyboardDidHide:(__unused NSNotification *)notification
{
  _systemKeyboardVisible = NO;
}

RCT_EXPORT_METHOD(setSystemKeyboardSuppressed:(BOOL)suppressed
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(@(suppressed ? [self suppressSystemKeyboard] : [self restoreSystemKeyboard]));
}

RCT_EXPORT_METHOD(showSystemKeyboard:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(@NO);
}

RCT_EXPORT_METHOD(isSystemKeyboardVisible:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(@(_systemKeyboardVisible));
}

RCT_EXPORT_METHOD(setWindowOverlayMode:(__unused BOOL)enabled
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(@NO);
}

RCT_EXPORT_METHOD(getNavigationBarInset:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(@0);
}

/// Swaps the focused web view's keyboard for an empty input view. The content
/// view stays first responder, so caret, selection and hardware keyboard input
/// survive. Returns NO when no web view owns the first responder.
- (BOOL)suppressSystemKeyboard
{
  WKWebView *webView = TTFocusedWebView();
  if (webView == nil) {
    return NO;
  }
  if (webView != _suppressedWebView) {
    [self restoreSystemKeyboard];
    TTInstallInputViewHook(webView.class);
    UIView *emptyInputView = [[UIView alloc] initWithFrame:CGRectZero];
    emptyInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth;
    objc_setAssociatedObject(webView, TTInputViewKey, emptyInputView, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    _suppressedWebView = webView;
  }
  UIView *responder = TTFirstResponderInView(webView);
  [self clearInputAssistantItemOf:responder];
  [responder reloadInputViews];
  return YES;
}

/// Removes the empty input view. The system keyboard comes back only when the
/// web view still owns the first responder. Returns NO when nothing was suppressed.
- (BOOL)restoreSystemKeyboard
{
  WKWebView *webView = _suppressedWebView;
  _suppressedWebView = nil;
  [self restoreInputAssistantItem];
  if (webView == nil) {
    return NO;
  }
  objc_setAssociatedObject(webView, TTInputViewKey, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  [TTFirstResponderInView(webView) reloadInputViews];
  return YES;
}

// The iPad shortcut bar would otherwise stay visible above the empty input view.
- (void)clearInputAssistantItemOf:(UIResponder *)responder
{
  if (responder == _assistantResponder) {
    return;
  }
  [self restoreInputAssistantItem];
  UITextInputAssistantItem *item = responder.inputAssistantItem;
  _savedLeadingGroups = item.leadingBarButtonGroups;
  _savedTrailingGroups = item.trailingBarButtonGroups;
  item.leadingBarButtonGroups = @[];
  item.trailingBarButtonGroups = @[];
  _assistantResponder = responder;
}

- (void)restoreInputAssistantItem
{
  UITextInputAssistantItem *item = _assistantResponder.inputAssistantItem;
  if (item != nil) {
    item.leadingBarButtonGroups = _savedLeadingGroups ?: @[];
    item.trailingBarButtonGroups = _savedTrailingGroups ?: @[];
  }
  _assistantResponder = nil;
  _savedLeadingGroups = nil;
  _savedTrailingGroups = nil;
}

// Metro reload or instance teardown must never leave a web view without its keyboard.
- (void)invalidate
{
  [NSNotificationCenter.defaultCenter removeObserver:self];
  RCTExecuteOnMainQueue(^{
    [self restoreSystemKeyboard];
  });
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTenTapKeyboardSpecJSI>(params);
}
#endif

@end
