import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BoardSummary } from '@/lib/api/types';

const cardColors = ['#eaf0ff', '#e7f7f2', '#fff2df', '#f2eaff'];

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
    borderColor: '#e8ebf2',
    borderRadius: 18,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    shadowColor: '#17233d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  previewTitle: {
    width: '48%',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#293552',
  },
  previewRow: {
    flexDirection: 'row',
    marginTop: 13,
  },
  previewBlock: {
    width: 31,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#cdd5ff',
  },
  previewBlockSmall: {
    width: 22,
    height: 24,
    marginLeft: 8,
    borderRadius: 5,
    backgroundColor: '#d8efe8',
  },
  previewLine: {
    width: '86%',
    height: 4,
    marginTop: 12,
    borderRadius: 2,
    backgroundColor: '#e8ebf2',
  },
  previewLineShort: {
    width: '58%',
    height: 4,
    marginTop: 6,
    borderRadius: 2,
    backgroundColor: '#e8ebf2',
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
    color: '#475467',
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
    color: '#202b4a',
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f2f4f7',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  roleText: {
    color: '#667085',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  updated: {
    marginTop: 7,
    color: '#98a2b3',
    fontSize: 12,
  },
});
