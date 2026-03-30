import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useStore} from '../store';
import {colors, spacing, radius, typography} from '../theme';
import {ALL_CONTEXTS} from '../types';
import DatePicker from '../components/DatePicker';
import type {GTDContext} from '../types';
import type {InboxStackParams} from '../navigation';

type Nav = NativeStackNavigationProp<InboxStackParams, 'Clarify'>;
type Route = RouteProp<InboxStackParams, 'Clarify'>;

type Step =
  | 'actionable'
  | 'single_or_project'
  | 'next_action_form'
  | 'project_form'
  | 'not_actionable';

interface ProjectAction {
  id: number;
  text: string;
  context: GTDContext;
}

export default function ClarifyScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {itemId} = route.params;

  const item = useStore(s => s.items.find(i => i.id === itemId));
  const {clarifyItem, deleteItem, addAction, addProject, linkActionToProject, addSomedayItem} =
    useStore();

  const [step, setStep] = useState<Step>('actionable');

  // Next action form
  const [actionText, setActionText] = useState('');
  const [actionContext, setActionContext] = useState<GTDContext>('@anywhere');
  const [actionDueDate, setActionDueDate] = useState<Date | null>(null);

  // Project form
  const [projectTitle, setProjectTitle] = useState('');
  const [projectOutcome, setProjectOutcome] = useState('');
  const nextId = useRef(1);
  const [projectActions, setProjectActions] = useState<ProjectAction[]>([
    {id: 0, text: '', context: '@anywhere'},
  ]);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Item not found.</Text>
      </View>
    );
  }

  const done = (deleteOriginal = true) => {
    if (deleteOriginal) {
      deleteItem(item.id);
    } else {
      clarifyItem(item.id);
    }
    nav.goBack();
  };

  const saveNextAction = () => {
    const text = actionText.trim();
    if (!text) return;
    addAction(text, actionContext, undefined, actionDueDate?.getTime());
    done();
  };

  const saveProject = () => {
    const title = projectTitle.trim();
    const outcome = projectOutcome.trim();
    const validActions = projectActions.filter(a => a.text.trim());
    if (!title || validActions.length === 0) return;
    const projectId = addProject(title, outcome);
    validActions.forEach(a => {
      const actionId = addAction(a.text.trim(), a.context, projectId);
      linkActionToProject(projectId, actionId);
    });
    done();
  };

  const addProjectAction = () => {
    setProjectActions(prev => [...prev, {id: nextId.current++, text: '', context: '@anywhere'}]);
  };

  const updateProjectAction = (index: number, field: keyof ProjectAction, value: string) => {
    setProjectActions(prev =>
      prev.map((a, i) => (i === index ? {...a, [field]: value} : a)),
    );
  };

  const removeProjectAction = (index: number) => {
    if (projectActions.length === 1) return;
    setProjectActions(prev => prev.filter((_, i) => i !== index));
  };

  const sendToSomeday = () => {
    addSomedayItem(item.text);
    done();
  };

  const sendToTrash = () => {
    Alert.alert('Delete item', 'Remove this item permanently?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => done()},
    ]);
  };

  const firstValidAction = projectActions.some(a => a.text.trim());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {/* Item card */}
      <View style={styles.itemCard}>
        <Text style={styles.itemLabel}>Processing</Text>
        <Text style={styles.itemText}>{item.text}</Text>
      </View>

      {/* Step: Is it actionable? */}
      {step === 'actionable' && (
        <View style={styles.step}>
          <Text style={styles.question}>Is this actionable?</Text>
          <Text style={styles.hint}>
            Can you do something about it, or will you ever need to?
          </Text>
          <View style={styles.buttonRow}>
            <ChoiceButton
              label="Yes"
              sublabel="I can act on this"
              color={colors.success}
              onPress={() => { setStep('single_or_project'); }}
            />
            <ChoiceButton
              label="No"
              sublabel="Not right now"
              color={colors.textMuted}
              onPress={() => { setStep('not_actionable'); }}
            />
          </View>
        </View>
      )}

      {/* Step: Single action or project? */}
      {step === 'single_or_project' && (
        <View style={styles.step}>
          <Text style={styles.question}>One step or multiple?</Text>
          <Text style={styles.hint}>
            A project requires more than one action to complete.
          </Text>
          <View style={styles.buttonRow}>
            <ChoiceButton
              label="Next Action"
              sublabel="Single step, done"
              color={colors.primary}
              onPress={() => { setStep('next_action_form'); }}
            />
            <ChoiceButton
              label="Project"
              sublabel="Needs multiple steps"
              color={colors.someday}
              onPress={() => { setStep('project_form'); }}
            />
          </View>
          <TouchableOpacity onPress={() => setStep('actionable')}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Next Action form */}
      {step === 'next_action_form' && (
        <View style={styles.step}>
          <Text style={styles.question}>What's the next action?</Text>
          <TextInput
            style={styles.textInput}
            value={actionText}
            onChangeText={setActionText}
            placeholder="e.g. Call dentist to book appointment"
            placeholderTextColor={colors.textDisabled}
            autoFocus
            multiline
          />
          <Text style={styles.sectionLabel}>Context</Text>
          <ContextPicker value={actionContext} onChange={setActionContext} />
          <Text style={styles.sectionLabel}>Due date (optional)</Text>
          <DatePicker
            value={actionDueDate}
            onChange={setActionDueDate}
            setLabel="+ Set due date"
            defaultOffsetDays={1}
          />
          <TouchableOpacity
            style={[styles.saveBtn, !actionText.trim() && styles.saveBtnDisabled]}
            onPress={saveNextAction}
            disabled={!actionText.trim()}>
            <Text style={styles.saveBtnText}>Save Next Action</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('single_or_project')}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Project form */}
      {step === 'project_form' && (
        <View style={styles.step}>
          <Text style={styles.question}>Define the project</Text>

          <Text style={styles.fieldLabel}>Project title</Text>
          <TextInput
            style={styles.textInput}
            value={projectTitle}
            onChangeText={setProjectTitle}
            placeholder="What is the successful outcome?"
            placeholderTextColor={colors.textDisabled}
            autoFocus
          />

          <Text style={styles.fieldLabel}>Desired outcome (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMulti]}
            value={projectOutcome}
            onChangeText={setProjectOutcome}
            placeholder="What does done look like?"
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={2}
          />

          <Text style={styles.sectionLabel}>Next actions</Text>

          {projectActions.map((action, index) => (
            <View key={action.id} style={styles.projectActionBlock}>
              <View style={styles.projectActionHeader}>
                <Text style={styles.projectActionNumber}>Action {index + 1}</Text>
                {projectActions.length > 1 && (
                  <TouchableOpacity onPress={() => removeProjectAction(index)}>
                    <Text style={styles.removeActionText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.textInput}
                value={action.text}
                onChangeText={v => updateProjectAction(index, 'text', v)}
                placeholder="e.g. Draft outline"
                placeholderTextColor={colors.textDisabled}
              />
              <ContextPicker
                value={action.context}
                onChange={v => updateProjectAction(index, 'context', v)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addActionBtn} onPress={addProjectAction}>
            <Text style={styles.addActionBtnText}>+ Add another action</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!projectTitle.trim() || !firstValidAction) && styles.saveBtnDisabled,
            ]}
            onPress={saveProject}
            disabled={!projectTitle.trim() || !firstValidAction}>
            <Text style={styles.saveBtnText}>Save Project</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('single_or_project')}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step: Not actionable */}
      {step === 'not_actionable' && (
        <View style={styles.step}>
          <Text style={styles.question}>Where does it go?</Text>
          <Text style={styles.hint}>
            Non-actionable items are either trash, someday ideas, or reference material to keep.
          </Text>
          <ChoiceButton
            label="Trash"
            sublabel="Delete it — not needed"
            color={colors.danger}
            onPress={sendToTrash}
            fullWidth
          />
          <ChoiceButton
            label="Someday / Maybe"
            sublabel="Park it — might do it later"
            color={colors.someday}
            onPress={sendToSomeday}
            fullWidth
          />
          <ChoiceButton
            label="Reference"
            sublabel="Keep for information — find it in the Reference tab"
            color={colors.textMuted}
            onPress={() => done(false)}
            fullWidth
          />
          <TouchableOpacity onPress={() => setStep('actionable')}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function ChoiceButton({
  label,
  sublabel,
  color,
  onPress,
  fullWidth,
}: {
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.choiceBtn, fullWidth && styles.choiceBtnFull, {borderColor: color}]}
      onPress={onPress}
      activeOpacity={0.75}>
      <Text style={[styles.choiceBtnLabel, {color}]}>{label}</Text>
      <Text style={styles.choiceBtnSub}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function ContextPicker({
  value,
  onChange,
}: {
  value: GTDContext;
  onChange: (c: GTDContext) => void;
}) {
  return (
    <View style={styles.contextRow}>
      {ALL_CONTEXTS.map(ctx => (
        <TouchableOpacity
          key={ctx}
          style={[styles.contextChip, value === ctx && styles.contextChipActive]}
          onPress={() => onChange(ctx)}
          activeOpacity={0.7}>
          <Text style={[styles.contextChipText, value === ctx && styles.contextChipTextActive]}>
            {ctx}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    padding: spacing.xl,
  },
  itemCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemLabel: {
    ...typography.micro,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  itemText: {
    ...typography.headline,
    color: colors.text,
  },
  step: {
    gap: spacing.md,
  },
  question: {
    ...typography.largeTitle,
    color: colors.text,
  },
  hint: {
    ...typography.callout,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  choiceBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  choiceBtnFull: {
    flex: 0,
    width: '100%',
  },
  choiceBtnLabel: {
    ...typography.headline,
  },
  choiceBtnSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: -spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInputMulti: {
    minHeight: 72,
    textAlignVertical: 'top',
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  contextChipText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  contextChipTextActive: {
    color: colors.primary,
  },
  projectActionBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectActionNumber: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  removeActionText: {
    ...typography.caption,
    color: colors.danger,
  },
  addActionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  addActionBtnText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  saveBtnText: {
    ...typography.headline,
    color: colors.text,
  },
  back: {
    ...typography.callout,
    color: colors.textMuted,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
