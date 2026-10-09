import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AccessErrorScreenProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry: () => void;
  onLogout?: () => void;
}

export default function AccessErrorScreen({
  title = 'Could not verify access',
  message,
  retryLabel = 'Try again',
  onRetry,
  onLogout,
}: AccessErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>BasuraGo</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.primary} onPress={onRetry}>
        <Text style={styles.primaryText}>{retryLabel}</Text>
      </Pressable>
      {onLogout ? (
        <Pressable style={styles.secondary} onPress={onLogout}>
          <Text style={styles.secondaryText}>Log out</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F9F7',
  },
  brand: {
    color: '#1F7A3F',
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    marginTop: 30,
    color: '#18231B',
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    marginTop: 10,
    color: '#59665C',
    fontSize: 15,
    lineHeight: 22,
  },
  primary: {
    minHeight: 52,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1F7A3F',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondary: {
    minHeight: 48,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#34483A',
    fontSize: 14,
    fontWeight: '600',
  },
});
