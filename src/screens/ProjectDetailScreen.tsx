import React, {useState, useRef, useEffect, useLayoutEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useStore} from '../store';
import {useShallow} from 'zustand/react/shallow';
import {colors, spacing, radius, typography} from '../theme';
import {ALL_CONTEXTS} from '../types';
import ActionRow from '../components/ActionRow';
import DatePicker from '../components/DatePicker';
import type {GTDContext, Action} from '../types';
import type {ProjectsStackParams} from '../navigation';

type Nav = NativeStackNavigationProp<ProjectsStackParams, 'ProjectDetail'>;
type Route = RouteProp<ProjectsStackParams, 'ProjectDetail'>;

export default function ProjectDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {projectId} = route.params;

  const project = useStore(s => s.projects.find(p => p.id === projectId));
  const projectActions = useStore(useShallow(s =>
    project
      ? s.actions.filter(a => project.actionIds.includes(a.id) && !a.done)
      : [],
  ));
  const completedProjectActions = useStore(useShallow(s =>
    project
      ? s.actions.filter(a => project.actionIds.includes(a.id) && a.done)
      : [],
  ));
  const {
    addAction,
    linkActionToProject,
    completeAction,
    uncompleteAction,
    deleteAction,
    completeProject,
    deleteProject,
    updateProject,
    updateAction,
    toggleFocusAction,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [newActionText, setNewActionText] = useState('');
  const [newActionContext, setNewActionContext] = useState<GTDContext>('@anywhere');
  const [newActionDueDate, setNewActionDueDate] = useState<Date | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCompletedActions, setShowCompletedActions] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editOutcome, setEditOutcome] = useState('');

  useLayoutEffect(() => {
    if (project) {
      nav.setOptions({title: project.title});
    }
  }, [project, nav]);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Project not found.</Text>
      </View>
    );
  }

  const startEdit = () => {
    setEditTitle(project.title);
    setEditOutcome(project.outcome);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    updateProject(projectId, editTitle, editOutcome);
    setEditing(false);
  };

  const saveNewAction = () => {
    const text = newActionText.trim();
    if (!text) return;
    const actionId = addAction(text, newActionContext, projectId, newActionDueDate?.getTime());
    linkActionToProject(projectId, actionId);
    setNewActionText('');
    setNewActionContext('@anywhere');
    setNewActionDueDate(null);
    setShowForm(false);
  };

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

  const handleCompleteProject = () => {
    Alert.alert('Complete project', `Mark "${project.title}" as done?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Complete',
        onPress: () => {
          completeProject(projectId);
          nav.goBack();
        },
      },
    ]);
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete project',
      `Delete "${project.title}" and all its actions?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProject(projectId);
            nav.goBack();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projectActions}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => setEditingId(null)}
        renderItem={({item}) => (
          <ActionRow
            action={item}
            showFocusToggle={false}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {editing ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.editTitleInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Project title"
                  placeholderTextColor={colors.textDisabled}
                  autoFocus
                />
                <TextInput
                  style={[styles.editOutcomeInput]}
                  value={editOutcome}
                  onChangeText={setEditOutcome}
                  placeholder="Desired outcome (optional)"
                  placeholderTextColor={colors.textDisabled}
                  multiline
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity onPress={() => setEditing(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, !editTitle.trim() && styles.saveBtnDisabled]}
                    onPress={saveEdit}
                    disabled={!editTitle.trim()}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={startEdit} activeOpacity={0.8}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                {project.outcome ? (
                  <Text style={styles.projectOutcome}>{project.outcome}</Text>
                ) : (
                  <Text style={styles.addOutcomeTap}>Tap to add outcome…</Text>
                )}
              </TouchableOpacity>
            )}
            {!editing && (
              <Text style={styles.actionsLabel}>
                {projectActions.length === 0
                  ? 'No active actions — add one below'
                  : `${projectActions.length} active action${projectActions.length !== 1 ? 's' : ''}`}
              </Text>
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {showForm ? (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.textInput}
                  value={newActionText}
                  onChangeText={setNewActionText}
                  placeholder="What's the next action?"
                  placeholderTextColor={colors.textDisabled}
                  autoFocus
                />
                <View style={styles.contextRow}>
                  {ALL_CONTEXTS.map(ctx => (
                    <TouchableOpacity
                      key={ctx}
                      style={[
                        styles.contextChip,
                        newActionContext === ctx && styles.contextChipActive,
                      ]}
                      onPress={() => setNewActionContext(ctx)}>
                      <Text
                        style={[
                          styles.contextChipText,
                          newActionContext === ctx && styles.contextChipTextActive,
                        ]}>
                        {ctx}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <DatePicker
                  value={newActionDueDate}
                  onChange={setNewActionDueDate}
                  setLabel="+ Set due date"
                  defaultOffsetDays={1}
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setShowForm(false); setNewActionDueDate(null); }}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, !newActionText.trim() && styles.saveBtnDisabled]}
                    onPress={saveNewAction}
                    disabled={!newActionText.trim()}>
                    <Text style={styles.saveBtnText}>Add Action</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addActionBtn}
                onPress={() => setShowForm(true)}>
                <Text style={styles.addActionBtnText}>+ Add next action</Text>
              </TouchableOpacity>
            )}

            {/* Completed project actions */}
            {completedProjectActions.length > 0 && (
              <View style={styles.completedSection}>
                <TouchableOpacity
                  style={styles.completedToggle}
                  onPress={() => setShowCompletedActions(v => !v)}
                  activeOpacity={0.7}>
                  <Text style={styles.completedToggleText}>
                    {showCompletedActions ? '▾' : '▸'} {completedProjectActions.length} completed
                  </Text>
                </TouchableOpacity>
                {showCompletedActions && completedProjectActions.map(a => (
                  <View key={a.id} style={styles.completedActionRow}>
                    <Text style={styles.completedActionText}>{a.text}</Text>
                    <TouchableOpacity
                      onPress={() => uncompleteAction(a.id)}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <Text style={styles.undoText}>Undo</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.dangerZone}>
              <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteProject}>
                <Text style={styles.completeBtnText}>Mark project complete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteProject}>
                <Text style={styles.deleteBtnTextFull}>Delete project</Text>
              </TouchableOpacity>
            </View>
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
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    padding: spacing.xl,
  },
  header: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  projectTitle: {
    ...typography.largeTitle,
    color: colors.text,
  },
  projectOutcome: {
    ...typography.callout,
    color: colors.textMuted,
  },
  addOutcomeTap: {
    ...typography.callout,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
  editForm: {
    gap: spacing.sm,
  },
  editTitleInput: {
    ...typography.largeTitle,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.xs,
  },
  editOutcomeInput: {
    ...typography.callout,
    color: colors.textMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    alignItems: 'center',
  },
  actionsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  separator: {
    height: spacing.xs,
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  addForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  textInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contextChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  contextChipText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  contextChipTextActive: {
    color: colors.primary,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
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
  addActionBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addActionBtnText: {
    ...typography.callout,
    color: colors.primary,
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
  completedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    opacity: 0.6,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  completedActionText: {
    flex: 1,
    ...typography.callout,
    color: colors.text,
    textDecorationLine: 'line-through',
  },
  undoText: {
    ...typography.micro,
    color: colors.primary,
    fontWeight: '600',
  },
  dangerZone: {
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  completeBtn: {
    backgroundColor: colors.successMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  completeBtnText: {
    ...typography.callout,
    color: colors.success,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnTextFull: {
    ...typography.callout,
    color: colors.danger,
    fontWeight: '600',
  },
});
