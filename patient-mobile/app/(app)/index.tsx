import React from 'react';
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
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, isAfter, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, StatCard, ActionButton, EmptyState } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const { profile, profileLoading, profileError, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  if (profileLoading && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.ink, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.neon} size="large" />
        <Text style={{ color: Colors.mist, marginTop: 12, fontSize: 13 }}>Syncing patient identity...</Text>
      </View>
    );
  }

  if (profileError || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.ink, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: Colors.rose, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Sync Failed</Text>
        <Text style={{ color: Colors.mist, textAlign: 'center', marginBottom: 20 }}>{profileError}</Text>
        <ActionButton label="Retry" onPress={refreshProfile} />
      </View>
    );
  }

  const now = new Date();
  const today = startOfDay(now);

  const upcomingAppointments = profile.appointments.filter(
    (a) => new Date(a.scheduledDate) > now && a.status !== 'CANCELLED'
  );

  const activePrescriptions = profile.prescriptions.filter((p) => {
    if (typeof p.isActive === 'boolean') return p.isActive;
    if (p.status !== 'ACTIVE') return false;
    const expiry = addDays(parseISO(p.startDate), p.durationDays);
    return !isAfter(today, expiry);
  });

  const newReports = profile.labReports.filter(
    (l) => new Date(l.reportDate) > new Date(now.getTime() - 7 * 86400000)
  ).length;

  const nextAppointment = upcomingAppointments[0] ?? null;
  const latestPrescription = activePrescriptions[0] ?? null;

  const statsData = [
    { label: 'Upcoming', val: upcomingAppointments.length, color: Colors.sky, route: 'appointments' },
    { label: 'Active Rx', val: activePrescriptions.length, color: Colors.neon, route: 'prescriptions' },
    { label: 'New Reports', val: newReports, color: Colors.amber, route: 'prescriptions' },
    { label: 'Total Visits', val: profile.appointments.length, color: Colors.purple, route: 'appointments' },
  ];

  const quickActions = [
    { label: 'My QR Code', icon: 'grid' as const, color: Colors.neon, route: 'myqr' },
    { label: 'Prescriptions', icon: 'file-text' as const, color: Colors.sky, route: 'prescriptions' },
    { label: 'Book Appointment', icon: 'calendar' as const, color: Colors.purple, route: 'appointments' },
    { label: 'Doctor Network', icon: 'users' as const, color: Colors.amber, route: 'network' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.neon}
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#071828', Colors.ink]}
        style={[styles.headerBg, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{profile.name.split(' ')[0]}</Text>
            <Text style={styles.tagline}>Your Health. Fully In Your Control.</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/myqr')} style={styles.qrBtn}>
            <Feather name="grid" size={22} color={Colors.neon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsData.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.statCard}
              onPress={() => router.push(`/(app)/${s.route}` as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.statAccent, { backgroundColor: s.color }]} />
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Appointment */}
        <GlassCard style={styles.section} onPress={() => router.push('/(app)/appointments' as any)}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionTitleRow}>
              <Feather name="calendar" size={16} color={Colors.neon} />
              <Text style={styles.sectionTitle}>Next Appointment</Text>
            </View>
            {nextAppointment ? (
              <View>
                <Text style={styles.aptDoctor}>{nextAppointment.doctor?.name || 'Doctor'}</Text>
                <Text style={styles.aptDate}>
                  {new Date(nextAppointment.scheduledDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                  {nextAppointment.slotStartTime
                    ? ` · ${new Date(nextAppointment.slotStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                </Text>
                <Text style={styles.aptSub}>
                  {nextAppointment.mode === 'IN_PERSON' ? 'In-person' : 'Teleconsult'} · {nextAppointment.doctor?.hospital || 'Clinic'}
                </Text>
                <View style={styles.row}>
                  <ActionButton label="View Details" onPress={() => router.push('/(app)/appointments' as any)} />
                </View>
              </View>
            ) : (
              <EmptyState
                icon={<Feather name="calendar" size={24} color={Colors.mist} />}
                title="No Upcoming Appointments"
                subtitle="Your schedule is clear."
                action={<ActionButton label="Book Appointment" onPress={() => router.push('/(app)/appointments' as any)} />}
              />
            )}
          </View>
        </GlassCard>

        {/* Latest Prescription */}
        <GlassCard style={styles.section} onPress={() => router.push('/(app)/prescriptions' as any)}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionTitleRow}>
              <Feather name="file-text" size={16} color={Colors.sky} />
              <Text style={styles.sectionTitle}>Latest Prescription</Text>
              {latestPrescription && (
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>

            {latestPrescription ? (
              <View>
                <Text style={styles.rxTitle}>{latestPrescription.title}</Text>
                <Text style={styles.rxSub}>
                  {latestPrescription.doctor?.name} · {latestPrescription.doctor?.specialty}
                </Text>
                {latestPrescription.items && latestPrescription.items.length > 0 && (
                  <View style={styles.pillRow}>
                    {latestPrescription.items.slice(0, 3).map((item, i) => (
                      <View key={i} style={styles.pill}>
                        <Text style={styles.pillText}>{item.medicine} {item.dose}</Text>
                      </View>
                    ))}
                    {latestPrescription.items.length > 3 && (
                      <View style={[styles.pill, styles.pillMuted]}>
                        <Text style={[styles.pillText, { color: Colors.mist }]}>
                          +{latestPrescription.items.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={styles.rxMeta}>
                  <View style={styles.rxMetaItem}>
                    <Text style={styles.rxMetaLabel}>Days Left</Text>
                    <Text style={styles.rxMetaVal}>
                      {Math.max(0, latestPrescription.durationDays - differenceInDays(today, parseISO(latestPrescription.startDate)))}
                    </Text>
                  </View>
                  <View style={styles.rxMetaItem}>
                    <Text style={styles.rxMetaLabel}>Issued</Text>
                    <Text style={styles.rxMetaVal}>
                      {new Date(latestPrescription.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <EmptyState
                icon={<Feather name="file-text" size={24} color={Colors.mist} />}
                title="No Active Tracks"
                subtitle="Treatment plan concluded."
                action={<ActionButton label="View History" variant="ghost" onPress={() => router.push('/(app)/prescriptions' as any)} />}
              />
            )}
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionInner}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickCard}
                  onPress={() => router.push(`/(app)/${a.route}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.quickIcon, { backgroundColor: a.color + '20' }]}>
                    <Feather name={a.icon} size={20} color={a.color} />
                  </View>
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ink },
  headerBg: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 13, color: Colors.mist, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: 30, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  tagline: { fontSize: 12, color: Colors.mist, marginTop: 4 },
  qrBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.neonGlow,
    backgroundColor: Colors.neonDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.panel,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  statAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  statLabel: { fontSize: 10, color: Colors.mist, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4, marginBottom: 6 },
  statVal: { fontSize: 34, fontWeight: '700' },
  section: {},
  sectionInner: { padding: Spacing.xl },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, flex: 1 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.neonDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.neonGlow },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.neon },
  activeBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.neon, textTransform: 'uppercase', letterSpacing: 0.5 },
  aptDoctor: { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  aptDate: { fontSize: 14, color: Colors.neon, fontWeight: '600', marginBottom: 4 },
  aptSub: { fontSize: 12, color: Colors.mist, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  rxTitle: { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  rxSub: { fontSize: 12, color: Colors.mist, marginBottom: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillMuted: { backgroundColor: 'rgba(255,255,255,0.03)' },
  pillText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  rxMeta: { flexDirection: 'row', gap: 12 },
  rxMetaItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  rxMetaLabel: { fontSize: 10, color: Colors.mist, fontWeight: '500', marginBottom: 4 },
  rxMetaVal: { fontSize: 16, fontWeight: '700', color: Colors.white },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  quickCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '600', color: Colors.white, textAlign: 'center' },
});
