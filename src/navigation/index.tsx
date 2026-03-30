import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Share} from 'react-native';
import {NavigationContainer, DrawerActions} from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors, spacing, radius, typography} from '../theme';
import {useUnclarifiedItems, useReviewDue, useStore, useStalledProjectCount} from '../store';
import {useShallow} from 'zustand/react/shallow';

import InboxScreen from '../screens/InboxScreen';
import ClarifyScreen from '../screens/ClarifyScreen';
import NextActionsScreen from '../screens/NextActionsScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import SomedayScreen from '../screens/SomedayScreen';
import WaitingForScreen from '../screens/WaitingForScreen';
import WeeklyReviewScreen from '../screens/WeeklyReviewScreen';
import ReferenceScreen from '../screens/ReferenceScreen';

export type InboxStackParams = {
  Inbox: undefined;
  Clarify: {itemId: string};
};

export type ProjectsStackParams = {
  Projects: undefined;
  ProjectDetail: {projectId: string};
};

export type DrawerParams = {
  InboxStack: undefined;
  NextActions: undefined;
  ProjectsStack: undefined;
  Someday: undefined;
  WaitingFor: undefined;
  Reference: undefined;
  WeeklyReview: undefined;
};

const Drawer = createDrawerNavigator<DrawerParams>();
const InboxStack = createNativeStackNavigator<InboxStackParams>();
const ProjectsStack = createNativeStackNavigator<ProjectsStackParams>();

const stackScreenOptions = {
  headerStyle: {backgroundColor: colors.background},
  headerTintColor: colors.text,
  headerTitleStyle: typography.headline,
  headerShadowVisible: false,
  contentStyle: {backgroundColor: colors.background},
};

function InboxNavigator() {
  return (
    <InboxStack.Navigator screenOptions={stackScreenOptions}>
      <InboxStack.Screen
        name="Inbox"
        component={InboxScreen}
        options={({navigation}) => ({
          title: 'Inbox',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={styles.menuBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.menuBtnText}>☰</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <InboxStack.Screen name="Clarify" component={ClarifyScreen} options={{title: 'Clarify'}} />
    </InboxStack.Navigator>
  );
}

function ProjectsNavigator() {
  return (
    <ProjectsStack.Navigator screenOptions={stackScreenOptions}>
      <ProjectsStack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={({navigation}) => ({
          title: 'Projects',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={styles.menuBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={styles.menuBtnText}>☰</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <ProjectsStack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{title: 'Project'}}
      />
    </ProjectsStack.Navigator>
  );
}

const NAV_ITEMS: {
  name: keyof DrawerParams;
  label: string;
  icon: string;
  color?: string;
}[] = [
  {name: 'InboxStack', label: 'Inbox', icon: '⬇'},
  {name: 'NextActions', label: 'Next Actions', icon: '◉'},
  {name: 'ProjectsStack', label: 'Projects', icon: '◈'},
  {name: 'Someday', label: 'Someday / Maybe', icon: '◆', color: colors.someday},
  {name: 'WaitingFor', label: 'Waiting For', icon: '⧗', color: colors.warning},
  {name: 'Reference', label: 'Reference', icon: '◧'},
  {name: 'WeeklyReview', label: 'Weekly Review', icon: '⟳'},
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const {state, navigation} = props;
  const currentRoute = state.routes[state.index].name;
  const unclarified = useUnclarifiedItems();
  const reviewDue = useReviewDue();
  const stalledCount = useStalledProjectCount();

  const exportState = useStore(useShallow(s => ({
    items: s.items,
    actions: s.actions,
    projects: s.projects,
    waitingFor: s.waitingFor,
    somedayItems: s.somedayItems,
    lastReviewedAt: s.lastReviewedAt,
  })));

  const handleExport = async () => {
    const payload = JSON.stringify(
      {exportedAt: new Date().toISOString(), ...exportState},
      null,
      2,
    );
    try {
      await Share.share({message: payload, title: 'Offload GTD Export'});
    } catch (_) {}
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerContainer}
      contentContainerStyle={styles.drawerContent}>
      <Text style={styles.drawerTitle}>Offload</Text>
      <Text style={styles.drawerSubtitle}>Getting Things Done</Text>

      <View style={styles.divider} />

      {NAV_ITEMS.map(item => {
        const isActive = currentRoute === item.name;
        const badge =
          item.name === 'InboxStack' && unclarified.length > 0
            ? unclarified.length
            : item.name === 'WeeklyReview' && reviewDue
            ? '!'
            : item.name === 'ProjectsStack' && stalledCount > 0
            ? stalledCount
            : null;
        const badgeDanger =
          item.name === 'WeeklyReview' || item.name === 'ProjectsStack';

        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.drawerItem, isActive && styles.drawerItemActive]}
            onPress={() => navigation.navigate(item.name as string)}
            activeOpacity={0.7}>
            <Text style={[
              styles.drawerItemIcon,
              isActive ? styles.drawerItemIconActive : item.color ? {color: item.color} : null,
            ]}>
              {item.icon}
            </Text>
            <Text style={[styles.drawerItemLabel, isActive && styles.drawerItemLabelActive]}>
              {item.label}
            </Text>
            {badge !== null && (
              <View style={[styles.badge, badgeDanger && styles.badgeDanger]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      <View style={styles.divider} />

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
        <Text style={styles.exportBtnText}>⬆ Export data</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

function FAB() {
  const addItem = useStore(s => s.addItem);
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const inputRef = React.useRef<any>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setText('');
    setVisible(false);
  };

  if (visible) {
    return (
      <KeyboardAvoidingView
        style={fabStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={fabStyles.backdrop} onPress={() => { setVisible(false); setText(''); }} />
        <View style={fabStyles.sheet}>
          <Text style={fabStyles.sheetTitle}>Capture</Text>
          <TextInput
            ref={inputRef}
            style={fabStyles.input}
            value={text}
            onChangeText={setText}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textDisabled}
            autoFocus
            onSubmitEditing={submit}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <View style={fabStyles.sheetButtons}>
            <TouchableOpacity onPress={() => { setVisible(false); setText(''); }}>
              <Text style={fabStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[fabStyles.addBtn, !text.trim() && fabStyles.addBtnDisabled]}
              onPress={submit}
              disabled={!text.trim()}>
              <Text style={fabStyles.addBtnText}>Add to Inbox</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <TouchableOpacity style={fabStyles.fab} onPress={() => setVisible(true)} activeOpacity={0.85}>
      <Text style={fabStyles.fabText}>+</Text>
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: {
    ...typography.headline,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sheetButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  cancelText: {...typography.callout, color: colors.textMuted},
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addBtnDisabled: {backgroundColor: colors.surfaceElevated},
  addBtnText: {...typography.callout, color: colors.text, fontWeight: '600'},
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: colors.text,
    lineHeight: 32,
    fontWeight: '300',
  },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <View style={{flex: 1}}>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: colors.surface,
            width: 280,
          },
          overlayColor: 'rgba(0,0,0,0.6)',
          swipeEdgeWidth: 40,
        }}>
        <Drawer.Screen name="InboxStack" component={InboxNavigator} />
        <Drawer.Screen
          name="NextActions"
          component={NextActionsScreen}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: colors.background},
            headerTintColor: colors.text,
            headerTitleStyle: typography.headline,
            headerShadowVisible: false,
            title: 'Next Actions',
          }}
        />
        <Drawer.Screen name="ProjectsStack" component={ProjectsNavigator} />
        <Drawer.Screen
          name="Someday"
          component={SomedayScreen}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: colors.background},
            headerTintColor: colors.text,
            headerTitleStyle: typography.headline,
            headerShadowVisible: false,
            title: 'Someday / Maybe',
          }}
        />
        <Drawer.Screen
          name="WaitingFor"
          component={WaitingForScreen}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: colors.background},
            headerTintColor: colors.text,
            headerTitleStyle: typography.headline,
            headerShadowVisible: false,
            title: 'Waiting For',
          }}
        />
        <Drawer.Screen
          name="Reference"
          component={ReferenceScreen}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: colors.background},
            headerTintColor: colors.text,
            headerTitleStyle: typography.headline,
            headerShadowVisible: false,
            title: 'Reference',
          }}
        />
        <Drawer.Screen
          name="WeeklyReview"
          component={WeeklyReviewScreen}
          options={{
            headerShown: true,
            headerStyle: {backgroundColor: colors.background},
            headerTintColor: colors.text,
            headerTitleStyle: typography.headline,
            headerShadowVisible: false,
            title: 'Weekly Review',
          }}
        />
      </Drawer.Navigator>
      <FAB />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  menuBtnText: {
    fontSize: 22,
    color: colors.text,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  drawerContent: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  drawerTitle: {
    ...typography.largeTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  drawerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  drawerItemActive: {
    backgroundColor: colors.primaryMuted,
  },
  drawerItemIcon: {
    fontSize: 18,
    color: colors.textMuted,
    width: 24,
    textAlign: 'center',
  },
  drawerItemIconActive: {
    color: colors.primary,
  },
  drawerItemLabel: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  drawerItemLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeDanger: {
    backgroundColor: colors.danger,
  },
  badgeText: {
    ...typography.micro,
    color: colors.text,
    fontWeight: '700',
  },
  exportBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  exportBtnText: {
    ...typography.callout,
    color: colors.textMuted,
  },
});
