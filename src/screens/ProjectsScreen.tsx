import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useStore, useActiveProjects, useCompletedProjects} from '../store';
import {useShallow} from 'zustand/react/shallow';
import {colors, spacing, radius, typography} from '../theme';
import type {ProjectsStackParams} from '../navigation';

type Nav = NativeStackNavigationProp<ProjectsStackParams, 'Projects'>;

export default function ProjectsScreen() {
  const nav = useNavigation<Nav>();
  const activeProjects = useActiveProjects();
  const completedProjects = useCompletedProjects();
  const actions = useStore(useShallow(s => s.actions));
  const [showCompleted, setShowCompleted] = useState(false);

  const activeActionCount = (projectId: string) => {
    const proj = activeProjects.find(p => p.id === projectId);
    if (!proj) return 0;
    return actions.filter(a => proj.actionIds.includes(a.id) && !a.done).length;
  };

  const renderActive = ({item: project}: {item: (typeof activeProjects)[0]}) => {
    const count = activeActionCount(project.id);
    return (
      <TouchableOpacity
        style={[styles.projectItem, count === 0 && styles.projectItemStalled]}
        onPress={() => nav.navigate('ProjectDetail', {projectId: project.id})}
        activeOpacity={0.7}>
        <View style={styles.projectContent}>
          <Text style={styles.projectTitle}>{project.title}</Text>
          {project.outcome ? (
            <Text style={styles.projectOutcome} numberOfLines={1}>
              {project.outcome}
            </Text>
          ) : null}
        </View>
        <View style={styles.projectMeta}>
          <Text style={[styles.actionCount, count === 0 && styles.actionCountZero]}>
            {count} action{count !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompleted = ({item: project}: {item: (typeof completedProjects)[0]}) => (
    <View style={styles.completedItem}>
      <Text style={styles.completedTitle}>{project.title}</Text>
      {project.outcome ? (
        <Text style={styles.completedOutcome} numberOfLines={1}>{project.outcome}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeProjects}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderActive}
        ListHeaderComponent={
          activeProjects.length > 0 ? (
            <Text style={styles.listHeader}>
              {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListFooterComponent={
          completedProjects.length > 0 ? (
            <View style={styles.completedSection}>
              <TouchableOpacity
                style={styles.completedToggle}
                onPress={() => setShowCompleted(v => !v)}
                activeOpacity={0.7}>
                <Text style={styles.completedToggleText}>
                  {showCompleted ? '▾' : '▸'} {completedProjects.length} completed
                </Text>
              </TouchableOpacity>
              {showCompleted && (
                <FlatList
                  data={completedProjects}
                  keyExtractor={p => p.id}
                  renderItem={renderCompleted}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  scrollEnabled={false}
                />
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No active projects</Text>
            <Text style={styles.emptyBody}>
              Projects are created when you clarify multi-step inbox items.
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
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  projectItemStalled: {
    borderLeftColor: colors.danger,
  },
  projectContent: {
    flex: 1,
    gap: spacing.xs,
  },
  projectTitle: {
    ...typography.headline,
    color: colors.text,
  },
  projectOutcome: {
    ...typography.caption,
    color: colors.textMuted,
  },
  projectMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  actionCount: {
    ...typography.caption,
    color: colors.primary,
  },
  actionCountZero: {
    color: colors.danger,
  },
  chevron: {
    ...typography.title,
    color: colors.textMuted,
  },
  completedSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  completedToggle: {
    paddingVertical: spacing.sm,
  },
  completedToggleText: {
    ...typography.callout,
    color: colors.textMuted,
  },
  completedItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    opacity: 0.6,
    gap: spacing.xs,
  },
  completedTitle: {
    ...typography.body,
    color: colors.text,
    textDecorationLine: 'line-through',
  },
  completedOutcome: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
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
