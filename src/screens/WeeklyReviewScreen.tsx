import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {useStore, useReviewStreak} from '../store';
import {useShallow} from 'zustand/react/shallow';
import {colors, spacing, radius, typography} from '../theme';

type ReviewStep = 'intro' | 'inbox' | 'actions' | 'projects' | 'someday' | 'waiting' | 'done';

const STEPS: ReviewStep[] = ['inbox', 'actions', 'projects', 'someday', 'waiting'];

const STEP_CONFIG: Record<
  Exclude<ReviewStep, 'intro' | 'done'>,
  {title: string; description: string; icon: string}
> = {
  inbox: {
    title: 'Clear Your Inbox',
    description:
      'Process every item in your inbox. Clarify each one — no item should be left unprocessed.',
    icon: '📥',
  },
  actions: {
    title: 'Review Next Actions',
    description:
      'Go through your action lists. Mark done what is done. Remove anything that no longer makes sense.',
    icon: '✓',
  },
  projects: {
    title: 'Review Projects',
    description:
      'Every active project must have at least one next action. If it doesn\'t, add one now.',
    icon: '◎',
  },
  someday: {
    title: 'Review Someday / Maybe',
    description:
      'Anything you want to activate? Promote it to inbox. Anything clearly dead? Delete it.',
    icon: '☁',
  },
  waiting: {
    title: 'Review Waiting For',
    description:
      'Is there anything you need to follow up on? Have any items resolved?',
    icon: '⏳',
  },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function daysSince(ts: number) {
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

export default function WeeklyReviewScreen() {
  const [step, setStep] = useState<ReviewStep>('intro');
  const streak = useReviewStreak();
  const {
    items,
    actions,
    projects,
    somedayItems,
    waitingFor,
    lastReviewedAt,
    completeReview,
  } = useStore(useShallow(s => ({
    items: s.items,
    actions: s.actions,
    projects: s.projects,
    somedayItems: s.somedayItems,
    waitingFor: s.waitingFor,
    lastReviewedAt: s.lastReviewedAt,
    completeReview: s.completeReview,
  })));

  const unclarifiedCount = items.filter(i => !i.clarified).length;
  const activeActionCount = actions.filter(a => !a.done).length;
  const activeProjectCount = projects.filter(p => !p.done).length;
  const activeWaitingCount = waitingFor.filter(w => !w.resolvedAt).length;
  const stalledProjects = projects.filter(
    p => !p.done && p.actionIds.filter(id => {
      const a = actions.find(act => act.id === id);
      return a && !a.done;
    }).length === 0,
  ).length;

  const currentStepIndex = STEPS.indexOf(step as Exclude<ReviewStep, 'intro' | 'done'>);

  const goNext = () => {
    if (step === 'intro') {
      setStep('inbox');
    } else if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    } else {
      completeReview();
      setStep('done');
    }
  };

  const goBack = () => {
    if (step === 'inbox') {
      setStep('intro');
    } else if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1]);
    }
  };

  const restart = () => setStep('intro');

  if (step === 'done') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <Text style={styles.doneIcon}>✓</Text>
        <Text style={styles.doneTitle}>Review complete</Text>
        <Text style={styles.doneDate}>{formatDate(Date.now())}</Text>
        <Text style={styles.doneBody}>
          You're up to date. Your system is clean. Come back in a week.
        </Text>
        {streak > 1 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{streak} week streak</Text>
          </View>
        )}
        <View style={styles.doneSummary}>
          <SummaryRow label="Actions" value={activeActionCount} />
          <SummaryRow label="Projects" value={activeProjectCount} />
          <SummaryRow label="Someday" value={somedayItems.length} />
          <SummaryRow label="Waiting" value={activeWaitingCount} />
        </View>
        <TouchableOpacity style={styles.restartBtn} onPress={restart}>
          <Text style={styles.restartBtnText}>Back to start</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 'intro') {
    const due = !lastReviewedAt || daysSince(lastReviewedAt) >= 7;
    const days = lastReviewedAt ? daysSince(lastReviewedAt) : null;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.introHeader}>
          <Text style={styles.introTitle}>Weekly Review</Text>
          {lastReviewedAt ? (
            <Text style={[styles.lastReviewed, due && styles.lastReviewedOverdue]}>
              Last reviewed {days === 0 ? 'today' : `${days} day${days !== 1 ? 's' : ''} ago`}
              {due ? ' — overdue' : ''}
            </Text>
          ) : (
            <Text style={styles.lastReviewed}>Never reviewed</Text>
          )}
        </View>

        <Text style={styles.introBody}>
          The weekly review is how GTD stays alive. Without it, the system decays.
          Set aside 20–30 minutes and work through each step.
        </Text>

        <View style={styles.stepsList}>
          {STEPS.map((s, i) => {
            const cfg = STEP_CONFIG[s as Exclude<ReviewStep, 'intro' | 'done'>];
            return (
              <View key={s} style={styles.stepPreview}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={styles.stepPreviewContent}>
                  <Text style={styles.stepPreviewTitle}>
                    {cfg.icon} {cfg.title}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {streak} week streak
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.startBtn} onPress={goNext}>
          <Text style={styles.startBtnText}>Start Review</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Active review step
  const cfg = STEP_CONFIG[step as Exclude<ReviewStep, 'intro' | 'done'>];

  const stepCounts: Record<string, number> = {
    inbox: unclarifiedCount,
    actions: activeActionCount,
    projects: activeProjectCount,
    someday: somedayItems.length,
    waiting: activeWaitingCount,
  };

  const count = stepCounts[step];

  const stepNotes: Record<string, string | null> = {
    inbox: unclarifiedCount === 0 ? 'Inbox is clear.' : `${unclarifiedCount} item${unclarifiedCount !== 1 ? 's' : ''} to clarify.`,
    actions: `${activeActionCount} active action${activeActionCount !== 1 ? 's' : ''}.`,
    projects:
      stalledProjects > 0
        ? `${stalledProjects} project${stalledProjects !== 1 ? 's' : ''} with no active actions — add next actions now.`
        : `${activeProjectCount} active project${activeProjectCount !== 1 ? 's' : ''}. All have next actions.`,
    someday: `${somedayItems.length} item${somedayItems.length !== 1 ? 's' : ''} parked.`,
    waiting: `${activeWaitingCount} item${activeWaitingCount !== 1 ? 's' : ''} outstanding.`,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressSegment,
              i <= currentStepIndex && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressLabel}>
        Step {currentStepIndex + 1} of {STEPS.length}
      </Text>

      {/* Step content */}
      <View style={styles.stepContent}>
        <Text style={styles.stepIcon}>{cfg.icon}</Text>
        <Text style={styles.stepTitle}>{cfg.title}</Text>
        <Text style={styles.stepDescription}>{cfg.description}</Text>

        <View style={[styles.statusCard, count === 0 && styles.statusCardClear]}>
          <Text style={[styles.statusText, count === 0 && styles.statusTextClear]}>
            {stepNotes[step]}
          </Text>
        </View>

        {step === 'projects' && stalledProjects > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Go to the Projects tab and add a next action to each stalled project before continuing.
            </Text>
          </View>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {currentStepIndex > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>
            {currentStepIndex === STEPS.length - 1 ? 'Complete Review' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SummaryRow({label, value}: {label: string; value: number}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
    gap: spacing.lg,
  },
  centerContent: {
    flexGrow: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },

  // Intro
  introHeader: {
    gap: spacing.xs,
  },
  introTitle: {
    ...typography.largeTitle,
    color: colors.text,
  },
  lastReviewed: {
    ...typography.callout,
    color: colors.textMuted,
  },
  lastReviewedOverdue: {
    color: colors.danger,
  },
  introBody: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  stepsList: {
    gap: spacing.sm,
  },
  stepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepPreviewContent: {},
  stepPreviewTitle: {
    ...typography.callout,
    color: colors.text,
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  startBtnText: {
    ...typography.headline,
    color: colors.text,
  },

  // Progress
  progressBar: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  progressLabel: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: -spacing.sm,
  },

  // Step content
  stepContent: {
    gap: spacing.md,
  },
  stepIcon: {
    fontSize: 36,
  },
  stepTitle: {
    ...typography.largeTitle,
    color: colors.text,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
  },
  statusCardClear: {
    borderLeftColor: colors.success,
    backgroundColor: colors.successMuted,
  },
  statusText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  statusTextClear: {
    color: colors.success,
  },
  warningCard: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  warningText: {
    ...typography.callout,
    color: colors.danger,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  backBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  backBtnText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  nextBtnText: {
    ...typography.headline,
    color: colors.text,
  },

  streakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.success,
  },
  streakText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },

  // Done
  doneIcon: {
    fontSize: 48,
    color: colors.success,
  },
  doneTitle: {
    ...typography.largeTitle,
    color: colors.text,
  },
  doneDate: {
    ...typography.callout,
    color: colors.textMuted,
  },
  doneBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  doneSummary: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.callout,
    color: colors.textMuted,
  },
  summaryValue: {
    ...typography.headline,
    color: colors.text,
  },
  restartBtn: {
    paddingVertical: spacing.sm,
  },
  restartBtnText: {
    ...typography.callout,
    color: colors.textMuted,
  },
});
