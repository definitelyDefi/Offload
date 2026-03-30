import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {colors, spacing, radius, typography} from '../theme';

interface DatePickerProps {
  value: Date | null;
  onChange: (d: Date | null) => void;
  setLabel?: string;
  defaultOffsetDays?: number;
}

function SpinCol({label, onUp, onDown}: {label: string; onUp: () => void; onDown: () => void}) {
  return (
    <View style={styles.col}>
      <TouchableOpacity onPress={onUp} hitSlop={{top: 8, bottom: 4, left: 12, right: 12}}>
        <Text style={styles.arrow}>▲</Text>
      </TouchableOpacity>
      <Text style={styles.colValue}>{label}</Text>
      <TouchableOpacity onPress={onDown} hitSlop={{top: 4, bottom: 8, left: 12, right: 12}}>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DatePicker({
  value,
  onChange,
  setLabel = '+ Set date',
  defaultOffsetDays = 7,
}: DatePickerProps) {
  const today = new Date();
  const d = value ?? new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const adjust = (field: 'month' | 'day' | 'year', delta: number) => {
    const next = new Date(d);
    if (field === 'month') next.setMonth(next.getMonth() + delta);
    if (field === 'day') next.setDate(next.getDate() + delta);
    if (field === 'year') next.setFullYear(next.getFullYear() + delta);
    onChange(next);
  };

  if (!value) {
    return (
      <TouchableOpacity
        style={styles.setBtn}
        onPress={() => {
          const def = new Date(today.getFullYear(), today.getMonth(), today.getDate() + defaultOffsetDays);
          onChange(def);
        }}>
        <Text style={styles.setBtnText}>{setLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        <SpinCol label={MONTHS[d.getMonth()]} onUp={() => adjust('month', 1)} onDown={() => adjust('month', -1)} />
        <SpinCol label={String(d.getDate())} onUp={() => adjust('day', 1)} onDown={() => adjust('day', -1)} />
        <SpinCol label={String(d.getFullYear())} onUp={() => adjust('year', 1)} onDown={() => adjust('year', -1)} />
      </View>
      <TouchableOpacity onPress={() => onChange(null)}>
        <Text style={styles.clear}>Clear date</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {gap: spacing.sm},
  columns: {flexDirection: 'row', justifyContent: 'center', gap: spacing.lg},
  col: {alignItems: 'center', gap: spacing.xs, minWidth: 56},
  colValue: {...typography.headline, color: colors.text, textAlign: 'center'},
  arrow: {fontSize: 12, color: colors.textMuted},
  setBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  setBtnText: {...typography.caption, color: colors.textMuted},
  clear: {...typography.caption, color: colors.danger, textAlign: 'center', paddingTop: spacing.xs},
});
