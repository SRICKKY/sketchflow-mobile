import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BoardSummary } from '@/lib/api/types';
import { colors } from '@/theme/colors';

const cardColors = [
  colors.accentSoft,
  colors.soft,
  colors.canvasYellow,
  colors.canvasPink,
];

function formattedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently updated';
  }
  return `Updated ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}

export function BoardCard({
  board,
  index,
  onPress,
}: {
  board: BoardSummary;
  index: number;
  onPress: () => void;
}) {
  const color = cardColors[index % cardColors.length];

  return (
    <Pressable
      accessibilityLabel={`${board.name}, ${board.elementCount} elements`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.preview, { backgroundColor: color }]}>
        <View style={styles.previewSheet}>
          <View style={styles.previewTitle} />
          <View style={styles.previewRow}>
            <View style={styles.previewBlock} />
            <View style={styles.previewBlockSmall} />
          </View>
          <View style={styles.previewLine} />
          <View style={styles.previewLineShort} />
        </View>
        <View style={styles.elementCount}>
          <Text style={styles.elementCountText}>{board.elementCount} items</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>
            {board.name}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{board.role}</Text>
          </View>
        </View>
        <Text style={styles.updated}>{formattedDate(board.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.panel,
  },
  preview: {
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  previewSheet: {
    width: '66%',
    height: '100%',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.panel,
    paddingHorizontal: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  previewTitle: {
    width: '48%',
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.deepTeal,
  },
  previewRow: {
    flexDirection: 'row',
    marginTop: 13,
  },
  previewBlock: {
    width: 31,
    height: 24,
    borderRadius: 5,
    backgroundColor: colors.highlight,
  },
  previewBlockSmall: {
    width: 22,
    height: 24,
    marginLeft: 8,
    borderRadius: 5,
    backgroundColor: colors.accentSoft,
  },
  previewLine: {
    width: '86%',
    height: 4,
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  previewLineShort: {
    width: '58%',
    height: 4,
    marginTop: 6,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  elementCount: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  elementCountText: {
    color: colors.body,
    fontSize: 11,
    fontWeight: '700',
  },
  details: {
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.subtle,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  roleText: {
    color: colors.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  updated: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 12,
  },
});
