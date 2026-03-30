import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import {useStore, useClarifiedItems} from '../store';
import {colors, spacing, radius, typography} from '../theme';
import type {Item} from '../types';

export default function ReferenceScreen() {
  const items = useClarifiedItems();
  const {deleteItem, addItem} = useStore();

  const handleDelete = (item: Item) => {
    Alert.alert('Delete reference', `Remove "${item.text}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id)},
    ]);
  };

  const handleReprocess = (item: Item) => {
    Alert.alert('Move to Inbox', `Send "${item.text}" back to inbox for re-processing?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'To Inbox',
        onPress: () => {
          addItem(item.text);
          deleteItem(item.id);
        },
      },
    ]);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});

  const renderItem = ({item}: {item: Item}) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{item.text}</Text>
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.reprocessBtn}
          onPress={() => handleReprocess(item)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.reprocessBtnText}>→ Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          items.length > 0 ? (
            <Text style={styles.listHeader}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No reference items</Text>
            <Text style={styles.emptyBody}>
              Items marked as "Reference" during clarify are stored here for later lookup.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  listHeader: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  separator: {
    height: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.textMuted,
    gap: spacing.md,
  },
  itemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  itemText: {
    ...typography.body,
    color: colors.text,
  },
  itemDate: {
    ...typography.micro,
    color: colors.textDisabled,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reprocessBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
  },
  reprocessBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteBtnText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text,
  },
  emptyBody: {
    ...typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
