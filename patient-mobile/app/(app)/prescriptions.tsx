import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, isAfter, parseISO, startOfDay, differenceInDays, format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, EmptyState, ActionButton, NeonBadge } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';
import type { Prescription } from '../../lib/types';

type Tab = 'overview' | 'archive';

export default function PrescriptionsScreen() {
  const { profile, profileLoading, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('overview');
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.ink, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.neon} />
      </View>
    );
  }

  const today = startOfDay(new Date());

  const activePrescriptions = (profile.prescriptions || []).filter((p) => {
    if (typeof p.isActive === 'boolean') return p.isActive;
    if (p.status !== 'ACTIVE') return false;
    return !isAfter(today, addDays(parseISO(p.startDate), p.durationDays));
  });

  const pastPrescriptions = (profile.prescriptions || []).filter((p) => {
    if (typeof p.isActive === 'boolean') return !p.isActive;
    if (p.status !== 'ACTIVE') return true;
    return isAfter(today, addDays(parseISO(p.startDate), p.durationDays));
  });

  const allSorted = [...(profile.prescriptions || [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const labs = profile.labReports || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prescriptions</Text>
          <Text style={styles.subtitle}>Digital treatment records & clinical documentation.</Text>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        {(['overview', 'archive'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.neon} />}
      >
        {tab === 'overview' ? (
          <>
            {/* Clinical Vault Banner */}
            <GlassCard neonBorder style={styles.vaultBanner}>
              <LinearGradient
                colors={['rgba(82,255,157,0.08)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.vaultContent}>
                <Text style={styles.vaultLabel}>Clinical Vault</Text>
                <Text style={styles.vaultTitle}>
                  {activePrescriptions.length} Active Treatment {activePrescriptions.length === 1 ? 'Track' : 'Tracks'}
                </Text>
                <Text style={styles.vaultSub}>
                  Securely managed on the Meiosis network.
                </Text>
                <View style={styles.vaultStats}>
                  <View style={styles.vaultStat}>
                    <Feather name="file-text" size={14} color={Colors.neon} />
                    <Text style={styles.vaultStatNum}>{profile.prescriptions.length}</Text>
                    <Text style={styles.vaultStatLabel}>Total Scripts</Text>
                  </View>
                  <View style={styles.vaultStat}>
                    <Feather name="activity" size={14} color={Colors.indigo} />
                    <Text style={[styles.vaultStatNum, { color: Colors.indigo }]}>{labs.length}</Text>
                    <Text style={styles.vaultStatLabel}>Lab Reports</Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Active Pipeline */}
            {allSorted.length > 0 && (
              <View>
                <View style={styles.sectionLabelRow}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.sectionLabel}>Care Pipeline</Text>
                </View>
                {allSorted.map((p) => {
                  const startDate = parseISO(p.startDate);
                  const expiryDate = addDays(startDate, p.durationDays);
                  const daysPassed = Math.max(0, differenceInDays(today, startDate));
                  const totalDays = p.durationDays || 1;
                  const progress = Math.min(100, (daysPassed / totalDays) * 100);
                  const daysLeft = Math.max(0, totalDays - daysPassed);
                  const isActive = typeof p.isActive === 'boolean'
                    ? p.isActive
                    : (p.status === 'ACTIVE' && !isAfter(today, expiryDate));

                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.rxCard, !isActive && styles.rxCardInactive]}
                      onPress={() => setSelected(p)}
                      activeOpacity={0.8}
                    >
                      {/* Progress bar at top */}
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: isActive ? Colors.neon : Colors.mist },
                          ]}
                        />
                      </View>

                      <View style={styles.rxCardBody}>
                        <View style={styles.rxCardTop}>
                          <View style={[styles.rxIcon, !isActive && styles.rxIconInactive]}>
                            <Feather name="file-text" size={18} color={isActive ? Colors.neon : Colors.mist} />
                          </View>
                          <View style={styles.rxCardRight}>
                            <Text style={styles.rxRemLabel}>{isActive ? 'Remaining' : 'Concluded'}</Text>
                            <Text style={[styles.rxRemVal, !isActive && { color: Colors.mist }]}>
                              {isActive ? `${daysLeft} Days` : '0 Days'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.rxName, !isActive && styles.rxNameInactive]}>{p.title}</Text>
                        <Text style={styles.rxDoctor}>{p.doctor?.name} · {p.doctor?.specialty}</Text>
                        <View style={[styles.viewRxBtn, !isActive && styles.viewRxBtnInactive]}>
                          <Text style={[styles.viewRxText, !isActive && styles.viewRxTextInactive]}>View Digital Rx</Text>
                          <Feather name="chevron-right" size={14} color={isActive ? Colors.white : Colors.mist} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Lab Reports */}
            {labs.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Lab Reports Archive</Text>
                {labs.map((l) => (
                  <View key={l.id} style={styles.labItem}>
                    <View style={styles.labIcon}>
                      <Feather name="activity" size={15} color={Colors.sky} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labTitle}>{l.title || l.testName}</Text>
                      <Text style={styles.labMeta}>
                        {l.labName} · {format(parseISO(l.reportDate), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                    <Feather name="download" size={14} color={Colors.sky} />
                  </View>
                ))}
              </View>
            )}

            {profile.prescriptions.length === 0 && (
              <EmptyState
                icon={<Feather name="file-text" size={28} color={Colors.mist} />}
                title="No Prescriptions Yet"
                subtitle="Prescriptions from your doctors will appear here."
              />
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Prescription Archive</Text>
            {pastPrescriptions.length === 0 ? (
              <EmptyState
                icon={<Feather name="archive" size={28} color={Colors.mist} />}
                title="No archived prescriptions"
                subtitle="Past concluded prescriptions will appear here."
              />
            ) : (
              pastPrescriptions.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.archiveItem}
                  onPress={() => setSelected(p)}
                  activeOpacity={0.8}
                >
                  <View style={styles.archiveIcon}>
                    <Feather name="file-text" size={15} color={Colors.mist} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.archiveTitle}>{p.title}</Text>
                    <Text style={styles.archiveMeta}>
                      Concluded · {format(parseISO(p.startDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <Text style={styles.reviewText}>Review</Text>
                </TouchableOpacity>
              ))
            )}

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Lab Reports</Text>
            {labs.length === 0 ? (
              <Text style={styles.emptyText}>No lab reports on file.</Text>
            ) : (
              labs.map((l) => (
                <View key={l.id} style={styles.labItem}>
                  <View style={styles.labIcon}>
                    <Feather name="activity" size={15} color={Colors.sky} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.labTitle}>{l.title || l.testName}</Text>
                    <Text style={styles.labMeta}>
                      {l.labName} · {format(parseISO(l.reportDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selected.title}</Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Feather name="x" size={22} color={Colors.mist} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalDoctor}>{selected.doctor?.name} · {selected.doctor?.specialty}</Text>
                {selected.doctorNote && (
                  <View style={styles.noteBox}>
                    <Feather name="alert-triangle" size={14} color={Colors.amber} />
                    <Text style={styles.noteText}>{selected.doctorNote}</Text>
                  </View>
                )}
                <Text style={styles.modalSectionLabel}>Medications</Text>
                {(selected.items || []).map((item, i) => (
                  <View key={i} style={styles.medItem}>
                    <View style={styles.medItemLeft}>
                      <Text style={styles.medName}>{item.medicine}</Text>
                      <Text style={styles.medDose}>{item.dose} · {item.timing}</Text>
                    </View>
                    <View style={styles.medBadge}>
                      <Text style={styles.medFreq}>{item.frequency.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.modalMeta}>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>Start Date</Text>
                    <Text style={styles.modalMetaVal}>{format(parseISO(selected.startDate), 'MMM dd, yyyy')}</Text>
                  </View>
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>Duration</Text>
                    <Text style={styles.modalMetaVal}>{selected.durationDays} Days</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const INDIGO = '#818CF8';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ink },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.mist, marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.pill, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.neon },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.mist, textTransform: 'uppercase', letterSpacing: 1 },
  tabTextActive: { color: Colors.ink },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100, gap: Spacing.md },
  vaultBanner: { overflow: 'hidden' },
  vaultContent: { padding: Spacing.xl },
  vaultLabel: { fontSize: 9, fontWeight: '700', color: Colors.neon, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  vaultTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  vaultSub: { fontSize: 12, color: Colors.mist, marginBottom: 16 },
  vaultStats: { flexDirection: 'row', gap: 12 },
  vaultStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  vaultStatNum: { fontSize: 18, fontWeight: '700', color: Colors.white },
  vaultStatLabel: { fontSize: 9, color: Colors.mist, textTransform: 'uppercase', fontWeight: '600' },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.neon },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1.2, marginVertical: 12 },
  rxCard: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(82,255,157,0.2)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  rxCardInactive: { borderColor: Colors.border, opacity: 0.7 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.05)' },
  progressFill: { height: 3 },
  rxCardBody: { padding: Spacing.lg },
  rxCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rxIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.neonDim,
    borderWidth: 1,
    borderColor: Colors.neonGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxIconInactive: { backgroundColor: Colors.glass, borderColor: Colors.border },
  rxCardRight: { alignItems: 'flex-end' },
  rxRemLabel: { fontSize: 9, color: Colors.mist, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rxRemVal: { fontSize: 18, fontWeight: '700', color: Colors.white },
  rxName: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  rxNameInactive: { color: Colors.mist },
  rxDoctor: { fontSize: 11, color: Colors.mist, marginBottom: 14 },
  viewRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewRxBtnInactive: { opacity: 0.5 },
  viewRxText: { fontSize: 11, fontWeight: '700', color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  viewRxTextInactive: { color: Colors.mist },
  labItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(131,212,255,0.04)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(131,212,255,0.1)',
    padding: 14,
    marginBottom: 8,
  },
  labIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(131,212,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  labTitle: { fontSize: 13, fontWeight: '700', color: Colors.sky },
  labMeta: { fontSize: 10, color: 'rgba(131,212,255,0.6)', marginTop: 2, fontWeight: '500', textTransform: 'uppercase' },
  archiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  archiveIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.glass, alignItems: 'center', justifyContent: 'center' },
  archiveTitle: { fontSize: 13, fontWeight: '700', color: Colors.mist },
  archiveMeta: { fontSize: 9, fontWeight: '600', color: 'rgba(139,164,184,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewText: { fontSize: 10, fontWeight: '700', color: Colors.mist, textTransform: 'uppercase' },
  emptyText: { color: Colors.mist, fontSize: 13, textAlign: 'center', padding: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4,12,24,0.85)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0A1828',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.wire, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, flex: 1 },
  modalDoctor: { fontSize: 12, color: Colors.mist, marginBottom: 14 },
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(251,184,36,0.08)', borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(251,184,36,0.2)', padding: 12, marginBottom: 16 },
  noteText: { flex: 1, fontSize: 12, color: Colors.mist, lineHeight: 18 },
  modalSectionLabel: { fontSize: 9, fontWeight: '700', color: Colors.mist, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  medItemLeft: {},
  medName: { fontSize: 14, fontWeight: '700', color: Colors.white },
  medDose: { fontSize: 11, color: Colors.mist, marginTop: 2 },
  medBadge: { backgroundColor: Colors.glass, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  medFreq: { fontSize: 9, fontWeight: '700', color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalMeta: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalMetaItem: { flex: 1, backgroundColor: Colors.glass, borderRadius: Radius.md, padding: 14 },
  modalMetaLabel: { fontSize: 10, color: Colors.mist, fontWeight: '500', marginBottom: 4 },
  modalMetaVal: { fontSize: 16, fontWeight: '700', color: Colors.white },
  indigo: INDIGO,
});
