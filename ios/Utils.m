#import <Foundation/Foundation.h>
#import "Utils.h"
#import <UIKit/UIKit.h>

@implementation Utils

+ (id)alloc {
  [NSException raise:@"Cannot be instantiated!" format:@"Static class 'Utils' cannot be instantiated!"];
  return nil;
}

@end
