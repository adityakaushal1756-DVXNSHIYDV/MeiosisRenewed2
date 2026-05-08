import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';

export default function SettingsScreen() {
  const { profile, session, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const renderField = (label: string, value: string | undefined, isCode = false) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isCode ? (
        <View style={styles.codeWrapper}>
          <Text style={styles.codeText}>{value || 'Not Assigned'}</Text>
        </View>
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage profile, security, and preferences.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <GlassCard style={styles.sectionCard}>
           <View style={styles.sectionHeader}>
              <Feather name="user" size={18} color={Colors.sky} />
              <Text style={styles.sectionTitle}>Account Profile</Text>
           </View>
           
           <View style={styles.fieldsContainer}>
              {renderField('Name', profile?.name || session?.name)}
              {renderField('Email', profile?.email || session?.email)}
              {renderField('Phone', profile?.phone)}
              {renderField('MEIOSIS Code', profile?.meiosisId, true)}
           </View>

           <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn}>
                 <Text style={styles.actionBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                 <Feather name="key" size={14} color={Colors.white} style={{ marginRight: 6 }} />
                 <Text style={styles.actionBtnText}>Change Password</Text>
              </TouchableOpacity>
           </View>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
           <View style={styles.sectionHeader}>
              <Feather name="bell" size={18} color={Colors.neon} />
              <Text style={styles.sectionTitle}>Notifications</Text>
           </View>
           
           <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Medication reminders</Text>
              <Switch value={true} trackColor={{ true: Colors.neon }} />
           </View>
           <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Appointment reminders</Text>
              <Switch value={true} trackColor={{ true: Colors.neon }} />
           </View>
           <View style={styles.notificationRow}>
              <Text style={styles.notificationLabel}>Lab report alerts</Text>
              <Switch value={true} trackColor={{ true: Colors.neon }} />
           </View>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
           <View style={styles.sectionHeader}>
              <Feather name="activity" size={18} color={Colors.amber} />
              <Text style={styles.sectionTitle}>Lifestyle & Habit Profile</Text>
           </View>
           <Text style={styles.lifestyleHint}>Manage your daily habits, meal timings, and general lifestyle notes used by your care team.</Text>
           <TouchableOpacity style={styles.actionBtnFull}>
              <Text style={styles.actionBtnText}>Manage Lifestyle Details</Text>
           </TouchableOpacity>
        </GlassCard>

        <GlassCard style={[styles.sectionCard, styles.dangerZone]}>
           <View style={styles.dangerInfo}>
              <Text style={styles.dangerTitle}>Sign Out</Text>
              <Text style={styles.dangerSubtitle}>End your current session across this device.</Text>
           </View>
           <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Feather name="log-out" size={16} color={Colors.rose} />
              <Text style={styles.logoutBtnText}>Logout</Text>
           </TouchableOpacity>
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
  sectionCard: { padding: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 18, ...Fonts.bold, color: Colors.white },
  fieldsContainer: { marginBottom: Spacing.lg },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  fieldLabel: { fontSize: 13, color: Colors.mist },
  fieldValue: { fontSize: 14, ...Fonts.medium, color: Colors.white },
  codeWrapper: { backgroundColor: Colors.glass, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: Colors.border },
  codeText: { fontSize: 12, ...Fonts.bold, color: Colors.white, letterSpacing: 1 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.glass, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  actionBtnFull: { alignItems: 'center', backgroundColor: Colors.glass, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, width: '100%' },
  actionBtnText: { fontSize: 13, ...Fonts.medium, color: Colors.white },
  notificationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  notificationLabel: { fontSize: 14, color: Colors.white },
  lifestyleHint: { fontSize: 13, color: Colors.mist, lineHeight: 20, marginBottom: Spacing.lg },
  dangerZone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(244,63,94,0.05)', borderColor: 'rgba(244,63,94,0.2)' },
  dangerInfo: { flex: 1, paddingRight: Spacing.md },
  dangerTitle: { fontSize: 16, ...Fonts.bold, color: Colors.white, marginBottom: 2 },
  dangerSubtitle: { fontSize: 12, color: Colors.mist },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(244,63,94,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  logoutBtnText: { fontSize: 13, ...Fonts.bold, color: Colors.rose },
});
