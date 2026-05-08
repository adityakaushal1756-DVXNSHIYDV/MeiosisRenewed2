import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, ActionButton, EmptyState } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';
import type { Appointment } from '../../lib/types';

type FilterType = 'upcoming' | 'past' | 'cancelled';

export default function AppointmentsScreen() {
  const { profile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

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

  const now = new Date();

  const mappedAppointments = (profile.appointments || []).map((a) => {
    let computedStatus: FilterType = 'upcoming';
    if (a.status === 'CANCELLED') computedStatus = 'cancelled';
    else if (a.status === 'COMPLETED' || new Date(a.scheduledDate) < now) computedStatus = 'past';

    return {
      ...a,
      computedStatus,
    };
  });

  const filtered = mappedAppointments.filter((a) => a.computedStatus === filter);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Appointments</Text>
            <Text style={styles.subtitle}>Manage clinical visits & consultations.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
            <Feather name="plus" size={20} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {(['upcoming', 'past', 'cancelled'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neon} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Feather name="calendar" size={32} color={Colors.mist} />}
            title={`No ${filter} appointments`}
            subtitle={`You do not have any ${filter} appointments at this time.`}
            action={
              filter !== 'past' ? (
                <ActionButton label="Book New Appointment" />
              ) : undefined
            }
          />
        ) : (
          filtered.map((apt) => (
            <GlassCard key={apt.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                  <View style={styles.avatar}>
                    <Feather name="user" size={20} color={Colors.mist} />
                  </View>
                  <View style={styles.doctorText}>
                    <Text style={styles.doctorName}>{apt.doctor?.name || 'Unknown Doctor'}</Text>
                    <View style={styles.specialtyBadge}>
                      <Text style={styles.specialtyText}>{apt.doctor?.specialty || 'General'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusText,
                      apt.computedStatus === 'upcoming' && { color: Colors.sky },
                      apt.computedStatus === 'cancelled' && { color: Colors.rose },
                      apt.computedStatus === 'past' && { color: Colors.mist },
                    ]}
                  >
                    {apt.computedStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color={Colors.neon} />
                  <Text style={styles.detailText}>
                    {new Date(apt.scheduledDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.detailDivider}>|</Text>
                  <Feather name="clock" size={14} color={Colors.neon} />
                  <Text style={styles.detailText}>
                    {apt.slotStartTime
                      ? new Date(apt.slotStartTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Flexible'}
                  </Text>
                </View>
                <View style={[styles.detailRow, { marginTop: Spacing.sm }]}>
                  <Feather
                    name={apt.mode === 'IN_PERSON' ? 'map-pin' : 'video'}
                    size={14}
                    color={Colors.mist}
                  />
                  <Text style={styles.detailTextMuted}>
                    {apt.location || apt.doctor?.hospital || 'Virtual'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <ActionButton label="Details" variant="ghost" fullWidth style={{ flex: 1 }} />
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    ...Fonts.black,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mist,
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  filterBtnActive: {
    backgroundColor: Colors.neon,
  },
  filterText: {
    fontSize: 11,
    ...Fonts.bold,
    color: Colors.mist,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: Colors.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    ...Fonts.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  specialtyBadge: {
    backgroundColor: Colors.glass,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  specialtyText: {
    fontSize: 10,
    color: Colors.mist,
  },
  statusBadge: {
    backgroundColor: Colors.glass,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: 10,
    ...Fonts.bold,
    textTransform: 'uppercase',
  },
  detailsBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
    ...Fonts.medium,
    color: Colors.white,
  },
  detailDivider: {
    color: Colors.mist,
    marginHorizontal: Spacing.xs,
  },
  detailTextMuted: {
    fontSize: 13,
    color: Colors.mist,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
