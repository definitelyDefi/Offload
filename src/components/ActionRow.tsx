import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {colors, spacing, radius, typography} from '../theme';
import {ALL_CONTEXTS} from '../types';
import DatePicker from './DatePicker';
import type {GTDContext, Action} from '../types';

interface ActionRowProps {
  action: Action;
  projectTitle?: string;
  showFocusToggle?: boolean;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, text: string, context: GTDContext, dueDate?: number) => void;
  onCancelEdit: () => void;
  onComplete: (action: Action) => void;
  onDelete: (action: Action) => void;
  onToggleFocus: (id: string) => void;
  justDoneId: string | null;
}

function formatDueDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === -1) return 'Due yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `Due ${d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`;
}

export default function ActionRow({
  action,
  projectTitle,
  showFocusToggle = false,
  editingId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onComplete,
  onDelete,
  onToggleFocus,
  justDoneId,
}: ActionRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const isEditing = editingId === action.id;
  const isDone = justDoneId === action.id;

  const [editText, setEditText] = useState(action.text);
  const [editContext, setEditContext] = useState<GTDContext>(action.context);
  const [editDueDate, setEditDueDate] = useState<Date | null>(
    action.dueDate ? new Date(action.dueDate) : null,
  );

  const isOverdue = !!action.dueDate && action.dueDate < Date.now();

  const handleSwipeComplete = () => {
    swipeRef.current?.close();
    Vibration.vibrate(50);
    onComplete(action);
  };

  const handleSwipeDelete = () => {
    swipeRef.current?.close();
    Alert.alert('Delete action', `"${action.text}"`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => onDelete(action)},
    ]);
  };

  const startEdit = () => {
    setEditText(action.text);
    setEditContext(action.context);
    setEditDueDate(action.dueDate ? new Date(action.dueDate) : null);
    onStartEdit(action.id);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    onSaveEdit(action.id, editText, editContext, editDueDate?.getTime());
  };

  const renderLeftActions = () => (
    <TouchableOpacity style={styles.swipeComplete} onPress={handleSwipeComplete}>
      <Text style={styles.swipeCompleteText}>✓</Text>
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity style={styles.swipeDelete} onPress={handleSwipeDelete}>
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <TextInput
          style={styles.editInput}
          value={editText}
          onChangeText={setEditText}
          placeholder="Action text"
          placeholderTextColor={colors.textDisabled}
          autoFocus
          multiline
        />
        <View style={styles.contextRow}>
          {ALL_CONTEXTS.map(ctx => (
            <TouchableOpacity
              key={ctx}
              style={[styles.ctxChip, editContext === ctx && styles.ctxChipActive]}
              onPress={() => setEditContext(ctx)}
              activeOpacity={0.7}>
              <Text style={[styles.ctxChipText, editContext === ctx && styles.ctxChipTextActive]}>
                {ctx}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <DatePicker
          value={editDueDate}
          onChange={setEditDueDate}
          setLabel="+ Set due date"
          defaultOffsetDays={1}
        />
        <View style={styles.editButtons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelEdit}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, !editText.trim() && styles.saveBtnDisabled]}
            onPress={saveEdit}
            disabled={!editText.trim()}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      overshootFriction={8}
      leftThreshold={60}
      rightThreshold={60}>
      <View style={[styles.row, isDone && styles.rowDone]}>
        <TouchableOpacity
          style={[styles.checkbox, isDone && styles.checkboxDone]}
          onPress={() => { Vibration.vibrate(50); onComplete(action); }}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          {isDone && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.body} onPress={startEdit} activeOpacity={0.7}>
          <Text style={[styles.actionText, isDone && styles.actionTextDone]} numberOfLines={2}>
            {action.text}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.contextBadge}>{action.context}</Text>
            {projectTitle && (
              <Text style={styles.projectBadge} numberOfLines={1}>{projectTitle}</Text>
            )}
            {action.dueDate && (
              <Text style={[styles.dueBadge, isOverdue && styles.dueBadgeOverdue]}>
                {formatDueDate(action.dueDate)}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {showFocusToggle && (
          <TouchableOpacity
            onPress={() => onToggleFocus(action.id)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={styles.focusBtn}>
            <Text style={[styles.focusStar, action.isFocused && styles.focusStarActive]}>
              ★
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowDone: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkmark: {
    fontSize: 13,
    color: colors.background,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  actionText: {
    ...typography.body,
    color: colors.text,
  },
  actionTextDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contextBadge: {
    ...typography.micro,
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  projectBadge: {
    ...typography.micro,
    color: colors.someday,
    backgroundColor: colors.somedayMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    maxWidth: 140,
  },
  dueBadge: {
    ...typography.micro,
    color: colors.textMuted,
  },
  dueBadgeOverdue: {
    color: colors.danger,
    fontWeight: '600',
  },
  focusBtn: {
    padding: spacing.xs,
  },
  focusStar: {
    fontSize: 18,
    color: colors.border,
  },
  focusStarActive: {
    color: colors.warning,
  },
  swipeComplete: {
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  swipeCompleteText: {
    fontSize: 20,
    color: colors.background,
    fontWeight: '700',
  },
  swipeDelete: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  swipeDeleteText: {
    ...typography.callout,
    color: colors.text,
    fontWeight: '600',
  },
  // Inline edit
  editContainer: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  editInput: {
    ...typography.body,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ctxChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctxChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  ctxChipText: {
    ...typography.micro,
    color: colors.textMuted,
  },
  ctxChipTextActive: {
    color: colors.primary,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  cancelBtnText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  saveBtnText: {
    ...typography.callout,
    color: colors.text,
    fontWeight: '600',
  },
});
