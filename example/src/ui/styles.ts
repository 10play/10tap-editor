import { StyleSheet } from 'react-native';
import { paper, radii, spacing } from './theme';

export const layoutStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  /** The editor as a sheet of paper on the screen background. */
  paper: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: paper.background,
  },
  /** Bottom toolbars and keyboards over the screen. */
  keyboardAvoidingView: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
