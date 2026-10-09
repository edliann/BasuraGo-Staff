import { Redirect, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardScreen() {
  const {
    status,
    dashboard,
    error,
    authorizationRetrying,
    logout,
    retryAuthorization,
  } = useAuth();

  if (status === 'initializing' || status === 'checking') {
    return <LoadingScreen />;
  }
  if (status === 'error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Unable to load your facility</Text>
          <Text style={styles.body}>
            Your account could not be verified right now. Check your connection
            and try again.
          </Text>
          <Pressable style={styles.primaryButton} onPress={retryAuthorization}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={logout}>
            <Text style={styles.secondaryButtonText}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  if (status !== 'authorized' || !dashboard) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <View>
            <Text style={styles.inlineError} accessibilityRole="alert">
              {error}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={retryAuthorization}
              disabled={authorizationRetrying}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>
                {authorizationRetrying
                  ? 'Checking access...'
                  : 'Retry access check'}
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BasuraGo</Text>
            <Text style={styles.role}>FACILITY STAFF</Text>
          </View>
          <Pressable
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <Text style={styles.welcome}>Welcome, {dashboard.staffName}</Text>
        <Text style={styles.intro}>
          You are signed in to your assigned facility.
        </Text>

        <View style={styles.facilityCard}>
          <View style={styles.cardHeading}>
            <Text style={styles.cardTitle}>Your facility</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {dashboard.facilityStatus === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <Text style={styles.facilityName}>{dashboard.facilityName}</Text>
          <Text style={styles.fieldLabel}>Address</Text>
          <Text style={styles.address}>{dashboard.facilityAddress}</Text>
        </View>

        <View style={styles.emptyCard}>
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push('/receipt')}
            accessibilityRole="button"
          >
            <Text style={styles.scanButtonText}>Receive a Pickup</Text>
          </Pressable>
          <View style={styles.emptyMark}>
            <Text style={styles.emptyMarkText}>BG</Text>
          </View>
          <Text style={styles.emptyTitle}>
            Delivery information is not available yet
          </Text>
          <Text style={styles.emptyBody}>
            Delivery updates will appear here when this feature is available.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  content: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 36,
  },
  inlineError: {
    marginBottom: 16,
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 6,
  },
  retryButtonText: {
    color: '#1F7A3F',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 34,
  },
  brand: {
    color: '#1F7A3F',
    fontSize: 26,
    fontWeight: '800',
  },
  role: {
    marginTop: 3,
    color: '#55705C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.7,
  },
  logoutButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5DED6',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    color: '#34483A',
    fontSize: 14,
    fontWeight: '600',
  },
  welcome: {
    color: '#18231B',
    fontSize: 25,
    fontWeight: '700',
  },
  intro: {
    marginTop: 7,
    marginBottom: 24,
    color: '#59665C',
    fontSize: 15,
    lineHeight: 22,
  },
  facilityCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E8E1',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: '#59665C',
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F5EC',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1F7A3F',
  },
  statusText: {
    color: '#1F7A3F',
    fontSize: 12,
    fontWeight: '700',
  },
  facilityName: {
    marginTop: 14,
    color: '#18231B',
    fontSize: 20,
    fontWeight: '700',
  },
  fieldLabel: {
    marginTop: 20,
    color: '#59665C',
    fontSize: 13,
    fontWeight: '600',
  },
  address: {
    marginTop: 5,
    color: '#26342A',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyCard: {
    marginTop: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E8E1',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyMark: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#E8F5EC',
  },
  scanButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginBottom: 22,
    borderRadius: 11,
    backgroundColor: '#1F7A3F',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyMarkText: {
    color: '#1F7A3F',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyTitle: {
    marginTop: 16,
    color: '#18231B',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 7,
    color: '#66736A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#18231B',
    fontSize: 23,
    fontWeight: '700',
  },
  body: {
    marginTop: 10,
    color: '#59665C',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1F7A3F',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#34483A',
    fontSize: 14,
    fontWeight: '600',
  },
});
