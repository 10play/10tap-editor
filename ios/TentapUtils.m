#import <Foundation/Foundation.h>
#import "TentapUtils.h"
#import <UIKit/UIKit.h>

@implementation TentapUtils

+ (id)alloc {
  [NSException raise:@"Cannot be instantiated!" format:@"Static class 'TentapUtils' cannot be instantiated!"];
  return nil;
}

@end
