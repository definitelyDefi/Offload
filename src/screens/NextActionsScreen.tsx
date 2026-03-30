import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useStore, useCompletedActions} from '../store';
import {useShallow} from 'zustand/react/shallow';
import {colors, spacing, radius, typography} from '../theme';
import {ALL_CONTEXTS} from '../types';
import ActionRow from '../components/ActionRow';
import DatePicker from '../components/DatePicker';
import type {GTDContext, Action} from '../types';

const ALL_FILTER = 'All';
const FOCUS_FILTER = 'Focus';
type Filter = GTDContext | typeof ALL_FILTER | typeof FOCUS_FILTER;

export default function NextActionsScreen() {
  const [filter, setFilter] = useState<Filter>(ALL_FILTER);
  const [searchText, setSearchText] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [newContext, setNewContext] = useState<GTDContext>('@anywhere');
  const [newDueDate, setNewDueDate] = useState<Date | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const allActiveActions = useStore(useShallow(s => s.actions.filter(a => !a.done)));
  const allProjects = useStore(useShallow(s => s.projects));
  const completedActions = useCompletedActions();
  const {completeAction, uncompleteAction, deleteAction, addAction, updateAction, toggleFocusAction} = useStore();

  const actions = useMemo(() => {
    return allActiveActions.filter(a => {
      if (filter === FOCUS_FILTER && !a.isFocused) return false;
      if (filter !== ALL_FILTER && filter !== FOCUS_FILTER && a.context !== filter) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const proj = a.projectId
          ? allProjects.find(p => p.id === a.projectId)?.title ?? ''
          : '';
        return a.text.toLowerCase().includes(q) || proj.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allActiveActions, filter, searchText, allProjects]);

  const contextCount = (ctx: GTDContext) =>
    allActiveActions.filter(a => a.context === ctx).length;
  const focusCount = allActiveActions.filter(a => a.isFocused).length;

  const projectTitle = (id?: string) =>
    id ? allProjects.find(p => p.id === id)?.title : undefined;

  const handleComplete = (action: Action) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setJustDone(action.id);
    const id = action.id;
    timeoutRef.current = setTimeout(() => {
      completeAction(id);
      setJustDone(null);
      timeoutRef.current = null;
    }, 400);
  };

  const handleDelete = (action: Action) => {
    deleteAction(action.id);
  };

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addAction(text, newContext, undefined, newDueDate?.getTime());
    setNewText('');
    setNewContext('@anywhere');
    setNewDueDate(null);
    setShowAdd(false);
  };

  const filterChips: {label: string; key: Filter; count: number}[] = [
    {label: ALL_FILTER, key: ALL_FILTER, count: allActiveActions.length},
    {label: '★ Focus', key: FOCUS_FILTER, count: focusCount},
    ...ALL_CONTEXTS.map(ctx => ({label: ctx, key: ctx as Filter, count: contextCount(ctx)})),
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={actions}
        keyExtractor={a => a.id}
        renderItem={({item}) => (
          <ActionRow
            action={item}
            projectTitle={projectTitle(item.projectId)}
            showFocusToggle
            editingId={editingId}
            onStartEdit={setEditingId}
            onSaveEdit={(id, text, ctx, due) => {
              updateAction(id, text, ctx, due);
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onToggleFocus={toggleFocusAction}
            justDoneId={justDone}
          />
        )}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => setEditingId(null)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Search bar */}
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search actions…"
                placeholderTextColor={colors.textDisabled}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Context + focus filter */}
            <FlatList
              data={filterChips}
              keyExtractor={f => f.key}
              renderItem={({item: f}) => {
                const isActive = filter === f.key;
                const isFocus = f.key === FOCUS_FILTER;
                return (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      isActive && styles.filterChipActive,
                      isFocus && isActive && styles.filterChipFocus,
                    ]}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.7}>
                    <Text style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                      isFocus && isActive && styles.filterChipTextFocus,
                    ]}>
                      {f.label}
                    </Text>
                    {f.count > 0 && (
                      <Text style={[
                        styles.filterCount,
                        isActive && styles.filterCountActive,
                        isFocus && isActive && styles.filterCountFocus,
                      ]}>
                        {f.count}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            />
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {showAdd ? (
              <View style={styles.addForm}>
                <TextInput
                  ref={inputRef}
                  style={styles.addInput}
                  value={newText}
                  onChangeText={setNewText}
                  placeholder="What's the next action?"
                  placeholderTextColor={colors.textDisabled}
                  autoFocus
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                <View style={styles.contextRow}>
                  {ALL_CONTEXTS.map(ctx => (
                    <TouchableOpacity
                      key={ctx}
                      style={[styles.ctxChip, newContext === ctx && styles.ctxChipActive]}
                      onPress={() => setNewContext(ctx)}
                      activeOpacity={0.7}>
                      <Text style={[styles.ctxChipText, newContext === ctx && styles.ctxChipTextActive]}>
                        {ctx}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <DatePicker
                  value={newDueDate}
                  onChange={setNewDueDate}
                  setLabel="+ Set due date"
                  defaultOffsetDays={1}
                />
                <View style={styles.addFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setShowAdd(false); setNewText(''); setNewDueDate(null); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, !newText.trim() && styles.saveBtnDisabled]}
                    onPress={handleAdd}
                    disabled={!newText.trim()}>
                    <Text style={styles.saveBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addTrigger} onPress={() => setShowAdd(true)}>
                <Text style={styles.addTriggerText}>+ Quick add action</Text>
              </TouchableOpacity>
            )}

            {/* Completed history */}
            {completedActions.length > 0 && (
              <View style={styles.completedSection}>
                <TouchableOpacity
                  style={styles.completedToggle}
                  onPress={() => setShowCompleted(v => !v)}
                  activeOpacity={0.7}>
                  <Text style={styles.completedToggleText}>
                    {showCompleted ? '▾' : '▸'} {completedActions.length} completed
                  </Text>
                </TouchableOpacity>
                {showCompleted && completedActions.map(a => (
                  <CompletedRow
                    key={a.id}
                    action={a}
                    projectTitle={projectTitle(a.projectId)}
                    onUndo={() => uncompleteAction(a.id)}
                  />
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No actions</Text>
            <Text style={styles.emptyBody}>
              {searchText.trim()
                ? `No results for "${searchText}".`
                : filter === ALL_FILTER
                ? 'Clarify inbox items to create next actions.'
                : filter === FOCUS_FILTER
                ? 'Star an action to add it to focus.'
                : `No actions for ${filter}.`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function CompletedRow({
  action,
  projectTitle,
  onUndo,
}: {
  action: Action;
  projectTitle?: string;
  onUndo: () => void;
}) {
  const completedDaysAgo = action.completedAt
    ? Math.floor((Date.now() - action.completedAt) / (1000 * 60 * 60 * 24))
    : null;
  return (
    <View style={cStyles.row}>
      <View style={cStyles.body}>
        <Text style={cStyles.text}>{action.text}</Text>
        <View style={cStyles.meta}>
          <Text style={cStyles.context}>{action.context}</Text>
          {projectTitle && <Text style={cStyles.project}>{projectTitle}</Text>}
          {completedDaysAgo !== null && (
            <Text style={cStyles.when}>
              {completedDaysAgo === 0 ? 'Today' : `${completedDaysAgo}d ago`}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onUndo} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Text style={cStyles.undoText}>Undo</Text>
      </TouchableOpacity>
    </View>
  );
}

const cStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  body: {flex: 1, gap: 2},
  text: {
    ...typography.callout,
    color: colors.text,
    textDecorationLine: 'line-through',
  },
  meta: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center'},
  context: {
    ...typography.micro,
    color: colors.textMuted,
  },
  project: {
    ...typography.micro,
    color: colors.someday,
    maxWidth: 120,
  },
  when: {
    ...typography.micro,
    color: colors.textDisabled,
  },
  undoText: {
    ...typography.micro,
    color: colors.primary,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  searchInput: {
    flex: 1,
    ...typography.callout,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  searchClear: {
    ...typography.caption,
    color: colors.textDisabled,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  filterChipFocus: {
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    borderColor: colors.warning,
  },
  filterChipText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  filterChipTextFocus: {
    color: colors.warning,
  },
  filterCount: {
    ...typography.micro,
    color: colors.textDisabled,
    fontWeight: '700',
  },
  filterCountActive: {
    color: colors.primary,
  },
  filterCountFocus: {
    color: colors.warning,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  addTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  addTriggerText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addInput: {
    ...typography.body,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
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
    backgroundColor: colors.surfaceElevated,
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
  addFormButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
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
  completedSection: {
    gap: spacing.xs,
  },
  completedToggle: {
    paddingVertical: spacing.sm,
  },
  completedToggleText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
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
