import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useStore} from '../store';
import {useShallow} from 'zustand/react/shallow';
import {colors, spacing, radius, typography} from '../theme';
import type {SomedayItem} from '../types';

export default function SomedayScreen() {
  const somedayItems = useStore(useShallow(s => s.somedayItems));
  const {addSomedayItem, deleteSomedayItem, promoteSomedayToInbox, updateSomedayItem} = useStore();
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const openInput = () => {
    setShowInput(true);
    setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addSomedayItem(trimmed);
    setText('');
    setShowInput(false);
  };

  const startEdit = (item: SomedayItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    updateSomedayItem(id, editText);
    setEditingId(null);
  };

  const handleDelete = (item: SomedayItem) => {
    Alert.alert('Remove item', `"${item.text}"`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => deleteSomedayItem(item.id)},
    ]);
  };

  const handlePromote = (item: SomedayItem) => {
    Alert.alert('Send to Inbox', `Move "${item.text}" back to your inbox?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'To Inbox', onPress: () => promoteSomedayToInbox(item.id)},
    ]);
  };

  const renderItem = ({item}: {item: SomedayItem}) => {
    if (editingId === item.id) {
      return (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            autoFocus
            multiline
            onSubmitEditing={() => saveEdit(item.id)}
          />
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={() => setEditingId(null)}>
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
        onLongPress={() => startEdit(item)}
        activeOpacity={0.85}
        delayLongPress={400}>
        <Text style={styles.itemText}>{item.text}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.promoteBtn}
            onPress={() => handlePromote(item)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.promoteBtnText}>→ Inbox</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={somedayItems}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          somedayItems.length > 0 ? (
            <Text style={styles.listHeader}>
              {somedayItems.length} idea{somedayItems.length !== 1 ? 's' : ''}
              {'\n'}
              <Text style={styles.listHint}>Long-press to edit</Text>
            </Text>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {showInput ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="Something you might do someday..."
                  placeholderTextColor={colors.textDisabled}
                  autoFocus
                  multiline
                />
                <View style={styles.inputButtons}>
                  <TouchableOpacity
                    onPress={() => {setShowInput(false); setText('');}}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, !text.trim() && styles.saveBtnDisabled]}
                    onPress={submit}
                    disabled={!text.trim()}>
                    <Text style={styles.saveBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={openInput}>
                <Text style={styles.addBtnText}>+ Add to someday</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          !showInput ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Someday / Maybe</Text>
              <Text style={styles.emptyBody}>
                Park ideas you're not committing to now. Review weekly.
              </Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
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
  listHint: {
    ...typography.micro,
    color: colors.textDisabled,
    textTransform: 'none',
    letterSpacing: 0,
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
    borderLeftColor: colors.someday,
    gap: spacing.md,
  },
  itemText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  promoteBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.sm,
  },
  promoteBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteBtnText: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  editRow: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.someday,
  },
  editInput: {
    ...typography.body,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.someday,
    paddingVertical: spacing.sm,
    minHeight: 40,
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
    backgroundColor: colors.someday,
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
  footer: {
    marginTop: spacing.md,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  saveBtn: {
    backgroundColor: colors.someday,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  saveBtnText: {
    ...typography.callout,
    color: colors.text,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addBtnText: {
    ...typography.callout,
    color: colors.someday,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
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
