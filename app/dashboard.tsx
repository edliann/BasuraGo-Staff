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
          <View style={styles.errorMark}>
            <Text style={styles.errorMarkText}>!</Text>
          </View>
          <Text style={styles.eyebrow}>BASURAGO STAFF</Text>
          <Text style={styles.errorTitle}>Unable to load your facility</Text>
          <Text style={styles.body}>
            Your account could not be verified right now. Check your connection
            and try again.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={retryAuthorization}
            disabled={authorizationRetrying}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {authorizationRetrying ? 'Checking access...' : 'Try again'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={logout}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (status !== 'authorized' || !dashboard) {
    return <Redirect href="/" />;
  }

  const facilityIsActive = dashboard.facilityStatus === 'active';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.inlineErrorCard}>
            <View style={styles.inlineErrorIcon}>
              <Text style={styles.inlineErrorIconText}>!</Text>
            </View>
            <View style={styles.inlineErrorCopy}>
              <Text style={styles.inlineErrorTitle}>Access check needs attention</Text>
              <Text style={styles.inlineError}>{error}</Text>
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
          </View>
        ) : null}

        <View style={styles.header}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>B</Text>
            </View>
            <View>
              <Text style={styles.brand}>BasuraGo</Text>
              <Text style={styles.role}>FACILITY STAFF</Text>
            </View>
          </View>
          <Pressable
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={styles.greeting}>YOUR WORKSPACE</Text>
          <Text style={styles.welcome}>
            Welcome back,{'\n'}
            <Text style={styles.welcomeName}>{dashboard.staffName}</Text>
          </Text>
            <Text style={styles.intro}>
              Here&apos;s the information for your assigned facility.
            </Text>
        </View>

        <View style={styles.facilityCard}>
          <View style={styles.facilityCardTop}>
            <View style={styles.facilityIcon}>
              <Text style={styles.facilityIconText}>⌂</Text>
            </View>
            <View style={styles.facilityHeadingCopy}>
              <Text style={styles.cardEyebrow}>ASSIGNED FACILITY</Text>
              <Text style={styles.cardTitle}>Facility overview</Text>
            </View>
            <View
              style={[
                styles.statusPill,
                !facilityIsActive && styles.statusPillInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  !facilityIsActive && styles.statusDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  !facilityIsActive && styles.statusTextInactive,
                ]}
              >
                {facilityIsActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <Text style={styles.facilityName}>{dashboard.facilityName}</Text>

          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Text style={styles.addressIconText}>⌖</Text>
            </View>
            <View style={styles.addressCopy}>
              <Text style={styles.fieldLabel}>FACILITY ADDRESS</Text>
              <Text style={styles.address}>{dashboard.facilityAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Quick action</Text>
          <Text style={styles.sectionHint}>What would you like to do?</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            pressed && styles.actionCardPressed,
          ]}
          onPress={() => router.push('/receipt')}
          accessibilityRole="button"
          accessibilityLabel="Receive a pickup. Open the facility pickup receipt workflow."
        >
          <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>↧</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Receive a pickup</Text>
            <Text style={styles.actionDescription}>
              Scan the pickup QR code or enter its ID, then confirm the actual
              received weight.
            </Text>
            <View style={styles.actionLinkRow}>
              <Text style={styles.actionLink}>Open receipt workflow</Text>
              <Text style={styles.actionArrow}>→</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Facility updates</Text>
        </View>

        <View style={styles.emptyCard}>
          <View style={styles.emptyIllustration}>
            <View style={styles.emptyIllustrationInner}>
              <Text style={styles.emptyIllustrationText}>✓</Text>
            </View>
          </View>
          <Text style={styles.emptyTitle}>You&apos;re all set</Text>
          <Text style={styles.emptyBody}>
            Pickup and delivery updates will appear here when they are available.
            For now, use Receive a pickup to record an incoming facility receipt.
          </Text>
        </View>

        <Text style={styles.footer}>BasuraGo · Facility operations</Text>
      </ScrollView>
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 112,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#176B3A',
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  brand: {
    color: '#173C28',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  role: {
    marginTop: 2,
    color: '#66806D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  logoutButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE5DD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  logoutButtonPressed: {
    backgroundColor: '#EAF1EB',
  },
  logoutText: {
    color: '#3D5545',
    fontSize: 13,
    fontWeight: '700',
  },
  welcomeBlock: {
    marginBottom: 22,
  },
  greeting: {
    marginBottom: 9,
    color: '#398052',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  welcome: {
    color: '#17271D',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  welcomeName: {
    color: '#176B3A',
  },
  intro: {
    marginTop: 9,
    color: '#66736A',
    fontSize: 14,
    lineHeight: 21,
  },
  facilityCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E8E1',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#173C28',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  facilityCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facilityIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#EAF5EC',
  },
  facilityIconText: {
    color: '#176B3A',
    fontSize: 26,
    fontWeight: '700',
  },
  facilityHeadingCopy: {
    flex: 1,
  },
  cardEyebrow: {
    color: '#77867A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  cardTitle: {
    marginTop: 3,
    color: '#26382B',
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F5EC',
  },
  statusPillInactive: {
    backgroundColor: '#FDECEC',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#238447',
  },
  statusDotInactive: {
    backgroundColor: '#B42318',
  },
  statusText: {
    color: '#1F7A3F',
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextInactive: {
    color: '#B42318',
  },
  cardDivider: {
    height: 1,
    marginTop: 17,
    marginBottom: 16,
    backgroundColor: '#EEF2EE',
  },
  facilityName: {
    color: '#17271D',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F0',
  },
  addressIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F3F7F3',
  },
  addressIconText: {
    color: '#4F7058',
    fontSize: 20,
    fontWeight: '700',
  },
  addressCopy: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 5,
    color: '#78867B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  address: {
    color: '#46564A',
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeading: {
    marginTop: 27,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1B2E21',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionHint: {
    marginTop: 4,
    color: '#7A877D',
    fontSize: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#176B3A',
    shadowColor: '#176B3A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  actionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '600',
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  actionDescription: {
    marginTop: 6,
    color: '#E0F0E4',
    fontSize: 12,
    lineHeight: 18,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  actionLink: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionArrow: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#E1E9E2',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  emptyIllustration: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#EAF5EC',
  },
  emptyIllustrationInner: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#176B3A',
  },
  emptyIllustrationText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  emptyTitle: {
    marginTop: 15,
    color: '#1B2E21',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBody: {
    marginTop: 7,
    color: '#758178',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  inlineErrorCard: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F4C7C3',
    borderRadius: 14,
    backgroundColor: '#FFF5F4',
  },
  inlineErrorIcon: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#FCE2DF',
  },
  inlineErrorIconText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '900',
  },
  inlineErrorCopy: {
    flex: 1,
  },
  inlineErrorTitle: {
    color: '#912018',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineError: {
    marginTop: 4,
    color: '#A13A32',
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingVertical: 4,
  },
  retryButtonText: {
    color: '#176B3A',
    fontSize: 12,
    fontWeight: '800',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  errorMark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#FCE2DF',
  },
  errorMarkText: {
    color: '#B42318',
    fontSize: 24,
    fontWeight: '900',
  },
  eyebrow: {
    marginTop: 18,
    color: '#66806D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  errorTitle: {
    marginTop: 8,
    color: '#17271D',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
  body: {
    marginTop: 10,
    color: '#66736A',
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#176B3A',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  secondaryButton: {
    minHeight: 48,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#46564A',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    color: '#9AA69C',
    fontSize: 11,
    textAlign: 'center',
  },
});