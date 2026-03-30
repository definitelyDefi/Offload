import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStore, useUnclarifiedItems, useReviewDue} from '../store';
import {colors, spacing, radius, typography} from '../theme';
import type {InboxStackParams} from '../navigation';
import type {Item} from '../types';

type Nav = NativeStackNavigationProp<InboxStackParams, 'Inbox'>;

export default function InboxScreen() {
  const nav = useNavigation<Nav>();
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const {addItem, updateItem} = useStore();
  const unclarified = useUnclarifiedItems();
  const reviewDue = useReviewDue();

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    updateItem(id, editText);
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const renderItem = ({item}: {item: Item}) => {
    if (editingId === item.id) {
      return (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            autoFocus
            onSubmitEditing={() => saveEdit(item.id)}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={styles.editCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editSave, !editText.trim() && styles.editSaveDisabled]}
              onPress={() => saveEdit(item.id)}
              disabled={!editText.trim()}>
              <Text style={styles.editSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => nav.navigate('Clarify', {itemId: item.id})}
        onLongPress={() => startEdit(item)}
        activeOpacity={0.7}
        delayLongPress={400}>
        <Text style={styles.itemText} numberOfLines={2}>
          {item.text}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {reviewDue && (
        <View style={styles.reviewBanner}>
          <Text style={styles.reviewBannerText}>
            Weekly review is due — tap Review tab
          </Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textDisabled}
          onSubmitEditing={submit}
          returnKeyType="done"
          blurOnSubmit={false}
          autoFocus
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.addBtn, !text.trim() && styles.addBtnDisabled]}
          onPress={submit}
          disabled={!text.trim()}
          activeOpacity={0.8}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {unclarified.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Inbox zero</Text>
          <Text style={styles.emptyBody}>
            Capture anything on your mind. Clarify later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={unclarified}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {unclarified.length} item{unclarified.length !== 1 ? 's' : ''} to clarify
              {'\n'}
              <Text style={styles.listHint}>Long-press to edit</Text>
            </Text>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reviewBanner: {
    backgroundColor: colors.primaryMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewBannerText: {
    ...typography.callout,
    color: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  addBtnText: {
    ...typography.headline,
    color: colors.text,
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
  listHint: {
    ...typography.micro,
    color: colors.textDisabled,
    textTransform: 'none',
    letterSpacing: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  itemText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  chevron: {
    ...typography.title,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  separator: {
    height: spacing.xs,
  },
  editRow: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  editInput: {
    ...typography.body,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    alignItems: 'center',
  },
  editCancel: {
    ...typography.callout,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
  },
  editSave: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editSaveDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  editSaveText: {
    ...typography.callout,
    color: colors.text,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
  },
});
