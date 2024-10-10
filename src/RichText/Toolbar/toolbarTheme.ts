import type { ToolbarTheme } from '../../types';

export const defaultToolbarTheme: ToolbarTheme = {
  toolbarBody: {
    flex: 1,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: '#DEE0E3',
    borderBottomColor: '#DEE0E3',
    backgroundColor: 'white',
    minWidth: '100%',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    paddingHorizontal: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: {
    tintColor: '#CACACA',
  },
  iconWrapperDisabled: {
    opacity: 0.3,
  },
  iconWrapperActive: {
    backgroundColor: '#F5F5F5',
  },
  hidden: {
    display: 'none',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  iconWrapper: {
    borderRadius: 4,
    backgroundColor: 'white',
    padding: 4,
  },
  icon: {
    height: 20,
    width: 20,
    tintColor: '#898989',
  },
  iconActive: {},
  linkBarTheme: {
    addLinkContainer: {
      flex: 1,
      flexDirection: 'row',
      height: 44,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderTopColor: '#e0e0e0',
      borderBottomColor: '#e0e0e0',
      backgroundColor: 'white',
      padding: 4,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkInput: {
      paddingLeft: 12,
      paddingTop: 1,
      paddingBottom: 1,
      paddingRight: 12,
      flex: 1,
    },
    doneButton: {
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      height: 32,
      padding: 8,
      borderRadius: 4,
    },
    doneButtonText: {
      color: '#0085FF',
    },
    linkToolbarButton: {
      paddingHorizontal: 0,
    },
  },
  section: {
    flexDirection: 'row',
  },
  stickyKeyboardContainer: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
  },
  separatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    height: '100%',
  },
  separatorLine: {
    width: 1,
    height: '60%',
    backgroundColor: '#C6C6C6B3',
  },
};

export const darkToolbarTheme: Partial<ToolbarTheme> = {
  toolbarBody: {
    borderTopColor: '#C6C6C6B3',
    borderBottomColor: '#C6C6C6B3',
    backgroundColor: '#474747',
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    backgroundColor: '#474747',
  },
  iconDisabled: {
    tintColor: '#CACACA',
  },
  iconWrapperActive: {
    backgroundColor: '#8E8E93',
  },
  iconWrapper: {
    borderRadius: 4,
    backgroundColor: '#474747',
  },
  hidden: {
    display: 'none',
  },
  icon: {
    tintColor: 'white',
  },
  linkBarTheme: {
    addLinkContainer: {
      backgroundColor: '#474747',
      borderTopColor: '#939394',
      borderBottomColor: '#939394',
    },
    linkInput: {
      backgroundColor: '#474747',
      color: 'white',
    },
    placeholderTextColor: '#B2B2B8',
    doneButton: {
      backgroundColor: '#0085FF',
    },
    doneButtonText: {
      color: 'white',
    },
    linkToolbarButton: {},
  },
  separatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    height: '100%',
  },
  separatorLine: {
    width: 1,
    height: '60%',
    backgroundColor: '#C6C6C6B3',
  },
  section: {
    flexDirection: 'row',
  },
  stickyKeyboardContainer: {
    width: 44,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    flex: 1,
  },
};
