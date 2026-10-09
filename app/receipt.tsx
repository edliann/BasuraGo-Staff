import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { receivePickup } from '@/services/pickupReceipt';
import type { PickupReceiptResult } from '@/services/pickupReceipt';

function getReceiptError(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code.replace(/^functions\//, '')
      : '';
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : '';

  if (code === 'invalid-argument') {
    return message || 'Enter the pickup document ID from its QR code.';
  }
  if (code === 'not-found') {
    return 'No pickup matches this QR code. Check the scanned pickup ID.';
  }
  if (
    code === 'permission-denied' &&
    message.toLowerCase().includes('different facility')
  ) {
    return 'This pickup is assigned to a different facility.';
  }
  if (code === 'permission-denied' || code === 'unauthenticated') {
    return 'Your facility staff access could not be confirmed. Sign in again or contact your administrator.';
  }
  if (code === 'failed-precondition') {
    return message || 'This pickup is not eligible for facility receipt.';
  }
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'network-request-failed'
  ) {
    return 'The receipt service could not be reached. Check your connection and try again.';
  }
  return 'Unable to record this facility receipt. Please try again.';
}

export default function PickupReceiptScreen() {
  const { status } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [pickupId, setPickupId] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PickupReceiptResult | null>(null);
  const requestInProgress = useRef(false);
  const barcodeHandled = useRef(false);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (barcodeHandled.current || submitting || receipt) return;
    barcodeHandled.current = true;
    setScanning(false);

    const decodedId = result.data.trim();
    if (
      result.type !== 'qr' ||
      decodedId.length === 0 ||
      decodedId.length > 128 ||
      decodedId.includes('/') ||
      /\s/.test(decodedId)
    ) {
      setScanError(
        'Invalid QR code. Scan a QR code containing only the pickup document ID.',
      );
      barcodeHandled.current = false;
      return;
    }

    setPickupId(decodedId);
    setScanError('');
    setError('');
  }

  async function handleReceive() {
    if (requestInProgress.current || receipt) return;
    const normalizedPickupId = pickupId.trim();
    const actualWeightKg = Number(actualWeight);
    if (!normalizedPickupId) {
      setError('Scan the pickup QR code or enter its pickup document ID.');
      return;
    }
    if (
      !actualWeight.trim() ||
      !Number.isFinite(actualWeightKg) ||
      actualWeightKg <= 0
    ) {
      setError('Enter the actual received weight in kilograms.');
      return;
    }

    requestInProgress.current = true;
    setSubmitting(true);
    setScanning(false);
    setError('');
    try {
      const result = await receivePickup(
        normalizedPickupId,
        actualWeightKg,
      );
      setReceipt(result);
    } catch (receiptError) {
      console.error('Failed to record facility pickup receipt:', receiptError);
      setError(getReceiptError(receiptError));
    } finally {
      requestInProgress.current = false;
      setSubmitting(false);
    }
  }

  function resetForm() {
    setPickupId('');
    setActualWeight('');
    setReceipt(null);
    setError('');
    setScanError('');
    setScanning(false);
    barcodeHandled.current = false;
  }

  async function startScanning() {
    setScanError('');
    barcodeHandled.current = false;
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setScanError(
          result.canAskAgain
            ? 'Camera permission is required to scan. Allow camera access and try again, or enter the pickup ID manually.'
            : 'Camera access is blocked. Enable it in device settings, or enter the pickup ID manually.',
        );
        return;
      }
    }
    setScanning(true);
  }

  if (
    status === 'initializing' ||
    status === 'checking' ||
    status === 'logging-out'
  ) {
    return <LoadingScreen />;
  }
  if (status !== 'authorized') {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/dashboard')}
        >
          <Text style={styles.backLink}>‹ Back to Dashboard</Text>
        </Pressable>

        <Text style={styles.title}>Facility Pickup Receipt</Text>
        <Text style={styles.subtitle}>
          Use the pickup document ID encoded in the QR code. The Backend
          verifies your assigned facility and records receipt.
        </Text>

        {receipt ? (
          <View style={styles.card}>
            <Text style={styles.successTitle}>
              {receipt.alreadyReceived
                ? 'Pickup Already Received'
                : 'Pickup Received'}
            </Text>
            <Text style={styles.body}>
              {receipt.alreadyReceived
                ? 'This pickup already has an authoritative facility receipt. Capacity was not changed again.'
                : 'The receipt was recorded and capacity accounting was updated.'}
            </Text>
            <Text style={styles.label}>Pickup reference</Text>
            <Text selectable style={styles.value}>{receipt.pickupId}</Text>
            <Text style={styles.label}>Actual received weight</Text>
            <Text style={styles.value}>{receipt.actualWeightKg} kg</Text>
            <Text style={styles.label}>Estimated weight</Text>
            <Text style={styles.value}>{receipt.estimatedWeightKg} kg</Text>
            <Text style={styles.label}>Receipt time</Text>
            <Text style={styles.value}>
              {new Date(receipt.receivedAt).toLocaleString()}
            </Text>
            {receipt.exceedsMaximumCapacity ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  The received weight puts recorded facility occupancy above
                  configured maximum capacity. The physical receipt was
                  recorded; new reservations will be blocked until capacity is
                  resolved.
                </Text>
              </View>
            ) : receipt.actualWeightKg !== receipt.estimatedWeightKg ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  Received weight differs from the estimate by{' '}
                  {receipt.actualWeightKg - receipt.estimatedWeightKg} kg. The
                  difference is recorded.
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.primaryButton} onPress={resetForm}>
              <Text style={styles.primaryButtonText}>Scan Next Pickup</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Pickup QR payload</Text>
            <Text style={styles.help}>
              Scan a QR code containing only the pickup document ID, or enter
              the ID manually. Confirm the measured weight before submitting
              the receipt.
            </Text>
            {permission === null ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#1F7A3F" />
                <Text style={styles.help}>Checking camera permission...</Text>
              </View>
            ) : null}
            {scanning && permission?.granted ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={
                    barcodeHandled.current ? undefined : handleBarcodeScanned
                  }
                />
                <Text style={styles.cameraHint}>
                  Hold the pickup QR code inside the camera view.
                </Text>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setScanning(false);
                    barcodeHandled.current = false;
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Close Scanner</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void startScanning()}
                disabled={permission === null || submitting}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>Scan QR Code</Text>
              </Pressable>
            )}
            {permission && !permission.granted && scanError ? (
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void Linking.openSettings()}
              >
                <Text style={styles.secondaryButtonText}>
                  Open Camera Settings
                </Text>
              </Pressable>
            ) : null}
            {scanError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {scanError}
              </Text>
            ) : null}
            <TextInput
              style={styles.input}
              value={pickupId}
              onChangeText={(value) => {
                setPickupId(value);
                setError('');
                setScanError('');
                barcodeHandled.current = false;
              }}
              placeholder="Pickup document ID"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              accessibilityLabel="Pickup document ID"
            />

            <Text style={styles.fieldLabel}>Actual received weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={actualWeight}
              onChangeText={(value) => {
                setActualWeight(value);
                setError('');
              }}
              placeholder="Enter measured kilograms"
              keyboardType="decimal-pad"
              editable={!submitting}
              accessibilityLabel="Actual received weight in kilograms"
            />

            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <Pressable
              style={[
                styles.primaryButton,
                submitting && styles.disabledButton,
              ]}
              onPress={() => void handleReceive()}
              disabled={submitting}
              accessibilityRole="button"
            >
              {submitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Verifying and receiving...
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>
                  Confirm Facility Receipt
                </Text>
              )}
            </Pressable>
          </View>
        )}
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
  backLink: {
    color: '#1F7A3F',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 20,
  },
  title: {
    color: '#18231B',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#59665C',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E8E1',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cameraContainer: {
    overflow: 'hidden',
    marginTop: 14,
    borderRadius: 10,
  },
  camera: {
    height: 300,
    width: '100%',
  },
  cameraHint: {
    backgroundColor: '#E8F5EC',
    color: '#34483A',
    fontSize: 13,
    padding: 10,
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#1F7A3F',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#1F7A3F',
    fontSize: 14,
    fontWeight: '700',
  },
  fieldLabel: {
    color: '#34483A',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 7,
  },
  help: {
    color: '#66736A',
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D5DED6',
    borderRadius: 10,
    borderWidth: 1,
    color: '#18231B',
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1F7A3F',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  error: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  successTitle: {
    color: '#166534',
    fontSize: 21,
    fontWeight: '800',
  },
  body: {
    color: '#59665C',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  label: {
    color: '#59665C',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 18,
  },
  value: {
    color: '#18231B',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 5,
  },
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 9,
    borderWidth: 1,
    marginTop: 18,
    padding: 12,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 20,
  },
});
