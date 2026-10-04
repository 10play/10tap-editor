#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"exampleoldarch";
  self.initialProps = @{};
  // The window belongs to the scene; SceneDelegate loads React Native into it.
  self.automaticallyLoadReactNativeWindow = NO;

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

// Apps built with the iOS 27 SDK must use the scene lifecycle.
@interface SceneDelegate : UIResponder <UIWindowSceneDelegate>
@property (nonatomic, strong) UIWindow *window;
@end

@implementation SceneDelegate

- (AppDelegate *)appDelegate
{
  return (AppDelegate *)UIApplication.sharedApplication.delegate;
}

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions
{
  if (![scene isKindOfClass:UIWindowScene.class]) {
    return;
  }
  AppDelegate *app = [self appDelegate];
  UIView *rootView = [app.rootViewFactory viewWithModuleName:app.moduleName
                                           initialProperties:app.initialProps
                                               launchOptions:nil];
  UIViewController *rootViewController = [app createRootViewController];
  [app setRootView:rootView toRootViewController:rootViewController];

  UIWindow *window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
  window.rootViewController = rootViewController;
  self.window = window;
  app.window = window;
  [window makeKeyAndVisible];
}

// RCTAppDelegate turns coordinate space changes into Dimensions updates.
- (void)windowScene:(UIWindowScene *)windowScene
    didUpdateCoordinateSpace:(id<UICoordinateSpace>)previousCoordinateSpace
        interfaceOrientation:(UIInterfaceOrientation)previousInterfaceOrientation
             traitCollection:(UITraitCollection *)previousTraitCollection
{
  id<UIWindowSceneDelegate> app = (id<UIWindowSceneDelegate>)[self appDelegate];
  if ([app respondsToSelector:_cmd]) {
    [app windowScene:windowScene
        didUpdateCoordinateSpace:previousCoordinateSpace
            interfaceOrientation:previousInterfaceOrientation
                 traitCollection:previousTraitCollection];
  }
}

@end
