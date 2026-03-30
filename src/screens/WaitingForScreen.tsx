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
import {useStore, useActiveWaitingFor} from '../store';
import {colors, spacing, radius, typography} from '../theme';
import DatePicker from '../components/DatePicker';
import type {WaitingFor} from '../types';

export default function WaitingForScreen() {
  const waitingFor = useActiveWaitingFor();
  const resolvedItems = useStore(s => s.waitingFor.filter(w => !!w.resolvedAt));
  const {addWaitingFor, updateWaitingFor, resolveWaitingFor, deleteWaitingFor} = useStore();
  const listRef = useRef<FlatList>(null);

  const [showForm, setShowForm] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [itemText, setItemText] = useState('');
  const [person, setPerson] = useState('');
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPerson, setEditPerson] = useState('');
  const [editFollowUp, setEditFollowUp] = useState<Date | null>(null);

  const submit = () => {
    const text = itemText.trim();
    const personName = person.trim();
    if (!text || !personName) return;
    const followUp = followUpDate ? followUpDate.getTime() : undefined;
    addWaitingFor(text, personName, followUp);
    setItemText('');
    setPerson('');
    setFollowUpDate(null);
    setShowForm(false);
  };

  const startEdit = (item: WaitingFor) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditPerson(item.person);
    setEditFollowUp(item.followUpDate ? new Date(item.followUpDate) : null);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim() || !editPerson.trim()) return;
    updateWaitingFor(id, editText, editPerson, editFollowUp?.getTime());
    setEditingId(null);
  };

  const handleResolve = (item: WaitingFor) => {
    Alert.alert('Mark resolved', `Mark "${item.text}" as received/resolved?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Resolved', onPress: () => resolveWaitingFor(item.id)},
    ]);
  };

  const handleDelete = (item: WaitingFor) => {
    Alert.alert('Remove item', `"${item.text}" (waiting on ${item.person})`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => deleteWaitingFor(item.id)},
    ]);
  };

  const formatDate = (ts?: number) => {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
  };

  const isOverdue = (ts?: number) => !!ts && ts < Date.now();

  const openForm = () => {
    setShowForm(true);
    setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 100);
  };

  const renderItem = ({item}: {item: WaitingFor}) => {
    if (editingId === item.id) {
      return (
        <View style={styles.editRow}>
          <Text style={styles.formLabel}>What are you waiting for?</Text>
          <TextInput
            style={styles.input}
            value={editText}
            onChangeText={setEditText}
            autoFocus
            placeholderTextColor={colors.textDisabled}
          />
          <Text style={styles.formLabel}>Waiting on</Text>
          <TextInput
            style={styles.input}
            value={editPerson}
            onChangeText={setEditPerson}
            placeholderTextColor={colors.textDisabled}
          />
          <Text style={styles.formLabel}>Follow-up date</Text>
          <DatePicker value={editFollowUp} onChange={setEditFollowUp} />
          <View style={styles.formButtons}>
            <TouchableOpacity onPress={() => setEditingId(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!editText.trim() || !editPerson.trim()) && styles.saveBtnDisabled,
              ]}
              onPress={() => saveEdit(item.id)}
              disabled={!editText.trim() || !editPerson.trim()}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const overdue = isOverdue(item.followUpDate);
    return (
      <TouchableOpacity
        style={[styles.item, overdue && styles.itemOverdue]}
        onLongPress={() => startEdit(item)}
        activeOpacity={0.85}
        delayLongPress={400}>
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{item.text}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.personBadge}>@{item.person}</Text>
            {item.followUpDate && (
              <Text style={[styles.dateBadge, overdue && styles.dateBadgeOverdue]}>
                follow up {formatDate(item.followUpDate)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => handleResolve(item)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={styles.resolveBtn}>
            <Text style={styles.resolveBtnText}>✓</Text>
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

  const renderResolved = ({item}: {item: WaitingFor}) => (
    <View style={styles.resolvedItem}>
      <Text style={styles.resolvedText}>{item.text}</Text>
      <Text style={styles.resolvedMeta}>@{item.person}</Text>
      <TouchableOpacity
        onPress={() => deleteWaitingFor(item.id)}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={waitingFor}
        keyExtractor={w => w.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          waitingFor.length > 0 ? (
            <Text style={styles.listHeader}>
              {waitingFor.length} item{waitingFor.length !== 1 ? 's' : ''}
              {'\n'}
              <Text style={styles.listHint}>Long-press to edit</Text>
            </Text>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {showForm ? (
              <View style={styles.form}>
                <Text style={styles.formLabel}>What are you waiting for?</Text>
                <TextInput
                  style={styles.input}
                  value={itemText}
                  onChangeText={setItemText}
                  placeholder="e.g. Signed contract from legal team"
                  placeholderTextColor={colors.textDisabled}
                  autoFocus
                />
                <Text style={styles.formLabel}>Waiting on (person or team)</Text>
                <TextInput
                  style={styles.input}
                  value={person}
                  onChangeText={setPerson}
                  placeholder="e.g. Sarah, Legal, IT"
                  placeholderTextColor={colors.textDisabled}
                />
                <Text style={styles.formLabel}>Follow-up date</Text>
                <DatePicker value={followUpDate} onChange={setFollowUpDate} />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowForm(false);
                      setItemText('');
                      setPerson('');
                      setFollowUpDate(null);
                    }}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      (!itemText.trim() || !person.trim()) && styles.saveBtnDisabled,
                    ]}
                    onPress={submit}
                    disabled={!itemText.trim() || !person.trim()}>
                    <Text style={styles.saveBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={openForm}>
                <Text style={styles.addBtnText}>+ Add waiting for</Text>
              </TouchableOpacity>
            )}

            {resolvedItems.length > 0 && (
              <View style={styles.resolvedSection}>
                <TouchableOpacity
                  onPress={() => setShowResolved(v => !v)}
                  style={styles.resolvedToggle}>
                  <Text style={styles.resolvedToggleText}>
                    {showResolved ? '▾' : '▸'} {resolvedItems.length} resolved
                  </Text>
                </TouchableOpacity>
                {showResolved && (
                  <FlatList
                    data={resolvedItems}
                    keyExtractor={w => w.id}
                    renderItem={renderResolved}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !showForm ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing delegated</Text>
              <Text style={styles.emptyBody}>
                Track things you're waiting on from others.
              </Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  list: {padding: spacing.md, paddingBottom: spacing.xxl},
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
  separator: {height: spacing.xs},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    gap: spacing.md,
  },
  itemOverdue: {borderLeftColor: colors.danger},
  itemContent: {flex: 1, gap: spacing.xs},
  itemText: {...typography.body, color: colors.text},
  metaRow: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap'},
  personBadge: {
    ...typography.micro,
    color: colors.warning,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dateBadge: {...typography.micro, color: colors.textMuted},
  dateBadgeOverdue: {color: colors.danger},
  itemActions: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
  resolveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveBtnText: {fontSize: 13, color: colors.success, fontWeight: '700'},
  deleteBtnText: {...typography.caption, color: colors.textDisabled},
  editRow: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  footer: {marginTop: spacing.md, gap: spacing.lg},
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  formLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: -spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelText: {...typography.callout, color: colors.textMuted},
  saveBtn: {
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  saveBtnDisabled: {backgroundColor: colors.surfaceElevated},
  saveBtnText: {...typography.callout, color: '#000', fontWeight: '600'},
  addBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addBtnText: {...typography.callout, color: colors.warning},
  resolvedSection: {gap: spacing.sm},
  resolvedToggle: {paddingVertical: spacing.xs},
  resolvedToggleText: {...typography.callout, color: colors.textMuted},
  resolvedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    opacity: 0.6,
    gap: spacing.md,
  },
  resolvedText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    textDecorationLine: 'line-through',
  },
  resolvedMeta: {...typography.micro, color: colors.textMuted},
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyTitle: {...typography.title, color: colors.text},
  emptyBody: {
    ...typography.callout,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
