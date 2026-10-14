import { Redirect, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingTabBar from '@/components/FloatingTabBar';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
  const { status, user, dashboard, logout } = useAuth();

  if (status === 'initializing' || status === 'checking') {
    return <LoadingScreen />;
  }

  if (status !== 'authorized' || !dashboard) {
    return <Redirect href="/" />;
  }

  const initial = dashboard.staffName.trim().charAt(0).toUpperCase() || 'S';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR PROFILE</Text>
            <Text style={styles.title}>Account</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.settingsGlyph}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{dashboard.staffName}</Text>
          <Text style={styles.role}>Facility Staff</Text>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not available'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ASSIGNED FACILITY</Text>
            <Text style={styles.infoValue}>{dashboard.facilityName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>FACILITY STATUS</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  dashboard.facilityStatus !== 'active' && styles.statusDotInactive,
                ]}
              />
              <Text style={styles.infoValue}>
                {dashboard.facilityStatus === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account access</Text>
        <View style={styles.menuCard}>
          <View style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuGlyph}>⌕</Text>
            </View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>Assigned facility</Text>
              <Text style={styles.menuDescription}>
                Your facility details are managed by your administrator.
              </Text>
            </View>
          </View>
          <View style={styles.menuDivider} />
          <Pressable
            style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}
            onPress={logout}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>Log out</Text>
            <Text style={styles.logoutArrow}>→</Text>
          </Pressable>
        </View>
      </ScrollView>
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F5' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  eyebrow: { color: '#398052', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 5, color: '#17271D', fontSize: 29, fontWeight: '800', letterSpacing: -0.6 },
  settingsButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCE5DD', borderRadius: 15, backgroundColor: '#FFFFFF' },
  settingsGlyph: { color: '#176B3A', fontSize: 23 },
  pressed: { opacity: 0.72 },
  profileCard: { alignItems: 'center', padding: 22, borderWidth: 1, borderColor: '#E0E8E1', borderRadius: 22, backgroundColor: '#FFFFFF' },
  avatar: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#176B3A' },
  avatarText: { color: '#FFFFFF', fontSize: 31, fontWeight: '800' },
  name: { marginTop: 14, color: '#17271D', fontSize: 21, fontWeight: '800', textAlign: 'center' },
  role: { marginTop: 4, color: '#758178', fontSize: 13, fontWeight: '600' },
  divider: { alignSelf: 'stretch', height: 1, marginVertical: 20, backgroundColor: '#EEF2EE' },
  infoRow: { alignSelf: 'stretch', marginBottom: 16 },
  infoLabel: { marginBottom: 5, color: '#78867B', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  infoValue: { color: '#26382B', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#238447' },
  statusDotInactive: { backgroundColor: '#B42318' },
  sectionTitle: { marginTop: 25, marginBottom: 12, color: '#1B2E21', fontSize: 18, fontWeight: '800' },
  menuCard: { paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E8E1', borderRadius: 18, backgroundColor: '#FFFFFF' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 },
  menuIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#EAF5EC' },
  menuGlyph: { color: '#176B3A', fontSize: 22 },
  menuCopy: { flex: 1 },
  menuTitle: { color: '#26382B', fontSize: 14, fontWeight: '700' },
  menuDescription: { marginTop: 4, color: '#758178', fontSize: 12, lineHeight: 18 },
  menuDivider: { height: 1, backgroundColor: '#EEF2EE' },
  logoutRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoutText: { color: '#B42318', fontSize: 14, fontWeight: '700' },
  logoutArrow: { color: '#B42318', fontSize: 20 },
});
