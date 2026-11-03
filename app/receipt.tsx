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

import FloatingTabBar from '../components/FloatingTabBar';

import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/services/firebase';
import {
  getPickupReceiptPreview,
  receivePickup,
} from '@/services/pickupReceipt';
import {
  getReceiptPreviewFailureMessage,
  getReceiptPreviewFailureReason,
} from '@/services/receiptPreviewError';
import {
  canSubmitReceipt,
  getReceiptIneligibilityMessage,
  getReceiptStatusLabel,
} from '@/services/receiptEligibility';
import type {
  PickupReceiptPreview,
  PickupReceiptResult,
} from '@/services/pickupReceipt';

const PICKUP_QR_VERSION = 1;
const PICKUP_QR_TYPE = 'basurago-pickup';

function parsePickupQrPayload(data: string): string {
  if (data.length > 512) throw new Error('QR payload is too long.');
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    throw new Error('This is not a BasuraGo pickup QR code.');
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Pickup QR data has an invalid structure.');
  }
  const candidate = payload as Record<string, unknown>;
  if (candidate.v !== PICKUP_QR_VERSION || candidate.type !== PICKUP_QR_TYPE) {
    throw new Error('This pickup QR version or type is not supported.');
  }
  if (
    typeof candidate.pickupId !== 'string' ||
    !candidate.pickupId.trim() ||
    candidate.pickupId.length > 128 ||
    candidate.pickupId.includes('/') ||
    /\s/.test(candidate.pickupId)
  ) {
    throw new Error('Pickup QR data does not contain a valid pickup reference.');
  }
  return candidate.pickupId.trim();
}

function createDiagnosticId(): string {
  return `receipt-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

function getFirebaseErrorCode(error: unknown): string {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    typeof error.code !== 'string'
  ) return 'unknown';

  const code = error.code.replace(/^functions\//, '');
  return /^[a-z0-9-]+$/.test(code) ? code : 'unknown';
}

function formatReceiptTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(date);
}

function getReceiptError(error: unknown, previewFailure = false): string {
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

  if (code === 'failed-precondition' && previewFailure) {
    return getReceiptPreviewFailureMessage(
      getReceiptPreviewFailureReason(error),
    ) || message || 'This pickup is not eligible for facility receipt.';
  }
  if (code === 'failed-precondition') {
    return message || 'This pickup is not eligible for facility receipt.';
  }
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
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'network-request-failed'
  ) {
    return 'The receipt service could not be reached. The outcome may be uncertain; retrying is safe because the Backend preserves the first recorded receipt and weight.';
  }
  return 'Unable to record this facility receipt. Please try again.';
}

export default function PickupReceiptScreen() {
  const { status, dashboard } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [pickupId, setPickupId] = useState('');
  const [actualWeight, setActualWeight] = useState('');
  const [preview, setPreview] = useState<PickupReceiptPreview | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uncertainSubmission, setUncertainSubmission] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<PickupReceiptResult | null>(null);
  const requestInProgress = useRef(false);
  const previewRequestInProgress = useRef(false);
  const barcodeHandled = useRef(false);

  async function resolvePickup(candidateId: string) {
    const normalizedPickupId = candidateId.trim();
    if (previewRequestInProgress.current || requestInProgress.current) return;
    if (
      !normalizedPickupId ||
      normalizedPickupId.length > 128 ||
      normalizedPickupId.includes('/') ||
      /\s/.test(normalizedPickupId)
    ) {
      setError('Enter a valid pickup reference.');
      return;
    }

    previewRequestInProgress.current = true;
    setResolving(true);
    setError('');
    setScanError('');
    setUncertainSubmission(false);
    setPreview(null);
    setPickupId(normalizedPickupId);
    setActualWeight('');
    const diagnosticId = createDiagnosticId();
    try {
      let idTokenRefreshSucceeded = false;
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.getIdToken(true);
          idTokenRefreshSucceeded = true;
        } catch {
          idTokenRefreshSucceeded = false;
        }
      }
      console.info('[FacilityReceiptDiagnostics] preview attempt', {
        operation: 'getPickupReceiptPreviewFunction',
        diagnosticId,
        authCurrentUserPresent: auth.currentUser !== null,
        authContextAuthorized: status === 'authorized',
        idTokenRefreshSucceeded,
      });

      const result = await getPickupReceiptPreview(
        normalizedPickupId,
        diagnosticId,
      );
      setPreview(result);
    } catch (previewError) {
      console.error('[FacilityReceiptDiagnostics] preview failed', {
        operation: 'getPickupReceiptPreviewFunction',
        diagnosticId,
        code: getFirebaseErrorCode(previewError),
        reason: getReceiptPreviewFailureReason(previewError),
      });
      setError(getReceiptError(previewError, true));
      barcodeHandled.current = false;
    } finally {
      previewRequestInProgress.current = false;
      setResolving(false);
    }
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (barcodeHandled.current || resolving || submitting || receipt) return;
    barcodeHandled.current = true;
    setScanning(false);

    if (result.type !== 'qr') {
      setScanError('Scan a BasuraGo pickup QR code.');
      barcodeHandled.current = false;
      return;
    }

    try {
      void resolvePickup(parsePickupQrPayload(result.data));
    } catch (parseError) {
      setScanError(
        parseError instanceof Error
          ? parseError.message
          : 'Pickup QR data is invalid.',
      );
      barcodeHandled.current = false;
    }
  }

  async function handleReceive() {
    if (requestInProgress.current || previewRequestInProgress.current || receipt) return;
    const normalizedPickupId = pickupId.trim();
    const actualWeightKg = Number(actualWeight);
    if (!preview || preview.pickupId !== normalizedPickupId) {
      setError('Verify the pickup QR before recording a receipt.');
      return;
    }
    if (preview.alreadyReceived) {
      setError('This pickup already has a facility receipt.');
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
      setUncertainSubmission(false);
      setReceipt(result);
    } catch (receiptError) {
      console.error('Failed to record facility pickup receipt:', receiptError);
      setUncertainSubmission(
        [
          'unavailable',
          'deadline-exceeded',
          'network-request-failed',
        ].includes(getFirebaseErrorCode(receiptError)),
      );
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
    setPreview(null);
    setError('');
    setScanError('');
    setUncertainSubmission(false);
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
          Scan the rider&apos;s BasuraGo pickup QR. The Backend verifies that the
          pickup belongs to your facility before showing its details.
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
            <Text style={styles.label}>Receipt status</Text>
            <Text style={styles.value}>Completed — facility receipt confirmed</Text>
            <Text style={styles.label}>Receiving facility</Text>
            <Text style={styles.value}>
              {dashboard?.facilityName ?? 'Authorized facility'} ({receipt.facilityId})
            </Text>
            {dashboard?.facilityAddress ? (
              <Text style={styles.help}>{dashboard.facilityAddress}</Text>
            ) : null}
            {receipt.acceptedAmountCentavos !== null && receipt.currency === 'PHP' ? (
              <>
                <Text style={styles.label}>Accepted pickup price</Text>
                <Text style={styles.value}>
                  ₱{(receipt.acceptedAmountCentavos / 100).toFixed(2)}
                </Text>
                {receipt.pricingVersion ? (
                  <Text style={styles.help}>Pricing version {receipt.pricingVersion}</Text>
                ) : null}
                {typeof receipt.breakdown?.basePickupFeeCentavos === 'number' ? (
                  <Text style={styles.help}>
                    Base fee ₱{(receipt.breakdown.basePickupFeeCentavos / 100).toFixed(2)}
                  </Text>
                ) : null}
                {typeof receipt.breakdown?.distanceCentavos === 'number' &&
                receipt.breakdown.distanceCentavos > 0 ? (
                  <Text style={styles.help}>
                    {typeof receipt.breakdown.facilityTransportDistanceMeters === 'number'
                      ? `Facility transport · ${(receipt.breakdown.facilityTransportDistanceMeters / 1000).toFixed(2)} km · `
                      : typeof receipt.breakdown.riderDistanceMeters === 'number'
                        ? `Legacy Rider route · ${(receipt.breakdown.riderDistanceMeters / 1000).toFixed(2)} km · `
                        : 'Facility transport · '}
                    {typeof receipt.breakdown.facilityTransportTierIndex === 'number' ?
                      `tier ${receipt.breakdown.facilityTransportTierIndex + 1} · ` :
                      typeof receipt.breakdown.riderDistanceTierIndex === 'number' ?
                        `legacy tier ${receipt.breakdown.riderDistanceTierIndex + 1} · ` : ''}
                    ₱{(receipt.breakdown.distanceCentavos / 100).toFixed(2)}
                  </Text>
                ) : null}
                {typeof receipt.breakdown?.loadSurchargeCentavos === 'number' ? (
                  <Text style={styles.help}>
                    Load surcharge ₱{(receipt.breakdown.loadSurchargeCentavos / 100).toFixed(2)}
                  </Text>
                ) : null}
              </>
            ) : null}
            <Text style={styles.label}>Actual received weight</Text>
            <Text style={styles.value}>{receipt.actualWeightKg} kg</Text>
            <Text style={styles.label}>Estimated weight</Text>
            <Text style={styles.value}>{receipt.estimatedWeightKg} kg</Text>
            <Text style={styles.label}>Receipt time</Text>
            <Text style={styles.value}>
              {formatReceiptTime(receipt.receivedAt)}
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
            <Text style={styles.fieldLabel}>Pickup QR</Text>
            <Text style={styles.help}>
              Camera access is used only to scan the pickup reference. You can
              also enter the reference manually.
            </Text>

            {!preview && pickupId.trim() ? (
              <View style={styles.scannedIdBox}>
                <Text style={styles.scannedIdLabel}>Pickup reference</Text>
                <Text selectable style={styles.scannedIdValue}>
                  {pickupId.trim()}
                </Text>
              </View>
            ) : null}
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
                  onBarcodeScanned={handleBarcodeScanned}
                />
                <Text style={styles.cameraHint}>
                  Hold the BasuraGo pickup QR inside the camera view.
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
                setPreview(null);
                setActualWeight('');
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

            {!preview ? (
              <Pressable
                style={[styles.primaryButton, resolving && styles.disabledButton]}
                onPress={() => void resolvePickup(pickupId)}
                disabled={resolving || submitting || !pickupId.trim()}
                accessibilityRole="button"
              >
                {resolving ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Verifying pickup...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>Verify Pickup</Text>
                )}
              </Pressable>
            ) : (
              <View style={styles.previewCard}>
                <Text style={styles.successTitle}>
                  {preview.alreadyReceived ? 'Pickup Already Received' : 'Pickup Verified'}
                </Text>
                <Text style={styles.label}>Pickup reference</Text>
                <Text selectable style={styles.value}>{preview.pickupId}</Text>
                <Text style={styles.label}>Status</Text>
                <Text style={styles.value}>
                  {getReceiptStatusLabel(preview)}
                </Text>
                {getReceiptIneligibilityMessage(preview) ? (
                  <Text style={styles.error}>
                    {getReceiptIneligibilityMessage(preview)}
                  </Text>
                ) : null}
                <Text style={styles.label}>Receiving facility</Text>
                <Text style={styles.value}>
                  {dashboard?.facilityName ?? 'Authorized facility'} ({dashboard?.facilityId ?? 'ID unavailable'})
                </Text>
                {dashboard?.facilityAddress ? (
                  <Text style={styles.help}>{dashboard.facilityAddress}</Text>
                ) : null}
                {!preview.alreadyReceived &&
                preview.status === 'awaiting_facility_receipt' ? (
                  <Text style={styles.help}>
                    Rider collection is complete. Record the facility-measured
                    weight here to finalize the pickup.
                  </Text>
                ) : null}
                {!preview.alreadyReceived &&
                preview.status === 'completed' ? (
                  <Text style={styles.help}>
                    This is a supported legacy pickup. The Backend allows its
                    facility receipt to be recorded without changing the legacy
                    collection history.
                  </Text>
                ) : null}
                {preview.wasteTypeName ? (
                  <>
                    <Text style={styles.label}>Waste type</Text>
                    <Text style={styles.value}>{preview.wasteTypeName}</Text>
                  </>
                ) : null}
                {preview.items.map((item, index) => (
                  <View key={`${item.wasteTypeName}:${item.bagSizeLabel}:${index}`}>
                    <Text style={styles.label}>Waste item</Text>
                    <Text style={styles.value}>
                      {item.wasteTypeName} · {item.bagSizeLabel} × {item.quantity}
                    </Text>
                    <Text style={styles.help}>
                      {item.estimatedWeightKg} kg estimated
                    </Text>
                  </View>
                ))}
                {preview.acceptedAmountCentavos !== null && preview.currency === 'PHP' ? (
                  <>
                    <Text style={styles.label}>Accepted pickup price</Text>
                    <Text style={styles.value}>
                      ₱{(preview.acceptedAmountCentavos / 100).toFixed(2)}
                    </Text>
                    {preview.pricingVersion ? (
                      <Text style={styles.help}>
                        Pricing version {preview.pricingVersion}
                      </Text>
                    ) : null}
                    {typeof preview.breakdown?.basePickupFeeCentavos === 'number' ? (
                      <Text style={styles.help}>
                        Base fee ₱{(preview.breakdown.basePickupFeeCentavos / 100).toFixed(2)}
                      </Text>
                    ) : null}
                    {typeof preview.breakdown?.distanceCentavos === 'number' &&
                    preview.breakdown.distanceCentavos > 0 ? (
                      <Text style={styles.help}>
                       {typeof preview.breakdown.facilityTransportDistanceMeters === 'number'
                         ? `Facility transport · ${(preview.breakdown.facilityTransportDistanceMeters / 1000).toFixed(2)} km · `
                         : typeof preview.breakdown.riderDistanceMeters === 'number'
                           ? `Legacy Rider route · ${(preview.breakdown.riderDistanceMeters / 1000).toFixed(2)} km · `
                           : 'Facility transport · '}
                       {typeof preview.breakdown.facilityTransportTierIndex === 'number' ?
                         `tier ${preview.breakdown.facilityTransportTierIndex + 1} · ` :
                         typeof preview.breakdown.riderDistanceTierIndex === 'number' ?
                           `legacy tier ${preview.breakdown.riderDistanceTierIndex + 1} · ` : ''}
                       ₱{(preview.breakdown.distanceCentavos / 100).toFixed(2)}
                     </Text>
                    ) : null}
                    {typeof preview.breakdown?.loadSurchargeCentavos === 'number' ? (
                      <Text style={styles.help}>
                        Load surcharge ₱{(preview.breakdown.loadSurchargeCentavos / 100).toFixed(2)}
                      </Text>
                    ) : null}
                  </>
                ) : null}
                {preview.estimatedWeightKg !== null ? (
                  <>
                    <Text style={styles.label}>Estimated weight</Text>
                    <Text style={styles.value}>{preview.estimatedWeightKg} kg</Text>
                  </>
                ) : null}
                {preview.scheduledDate || preview.scheduledTime ? (
                  <>
                    <Text style={styles.label}>Scheduled</Text>
                    <Text style={styles.value}>
                      {preview.scheduledDate ?? 'Date not set'} · {preview.scheduledTime ?? 'Time not set'}
                    </Text>
                  </>
                ) : null}
                {preview.alreadyReceived ? (
                  <>
                    <Text style={styles.help}>
                      Actual facility-received weight:{' '}
                      {preview.actualWeightKg ?? 'unavailable'} kg. No second
                      receipt will be submitted.
                    </Text>
                    <Text style={styles.label}>Receipt time</Text>
                    <Text style={styles.value}>
                      {preview.receivedAt
                        ? formatReceiptTime(preview.receivedAt)
                        : 'Time unavailable'}
                    </Text>
                    <Pressable style={styles.secondaryButton} onPress={resetForm}>
                      <Text style={styles.secondaryButtonText}>Scan Another Pickup</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            )}

            {preview && canSubmitReceipt(preview) ? (
              <>
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
                  editable={!submitting && !uncertainSubmission}
                  accessibilityLabel="Actual received weight in kilograms"
                />
                {uncertainSubmission ? (
                  <Text style={styles.help}>
                    Keep the original weight while retrying. If the first request
                    succeeded, the Backend returns its original receipt without
                    changing accounting again.
                  </Text>
                ) : null}
              </>
            ) : null}

            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            {preview && canSubmitReceipt(preview) ? (
              <Pressable
                style={[
                  styles.primaryButton,
                  submitting && styles.disabledButton,
                ]}
                onPress={() => void handleReceive()}
                disabled={submitting || resolving}
                accessibilityRole="button"
              >
                {submitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      Recording receipt...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {uncertainSubmission
                      ? 'Retry Facility Receipt Safely'
                      : 'Confirm Facility Receipt'}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
      <FloatingTabBar />
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
    paddingBottom: 112,
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
  scannedIdBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E8F5EC',
    borderWidth: 1,
    borderColor: '#B7DEC2',
  },
  scannedIdLabel: {
    color: '#34483A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  scannedIdValue: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#F4F8F4',
    borderColor: '#DCE8DE',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    padding: 14,
  },
});
