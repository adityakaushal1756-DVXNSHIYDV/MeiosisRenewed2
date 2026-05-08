import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, ActionButton } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';
import { apiUrl, getAuthHeader } from '../../lib/api';
import type { Doctor } from '../../lib/types';

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

const SPECIALTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Cardiology:       { bg: 'rgba(244,63,94,0.1)', text: '#FDA4AF', border: 'rgba(244,63,94,0.2)' },
  Neurology:        { bg: 'rgba(139,92,246,0.1)', text: '#C4B5FD', border: 'rgba(139,92,246,0.2)' },
  Endocrinology:    { bg: 'rgba(6,182,212,0.1)', text: '#67E8F9', border: 'rgba(6,182,212,0.2)' },
  'Primary Care':   { bg: 'rgba(16,185,129,0.1)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  'General Medicine': { bg: 'rgba(16,185,129,0.1)', text: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
  Dermatology:      { bg: 'rgba(236,72,153,0.1)', text: '#F9A8D4', border: 'rgba(236,72,153,0.2)' },
  Orthopedics:      { bg: 'rgba(245,158,11,0.1)', text: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
  Pediatrics:       { bg: 'rgba(249,115,22,0.1)', text: '#FDBA74', border: 'rgba(249,115,22,0.2)' },
};

function getSpecialtyColor(specialty: string) {
  return SPECIALTY_COLORS[specialty] || { bg: Colors.skyDim, text: Colors.sky, border: 'rgba(131,212,255,0.2)' };
}

export default function NetworkScreen() {
  const { session, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchDoctors = useCallback(async () => {
    if (!session?.patientId || !session?.token) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/network/doctors/${session.patientId}`), {
        headers: getAuthHeader(session.token),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [session?.patientId, session?.token]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const searchDoctors = async (query: string) => {
    if (!session?.patientId || !session?.token) return;
    setSearchLoading(true);
    try {
      const url = apiUrl(`/network/search?q=${encodeURIComponent(query)}&patientId=${session.patientId}`);
      const res = await fetch(url, { headers: getAuthHeader(session.token) });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (showAddPopup) {
      const timeout = setTimeout(() => searchDoctors(searchQuery), 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery, showAddPopup]);

  const handleRemove = async (doctorId: string) => {
    if (!session?.patientId || !session?.token) return;
    try {
      await fetch(apiUrl(`/network/unlink`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader(session.token) },
        body: JSON.stringify({ patientId: session.patientId, doctorId }),
      });
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
    } catch (e) {
      // ignore
    }
  };

  const handleLink = async (doc: Doctor) => {
    if (!session?.patientId || !session?.token) return;
    try {
      await fetch(apiUrl(`/network/link`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader(session.token) },
        body: JSON.stringify({ patientId: session.patientId, doctorId: doc.id }),
      });
      setSearchResults(prev => prev.map(d => d.id === doc.id ? { ...d, isLinked: true } : d));
      setDoctors(prev => [{ ...doc, isLinked: true }, ...prev]);
    } catch (e) {
      // ignore
    }
  };

  const uniqueSpecialties = [...new Set(doctors.map(d => d.specialty))].length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Network</Text>
        <Text style={styles.subtitle}>Connected care team and referral control</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statVal}>{loading ? '-' : doctors.length}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statVal}>{loading ? '-' : uniqueSpecialties}</Text>
            <Text style={styles.statLabel}>Specialties</Text>
          </GlassCard>
          <GlassCard style={[styles.statCard, styles.secondOpinionCard]} neonBorder>
            <Feather name="shield" size={24} color={Colors.neon} style={{ marginBottom: 8 }} />
            <Text style={[styles.statLabel, { color: Colors.white, ...Fonts.bold }]}>Second Opinion</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.listCard}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>Your Doctors</Text>
              <Text style={styles.listSubtitle}>Manage your care team.</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddPopup(true)}>
              <Feather name="user-plus" size={16} color={Colors.ink} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.neon} style={{ padding: Spacing.xl }} />
          ) : doctors.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="users" size={32} color={Colors.sky} />
              </View>
              <Text style={styles.emptyTitle}>No doctors yet</Text>
              <Text style={styles.emptyText}>Add your first doctor to build your care team.</Text>
            </View>
          ) : (
            <View style={styles.doctorsList}>
              {doctors.map(doc => {
                const colors = getSpecialtyColor(doc.specialty);
                return (
                  <View key={doc.id} style={styles.docItem}>
                    <View style={styles.docItemTop}>
                      <View style={[styles.docAvatar, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                        <Text style={[styles.docAvatarText, { color: colors.text }]}>{initials(doc.name)}</Text>
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docName}>{doc.name}</Text>
                        <Text style={[styles.docSpecialty, { color: colors.text }]}>{doc.specialty}</Text>
                      </View>
                      <View style={styles.ratingBadge}>
                        <Feather name="star" size={10} color={Colors.amber} />
                        <Text style={styles.ratingText}>{doc.rating?.toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.docDetails}>
                       {(doc.clinicName || doc.hospital) && (
                         <View style={styles.detailItem}>
                           <Feather name="briefcase" size={12} color={Colors.mist} />
                           <Text style={styles.detailText}>{doc.clinicName || doc.hospital}</Text>
                         </View>
                       )}
                       {doc.consultFee && (
                         <View style={styles.detailItem}>
                           <Feather name="dollar-sign" size={12} color={Colors.mist} />
                           <Text style={styles.detailText}>₹{doc.consultFee}</Text>
                         </View>
                       )}
                    </View>
                    <View style={styles.docActions}>
                       <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(doc.id)}>
                         <Feather name="user-minus" size={12} color={Colors.rose} />
                         <Text style={styles.removeBtnText}>Remove</Text>
                       </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>
      </ScrollView>

      {/* Add Doctor Modal */}
      <Modal visible={showAddPopup} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top }]}>
             <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Add a Doctor</Text>
                  <Text style={styles.modalSubtitle}>Search the network</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddPopup(false)} style={styles.closeBtn}>
                   <Feather name="x" size={20} color={Colors.mist} />
                </TouchableOpacity>
             </View>

             <View style={styles.searchBox}>
                <Feather name="search" size={16} color={Colors.mist} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search doctor..."
                  placeholderTextColor={Colors.mist}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
             </View>

             <ScrollView style={styles.searchResults}>
                {searchLoading ? (
                  <ActivityIndicator color={Colors.neon} style={{ padding: Spacing.xl }} />
                ) : searchResults.length === 0 ? (
                  <Text style={styles.emptySearchText}>No doctors found.</Text>
                ) : (
                  searchResults.map(doc => {
                    const colors = getSpecialtyColor(doc.specialty);
                    return (
                      <View key={doc.id} style={[styles.searchItem, doc.isLinked && styles.searchItemLinked]}>
                         <View style={[styles.docAvatar, { backgroundColor: colors.bg, borderColor: colors.border, width: 40, height: 40, borderRadius: Radius.sm }]}>
                           <Text style={[styles.docAvatarText, { color: colors.text, fontSize: 14 }]}>{initials(doc.name)}</Text>
                         </View>
                         <View style={styles.searchDocInfo}>
                            <Text style={styles.docName}>{doc.name}</Text>
                            <Text style={[styles.docSpecialty, { color: colors.text }]}>{doc.specialty}</Text>
                         </View>
                         <TouchableOpacity 
                           style={[styles.linkBtn, doc.isLinked && styles.linkBtnActive]}
                           disabled={doc.isLinked}
                           onPress={() => handleLink(doc)}
                         >
                           <Feather name={doc.isLinked ? "check" : "user-plus"} size={14} color={doc.isLinked ? Colors.neon : Colors.sky} />
                           <Text style={[styles.linkBtnText, doc.isLinked && { color: Colors.neon }]}>{doc.isLinked ? 'Added' : 'Add'}</Text>
                         </TouchableOpacity>
                      </View>
                    );
                  })
                )}
             </ScrollView>
          </View>
        </View>
      </Modal>
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
  statsGrid: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '30%', padding: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  secondOpinionCard: { backgroundColor: 'rgba(82,255,157,0.05)' },
  statVal: { fontSize: 24, ...Fonts.bold, color: Colors.white, marginBottom: 4 },
  statLabel: { fontSize: 11, ...Fonts.medium, color: Colors.mist },
  listCard: { padding: Spacing.lg },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  listTitle: { fontSize: 18, ...Fonts.bold, color: Colors.white },
  listSubtitle: { fontSize: 12, color: Colors.mist },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.neon, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
  addBtnText: { fontSize: 12, ...Fonts.bold, color: Colors.ink },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.skyDim, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyTitle: { fontSize: 16, ...Fonts.bold, color: Colors.white, marginBottom: 4 },
  emptyText: { fontSize: 12, color: Colors.mist, textAlign: 'center' },
  doctorsList: { gap: Spacing.md },
  docItem: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md },
  docItemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  docAvatar: { width: 48, height: 48, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  docAvatarText: { fontSize: 16, ...Fonts.bold },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, ...Fonts.bold, color: Colors.white, marginBottom: 2 },
  docSpecialty: { fontSize: 12, ...Fonts.medium },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, ...Fonts.bold, color: Colors.amber },
  docDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: Colors.mist },
  docActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(244,63,94,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  removeBtnText: { fontSize: 11, ...Fonts.bold, color: Colors.rose },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(4,12,24,0.9)' },
  modalContent: { flex: 1, backgroundColor: Colors.ink },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, ...Fonts.bold, color: Colors.white },
  modalSubtitle: { fontSize: 12, color: Colors.mist },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.glass, alignItems: 'center', justifyContent: 'center' },
  searchBox: { margin: Spacing.xl, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, height: 48, color: Colors.white, fontSize: 15 },
  searchResults: { flex: 1, paddingHorizontal: Spacing.xl },
  emptySearchText: { textAlign: 'center', color: Colors.mist, marginTop: Spacing.xl },
  searchItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, marginBottom: Spacing.sm },
  searchItemLinked: { backgroundColor: 'rgba(82,255,157,0.05)', borderColor: 'rgba(82,255,157,0.2)' },
  searchDocInfo: { flex: 1, marginLeft: Spacing.md },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.skyDim, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
  linkBtnActive: { backgroundColor: 'transparent' },
  linkBtnText: { fontSize: 12, ...Fonts.bold, color: Colors.sky },
});
