import AppIcon from '../components/AppIcon';
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingTabBar from '../components/FloatingTabBar';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { status, dashboard } = useAuth();

  if (status === 'initializing' || status === 'checking') return <LoadingScreen />;
  if (status !== 'authorized' || !dashboard) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/account')} accessibilityRole="button" accessibilityLabel="Back to account">
          <AppIcon name="arrow-left-s-line" size={22} color="#176B3A" fallback={null} />
          <Text style={styles.backText}>Account</Text>
        </Pressable>
        <Text style={styles.eyebrow}>PREFERENCES</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your staff app preferences.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>Appearance</Text>
              <Text style={styles.rowDescription}>BasuraGo currently uses the light theme.</Text>
            </View>
            <View style={styles.valuePill}><Text style={styles.valueText}>Light</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>Facility access</Text>
              <Text style={styles.rowDescription}>Access is verified automatically while you use the app.</Text>
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Need to change account details?</Text>
          <Text style={styles.noteBody}>Contact your BasuraGo administrator to update your staff account or assigned facility.</Text>
        </View>
      </ScrollView>
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F8F5' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 112 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 26, paddingVertical: 5 },
  backText: { color: '#176B3A', fontSize: 13, fontWeight: '700' },
  eyebrow: { color: '#398052', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 5, color: '#17271D', fontSize: 29, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { marginTop: 7, marginBottom: 23, color: '#758178', fontSize: 14, lineHeight: 21 },
  card: { paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E8E1', borderRadius: 18, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 },
  iconBox: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#EAF5EC' },
  copy: { flex: 1 },
  rowTitle: { color: '#26382B', fontSize: 14, fontWeight: '700' },
  rowDescription: { marginTop: 4, color: '#758178', fontSize: 12, lineHeight: 18 },
  valuePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#EAF5EC' },
  valueText: { color: '#176B3A', fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#EEF2EE' },
  noteCard: { marginTop: 18, padding: 17, borderRadius: 17, backgroundColor: '#EAF5EC' },
  noteTitle: { color: '#173C28', fontSize: 14, fontWeight: '800' },
  noteBody: { marginTop: 6, color: '#536C59', fontSize: 12, lineHeight: 19 },
});
