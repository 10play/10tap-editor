#import <UIKit/UIKit.h>
#import <React/RCTUIManager.h>

@interface TenTapViewImpl : UIView

@property (nonatomic, strong) UITextField *textField;
@property (nonatomic, copy) NSString *text;
@property (nonatomic, copy) NSString *placeholder;
@property (nonatomic, copy) NSNumber *inputTag;
@property (nonatomic, weak) RCTBridge *bridge;

@end
