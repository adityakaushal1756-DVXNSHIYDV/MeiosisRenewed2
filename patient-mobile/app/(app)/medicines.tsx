import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, ActionButton } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';
import { differenceInDays, addDays, parseISO, startOfDay } from 'date-fns';
import type { PrescriptionItem, Prescription } from '../../lib/types';

// Helper to parse duration string (e.g. "7 days") to number of days
function parseDurationToDays(str: string | null | undefined): number | null {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  if (!s) return null;
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)?\.?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'd').charAt(0);
  let days: number;
  switch (unit) {
    case 'd': days = Math.round(value); break;
    case 'w': days = Math.round(value * 7); break;
    case 'm': days = Math.round(value * 30); break;
    case 'y': days = Math.round(value * 365); break;
    default: days = Math.round(value);
  }
  return days > 0 ? days : null;
}

function isItemActive(item: PrescriptionItem, prescription: Prescription, today: Date): boolean {
  if (typeof item.isActive === 'boolean') return item.isActive;
  const itemDays = item.durationDays ?? parseDurationToDays(item.timing) ?? prescription.durationDays ?? 30;
  const start = parseISO(prescription.startDate);
  const expiry = addDays(start, itemDays);
  return today <= expiry;
}

interface ActiveMedItem extends PrescriptionItem {
  doctorName: string | undefined;
  totalDays: number;
  daysLeft: number;
  progress: number;
  dayNumber: number;
  cycleEnd: Date;
}

export default function MedicinesScreen() {
  const { profile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.neon} size="large" />
      </View>
    );
  }

  const today = startOfDay(new Date());
  const allActiveItems: ActiveMedItem[] = [];

  (profile.prescriptions || []).forEach(p => {
    if (p.status !== 'ACTIVE') return;

    (p.items || []).forEach(item => {
      if (isItemActive(item, p, today)) {
        const itemDays = item.durationDays ?? parseDurationToDays(item.timing) ?? p.durationDays ?? 30;
        const start = parseISO(p.startDate);
        const cycleEnd = addDays(start, itemDays);
        const daysPassed = Math.max(0, differenceInDays(today, start));
        const daysLeft = Math.max(0, itemDays - daysPassed);
        const progress = Math.min(100, (daysPassed / itemDays) * 100);

        allActiveItems.push({
          ...item,
          doctorName: p.doctor?.name,
          totalDays: itemDays,
          daysLeft,
          progress,
          dayNumber: daysPassed + 1,
          cycleEnd,
        });
      }
    });
  });

  // Set initial selected medicine if available
  useEffect(() => {
    if (allActiveItems.length > 0 && !selectedMedicine) {
      setSelectedMedicine(allActiveItems[0].medicine);
    }
  }, [allActiveItems, selectedMedicine]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <Text style={styles.subtitle}>Real-time treatment tracker & adherence assistant.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neon} />}
      >
        <GlassCard style={styles.trackerCard} neonBorder>
          <View style={styles.trackerHeader}>
            <Text style={styles.trackerTitle}>Dose Checklist</Text>
            <Text style={styles.trackerSubtitle}>Track your daily protocol for {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              <Text style={{ color: Colors.neon }}>0</Text>/{allActiveItems.length} completed
            </Text>
            <View style={styles.goalBox}>
               <Text style={styles.goalLabel}>Daily Goal</Text>
               <Text style={styles.goalValue}>0%</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>

          {allActiveItems.length > 0 ? (
            <View style={styles.upcomingFocus}>
              <Text style={styles.focusLabel}>Upcoming Focus</Text>
              <View style={styles.focusRow}>
                <Text style={styles.focusMedicine}>{allActiveItems[0].medicine}</Text>
                <View style={styles.timingBadge}>
                  <Text style={styles.timingText}>{allActiveItems[0].timing}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyTracker}>
               <Text style={styles.emptyTrackerText}>All treatment cycles completed.</Text>
            </View>
          )}
        </GlassCard>

        <Text style={styles.sectionTitle}>Treatment Progress</Text>
        
        <View style={styles.medList}>
          {allActiveItems.length > 0 ? (
            allActiveItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.medItem,
                  selectedMedicine === item.medicine && styles.medItemActive
                ]}
                onPress={() => setSelectedMedicine(item.medicine)}
                activeOpacity={0.8}
              >
                <View style={styles.medItemLeft}>
                  <View style={[
                    styles.medIcon,
                    selectedMedicine === item.medicine && styles.medIconActive
                  ]}>
                    <Feather name="disc" size={20} color={selectedMedicine === item.medicine ? Colors.ink : Colors.mist} />
                  </View>
                  <View>
                    <Text style={[styles.medName, selectedMedicine === item.medicine && { color: Colors.neon }]}>{item.medicine}</Text>
                    <View style={styles.timeLeftRow}>
                      <Feather name="clock" size={10} color={item.daysLeft <= 2 ? Colors.rose : Colors.mist} />
                      <Text style={[styles.timeLeftText, item.daysLeft <= 2 && { color: Colors.rose }]}>
                        {item.daysLeft} Days Remaining
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.medItemRight}>
                  <Text style={styles.dayNumText}>Day {item.dayNumber}/{item.totalDays}</Text>
                  <View style={styles.miniProgressBar}>
                    <View style={[styles.miniProgressFill, { width: `${item.progress}%` }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No cycles in progress.</Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Today's Schedule</Text>
        
        <GlassCard style={styles.scheduleCard}>
          {allActiveItems.length > 0 ? (
            allActiveItems.map((item, idx) => (
              <View key={idx} style={[styles.scheduleItem, idx < allActiveItems.length - 1 && styles.scheduleBorder]}>
                <View style={styles.scheduleHeader}>
                  <View>
                    <Text style={styles.scheduleMedName}>{item.medicine}</Text>
                    <Text style={styles.scheduleDose}>{item.dose} • {item.timing}</Text>
                  </View>
                  <Text style={styles.scheduleFreq}>{item.frequency.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.scheduleFooter}>
                  <Text style={styles.scheduleEnds}>
                    <Feather name="clock" size={10} /> Cycle Ends: {item.cycleEnd.toLocaleDateString()}
                  </Text>
                  <Text style={styles.scheduleActive}>Active Track</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptySchedule}>
              <Feather name="disc" size={32} color={Colors.mist} style={{ opacity: 0.5, marginBottom: Spacing.sm }} />
              <Text style={styles.emptyText}>Clinical regimen complete or not yet started.</Text>
            </View>
          )}
        </GlassCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ink },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  title: { fontSize: 28, ...Fonts.black, color: Colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.mist, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  trackerCard: { padding: Spacing.lg },
  trackerHeader: { marginBottom: Spacing.lg },
  trackerTitle: { fontSize: 20, ...Fonts.bold, color: Colors.white, marginBottom: 4 },
  trackerSubtitle: { fontSize: 13, color: Colors.mist },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm },
  progressText: { fontSize: 18, ...Fonts.bold, color: Colors.white },
  goalBox: { alignItems: 'flex-end' },
  goalLabel: { fontSize: 10, color: Colors.mist, ...Fonts.bold, textTransform: 'uppercase', marginBottom: 2 },
  goalValue: { backgroundColor: Colors.glass, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, color: Colors.mist, ...Fonts.bold, overflow: 'hidden' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.pill, marginBottom: Spacing.xl, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.neon, borderRadius: Radius.pill },
  upcomingFocus: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, borderLeftColor: Colors.sky, borderRadius: Radius.md, padding: Spacing.md },
  focusLabel: { fontSize: 10, color: Colors.mist, ...Fonts.bold, textTransform: 'uppercase', tracking: 1, marginBottom: 8 },
  focusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  focusMedicine: { fontSize: 14, ...Fonts.bold, color: Colors.white },
  timingBadge: { backgroundColor: 'rgba(131,212,255,0.1)', borderWidth: 1, borderColor: 'rgba(131,212,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  timingText: { fontSize: 10, color: Colors.sky, ...Fonts.bold },
  emptyTracker: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md },
  emptyTrackerText: { fontSize: 13, color: Colors.mist, ...Fonts.medium },
  sectionTitle: { fontSize: 18, ...Fonts.bold, color: Colors.white },
  medList: { gap: Spacing.sm },
  medItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  medItemActive: { backgroundColor: 'rgba(82,255,157,0.1)', borderColor: 'rgba(82,255,157,0.4)' },
  medItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  medIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  medIconActive: { backgroundColor: Colors.neon, borderColor: Colors.neon },
  medName: { fontSize: 14, ...Fonts.bold, color: Colors.white },
  timeLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeLeftText: { fontSize: 10, ...Fonts.bold, color: Colors.mist, textTransform: 'uppercase' },
  medItemRight: { alignItems: 'flex-end' },
  dayNumText: { fontSize: 10, ...Fonts.bold, color: Colors.mist, textTransform: 'uppercase', marginBottom: 4 },
  miniProgressBar: { width: 60, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.pill, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: Colors.sky, borderRadius: Radius.pill },
  scheduleCard: { padding: Spacing.md },
  scheduleItem: { paddingVertical: Spacing.md },
  scheduleBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  scheduleMedName: { fontSize: 16, ...Fonts.bold, color: Colors.white },
  scheduleDose: { fontSize: 12, color: Colors.mist, marginTop: 2 },
  scheduleFreq: { fontSize: 10, ...Fonts.bold, color: Colors.mist, textTransform: 'uppercase' },
  scheduleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  scheduleEnds: { fontSize: 10, color: Colors.mist },
  scheduleActive: { fontSize: 10, ...Fonts.bold, color: Colors.sky, textTransform: 'uppercase' },
  emptySchedule: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.mist, textAlign: 'center' },
});
