import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingScreen({
  message = 'Loading your account...',
}: {
  message?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>BasuraGo</Text>
      <Text style={styles.role}>FACILITY STAFF</Text>
      <ActivityIndicator color="#1F7A3F" size="small" style={styles.spinner} />
      <Text style={styles.loading}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9F7',
  },
  brand: {
    color: '#1F7A3F',
    fontSize: 34,
    fontWeight: '800',
  },
  role: {
    marginTop: 4,
    color: '#55705C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  spinner: {
    marginTop: 34,
  },
  loading: {
    marginTop: 12,
    color: '#59665C',
    fontSize: 14,
  },
});
