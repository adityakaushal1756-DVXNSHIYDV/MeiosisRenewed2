import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';
import { apiUrl, getAuthHeader } from '../../lib/api';

interface SignedQrResponse {
  status: 'QR_READY';
  scope: string;
  ttlSeconds: number;
  expiresAt: number;
  gatewayUrl: string;
  token?: string;
}

const durationOptions = [
  { label: '15m', seconds: 15 * 60 },
  { label: '30m', seconds: 30 * 60 },
  { label: '1 hr', seconds: 60 * 60 },
  { label: '2 hrs', seconds: 2 * 60 * 60 },
  { label: '6 hrs', seconds: 6 * 60 * 60 },
];

export default function MyQrScreen() {
  const { profile, session } = useAuth();
  const insets = useSafeAreaInsets();
  const [durationIdx, setDurationIdx] = useState(2); // Default 1 hr
  const [refreshKey, setRefreshKey] = useState(0);
  const [qrResponse, setQrResponse] = useState<SignedQrResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeOtp, setActiveOtp] = useState<{ otp: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  const selectedDuration = durationOptions[durationIdx];
  const patientCode = profile?.universalCode || profile?.meiosisId || profile?.id || '';
  const isLive = !!qrResponse?.expiresAt && qrResponse.expiresAt * 1000 > now;

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const fetchQr = async () => {
    if (!session?.token) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl(`/gateway/qr?ttlSeconds=${selectedDuration.seconds}`), {
        headers: getAuthHeader(session.token),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to generate QR');
      setQrResponse(body);
    } catch (err: any) {
      setError(err.message || 'Unable to generate a secure QR right now.');
      setQrResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQr();
  }, [refreshKey, durationIdx, session?.token]);

  // Polling for active OTP
  useEffect(() => {
    if (!profile?.id || !session?.token) return;
    const poll = async () => {
      try {
        const res = await fetch(apiUrl(`/otp/current?patientId=${profile.id}`), {
          headers: getAuthHeader(session.token),
        });
        if (res.ok) {
          const body = await res.json();
          if (body.active) {
            setActiveOtp({ otp: body.otp, expiresAt: body.expiresAt });
          } else {
            setActiveOtp(null);
          }
        }
      } catch (e) {
        // silently fail polling
      }
    };
    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [profile?.id, session?.token]);

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.neon} size="large" />
      </View>
    );
  }

  const activePrescriptionsCount = profile.prescriptions.filter(
    (item) => item.isActive ?? item.status === 'ACTIVE'
  ).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My QR</Text>
        <Text style={styles.subtitle}>Present to a doctor for signed, time-boxed EMR access.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              {isLoading ? (
                <ActivityIndicator color={Colors.neon} size="large" />
              ) : qrResponse?.gatewayUrl ? (
                <QRCode
                  value={qrResponse.token || qrResponse.gatewayUrl}
                  size={200}
                  color={Colors.ink}
                  backgroundColor={Colors.white}
                />
              ) : (
                <Text style={styles.errorText}>{error || 'QR Unavailable'}</Text>
              )}
              {qrResponse?.gatewayUrl && (
                <View style={styles.qrGlow} pointerEvents="none" />
              )}
            </View>

            {activeOtp && (
              <View style={styles.otpOverlay}>
                <Text style={styles.otpLabel}>VERIFICATION CODE</Text>
                <View style={styles.otpBoxes}>
                  {activeOtp.otp.split('').map((char, i) => (
                    <View key={i} style={styles.otpBox}>
                      <Text style={styles.otpChar}>{char}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.otpHint}>Provide this to the doctor for access</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.patientName}>{profile.name}</Text>
            <Text style={styles.patientId}>ID: <Text style={{ color: Colors.white }}>{patientCode}</Text></Text>

            <View style={styles.badgesRow}>
              <View style={styles.scopeBadge}>
                <Feather name="shield" size={12} color={Colors.neon} />
                <Text style={styles.scopeText}>{qrResponse?.scope || 'READ_ONLY_EMR'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, isLive ? styles.statusLive : styles.statusExpired]} />
                <Text style={styles.statusText}>{isLive ? 'Live' : 'Expired'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: Colors.skyDim, borderColor: 'rgba(131,212,255,0.2)' }]}>
                <Feather name="file" size={14} color={Colors.sky} />
              </View>
              <Text style={styles.statText}>{profile.appointments.length} Visits</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.2)' }]}>
                <Feather name="file-text" size={14} color={Colors.purple} />
              </View>
              <Text style={styles.statText}>{activePrescriptionsCount} Active Rx</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(251,184,36,0.1)', borderColor: 'rgba(251,184,36,0.2)' }]}>
                <Feather name="activity" size={14} color={Colors.amber} />
              </View>
              <Text style={styles.statText}>{profile.labReports.length} Labs</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' }]}>
                <Feather name="user" size={14} color={Colors.emerald} />
              </View>
              <Text style={styles.statText}>Identity Match</Text>
            </View>
          </View>

          <View style={styles.controlsSection}>
            <View style={styles.durationHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="clock" size={14} color={Colors.mist} />
                <Text style={styles.durationLabel}>Valid for</Text>
              </View>
              <Text style={styles.durationValue}>{selectedDuration.label}</Text>
            </View>

            <View style={styles.durationSelector}>
              {durationOptions.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.durationBtn, durationIdx === i && styles.durationBtnActive]}
                  onPress={() => setDurationIdx(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.durationBtnText, durationIdx === i && styles.durationBtnTextActive]}>
                    {opt.label.replace(' ', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => setRefreshKey(k => k + 1)}
              activeOpacity={0.8}
            >
              <Feather name="refresh-ccw" size={16} color={Colors.white} />
              <Text style={styles.refreshBtnText}>Generate New Signed QR</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard style={styles.guideCard}>
          <View style={styles.guideBadge}>
            <Text style={styles.guideBadgeText}>Scan Guide</Text>
          </View>
          <Text style={styles.guideTitle}>How it works</Text>
          
          <View style={styles.guideItem}>
             <View style={[styles.guideDot, { backgroundColor: Colors.neon, shadowColor: Colors.neon }]} />
             <View>
                <Text style={styles.guideItemTitle}>Linked doctors</Text>
                <Text style={styles.guideItemText}>Scanning opens your existing doctor link and highlights your record instantly.</Text>
             </View>
          </View>
          
          <View style={styles.guideItem}>
             <View style={[styles.guideDot, { backgroundColor: Colors.sky, shadowColor: Colors.sky }]} />
             <View>
                <Text style={styles.guideItemTitle}>Unlinked doctors</Text>
                <Text style={styles.guideItemText}>They receive a short-lived read-only EMR token scoped only to this patient.</Text>
             </View>
          </View>
          
          <View style={styles.guideItem}>
             <View style={[styles.guideDot, { backgroundColor: Colors.amber, shadowColor: Colors.amber }]} />
             <View>
                <Text style={styles.guideItemTitle}>Expires at</Text>
                <Text style={styles.guideItemText}>
                  {qrResponse?.expiresAt ? new Date(qrResponse.expiresAt * 1000).toLocaleString([], {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  }) : '--'}
                </Text>
             </View>
          </View>
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
  qrCard: { overflow: 'hidden' },
  qrContainer: { padding: Spacing.xxl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.02)' },
  qrBox: { width: 232, height: 232, backgroundColor: Colors.white, borderRadius: 24, padding: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: Colors.white, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 10 },
  qrGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(82,255,157,0.2)' },
  errorText: { color: Colors.rose, ...Fonts.medium, textAlign: 'center' },
  otpOverlay: { position: 'absolute', bottom: Spacing.xl, left: Spacing.xl, right: Spacing.xl, backgroundColor: 'rgba(4,12,24,0.9)', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(82,255,157,0.3)', alignItems: 'center', shadowColor: Colors.neon, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 20 },
  otpLabel: { fontSize: 10, ...Fonts.bold, color: Colors.neon, letterSpacing: 1.5, marginBottom: Spacing.sm },
  otpBoxes: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  otpBox: { width: 40, height: 48, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  otpChar: { fontSize: 24, ...Fonts.bold, color: Colors.white },
  otpHint: { fontSize: 10, color: Colors.mist },
  infoSection: { padding: Spacing.xl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  patientName: { fontSize: 20, ...Fonts.bold, color: Colors.white, marginBottom: 4 },
  patientId: { fontSize: 13, color: Colors.mist, marginBottom: Spacing.md },
  badgesRow: { flexDirection: 'row', gap: Spacing.sm },
  scopeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.neonDim, borderColor: 'rgba(82,255,157,0.2)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  scopeText: { fontSize: 10, ...Fonts.bold, color: Colors.neon },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.glass, borderColor: Colors.border, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLive: { backgroundColor: Colors.neon },
  statusExpired: { backgroundColor: Colors.rose },
  statusText: { fontSize: 10, ...Fonts.bold, color: Colors.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.01)' },
  statItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.sm },
  statIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statText: { fontSize: 13, color: Colors.white, ...Fonts.medium },
  controlsSection: { padding: Spacing.xl, backgroundColor: 'rgba(4,12,24,0.3)' },
  durationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  durationLabel: { fontSize: 13, ...Fonts.medium, color: Colors.mist },
  durationValue: { fontSize: 16, ...Fonts.bold, color: Colors.white },
  durationSelector: { flexDirection: 'row', backgroundColor: Colors.glass, borderRadius: Radius.pill, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
  durationBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.pill },
  durationBtnActive: { backgroundColor: Colors.white },
  durationBtnText: { fontSize: 11, ...Fonts.bold, color: Colors.mist },
  durationBtnTextActive: { color: Colors.ink },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: Colors.glass, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  refreshBtnText: { fontSize: 14, ...Fonts.medium, color: Colors.white },
  guideCard: { padding: Spacing.xl },
  guideBadge: { alignSelf: 'flex-start', backgroundColor: Colors.skyDim, borderColor: 'rgba(131,212,255,0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, marginBottom: Spacing.md },
  guideBadgeText: { fontSize: 10, ...Fonts.bold, color: Colors.sky },
  guideTitle: { fontSize: 18, ...Fonts.bold, color: Colors.white, marginBottom: Spacing.lg },
  guideItem: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  guideDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
  guideItemTitle: { fontSize: 14, ...Fonts.bold, color: Colors.white, marginBottom: 4 },
  guideItemText: { fontSize: 13, color: Colors.mist, lineHeight: 20 },
});
