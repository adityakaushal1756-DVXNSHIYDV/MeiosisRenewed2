import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, ActionButton, EmptyState } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';
import { apiUrl, getAuthHeader } from '../../lib/api';
import type { Doctor } from '../../lib/types';
import type { Appointment } from '../../lib/types';

type FilterType = 'upcoming' | 'past' | 'cancelled';

export default function AppointmentsScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [careTeamIds, setCareTeamIds] = useState<Set<string>>(new Set());

  const fetchDoctors = async () => {
    if (!session?.patientId || !session?.token) return;
    setLoadingDoctors(true);
    try {
      // Fetch care team doctors first to get their IDs
      const careTeamUrl = apiUrl(`/network/doctors/${session.patientId}`);
      const careTeamRes = await fetch(careTeamUrl, { headers: getAuthHeader(session.token) });
      const careTeam = careTeamRes.ok ? await careTeamRes.json() : [];
      const cIds = new Set(Array.isArray(careTeam) ? careTeam.map((d: any) => d.id) : []);
      setCareTeamIds(cIds);

      // Fetch all doctors
      const searchUrl = apiUrl(`/network/search?q=&patientId=${session.patientId}`);
      const searchRes = await fetch(searchUrl, { headers: getAuthHeader(session.token) });
      const allDoctors = searchRes.ok ? await searchRes.json() : [];

      if (Array.isArray(allDoctors)) {
        // Sort: Care team first
        const sorted = [...allDoctors].sort((a: any, b: any) => {
          const aIsCare = cIds.has(a.id) ? 1 : 0;
          const bIsCare = cIds.has(b.id) ? 1 : 0;
          return bIsCare - aIsCare;
        });
        setDoctors(sorted);
      } else {
        setDoctors([]);
      }
    } catch (e) {
      console.error('Failed to fetch doctors:', e);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  React.useEffect(() => {
    if (showDoctorModal) {
      fetchDoctors();
    }
  }, [showDoctorModal]);

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
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => setShowDoctorModal(true)}>
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
                <ActionButton label="Book New Appointment" onPress={() => setShowDoctorModal(true)} />
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
                  <View style={[styles.doctorText, { flexShrink: 1 }]}>
                    <Text style={styles.doctorName} numberOfLines={1}>{apt.doctor?.name || 'Unknown Doctor'}</Text>
                    <View style={styles.specialtyBadge}>
                      <Text style={styles.specialtyText} numberOfLines={1}>{apt.doctor?.specialty || 'General'}</Text>
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

      {/* Doctor Selection Modal */}
      <Modal
        visible={showDoctorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDoctorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Specialist</Text>
              <TouchableOpacity onPress={() => setShowDoctorModal(false)}>
                <Feather name="x" size={24} color={Colors.mist} />
              </TouchableOpacity>
            </View>

            {loadingDoctors ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={Colors.neon} size="large" />
                <Text style={styles.modalLoadingText}>Scanning Specialists...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {doctors.map((doctor) => (
                  <TouchableOpacity
                    key={doctor.id}
                    style={styles.doctorItem}
                    onPress={() => {
                      setShowDoctorModal(false);
                      alert(`Selected ${doctor.name}. Booking flow not fully implemented yet.`);
                    }}
                  >
                    <View style={styles.doctorItemHeader}>
                      <View style={styles.avatar}>
                        <Feather name="user" size={20} color={Colors.mist} />
                      </View>
                      <View style={styles.doctorItemText}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.doctorItemName}>{doctor.name}</Text>
                          {careTeamIds.has(doctor.id) && (
                            <View style={styles.careTeamBadge}>
                              <Feather name="heart" size={10} color={Colors.neon} />
                              <Text style={styles.careTeamText}>Care Team</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.doctorItemSub}>{doctor.specialty} • {doctor.hospital}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    flexWrap: 'wrap',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.ink,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    ...Fonts.bold,
    color: Colors.white,
  },
  modalLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  modalLoadingText: {
    color: Colors.mist,
    fontSize: 14,
    ...Fonts.medium,
  },
  modalList: {
    marginBottom: Spacing.xl,
  },
  doctorItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  doctorItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  doctorItemText: {
    flex: 1,
  },
  doctorItemName: {
    fontSize: 16,
    ...Fonts.bold,
    color: Colors.white,
  },
  doctorItemSub: {
    fontSize: 13,
    color: Colors.mist,
    marginTop: 2,
  },
  careTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(82,255,157,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(82,255,157,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  careTeamText: {
    color: Colors.neon,
    fontSize: 10,
    ...Fonts.bold,
    textTransform: 'uppercase',
  },
});
