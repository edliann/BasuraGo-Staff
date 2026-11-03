import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getFacilityOperationsDashboard,
  type FacilityOperationsDashboard as FacilityOperationsData,
} from '@/services/facilityStaff';

const REFRESH_INTERVAL_MS = 30_000;

function formatKg(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}

function formatReceivedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(date);
}

export default function FacilityOperationsDashboard() {
  const [data, setData] = useState<FacilityOperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const refreshInProgress = useRef(false);
  const mounted = useRef(true);

  const refresh = useCallback(async (initial = false) => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await getFacilityOperationsDashboard();
      if (!mounted.current) return;
      setData(result);
      setError('');
    } catch (refreshError) {
      console.error('Unable to refresh facility operations:', refreshError);
      if (mounted.current) {
        setError('Facility operations could not be refreshed. Check your connection and retry.');
      }
    } finally {
      refreshInProgress.current = false;
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(() => refresh(true));
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  if (loading && !data) {
    return (
      <View style={styles.stateCard} accessibilityRole="progressbar">
        <ActivityIndicator color="#176B3A" />
        <Text style={styles.stateText}>Loading facility operations…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.cardTitle}>Facility operations unavailable</Text>
        <Text style={styles.body}>{error || 'No facility data is available.'}</Text>
        <Pressable onPress={() => void refresh(true)} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { facility } = data;
  const usedCapacity = (facility.occupiedCapacityKg ?? 0) + (facility.reservedCapacityKg ?? 0);
  const utilization = facility.capacityAccountingReady && facility.maxCapacityKg
    ? Math.min(100, Math.max(0, (usedCapacity / facility.maxCapacityKg) * 100))
    : 0;
  const capacityWarning = facility.capacityAccountingReady && (facility.availableCapacityKg ?? 0) < 0;
  const maxBreakdown = Math.max(...data.wasteTypeBreakdown30Days.map((item) => item.weightKg), 0);

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Facility operations</Text>
          <Text style={styles.sectionHint}>Updates automatically every 30 seconds</Text>
        </View>
        <Pressable onPress={() => void refresh()} disabled={refreshing} accessibilityRole="button" accessibilityLabel="Refresh facility operations" style={styles.refreshButton}>
          <Text style={styles.refreshText}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorBanner} accessibilityRole="alert">{error} Showing the last confirmed data.</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>CAPACITY</Text>
        {!facility.capacityAccountingReady ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Capacity unavailable</Text>
            <Text style={styles.body}>Capacity accounting is pending reconciliation or contains invalid values. Ask an administrator to review the facility.</Text>
          </View>
        ) : (
          <>
            <View style={styles.metricGrid}>
              <Metric label="Maximum" value={formatKg(facility.maxCapacityKg)} />
              <Metric label="Occupied" value={formatKg(facility.occupiedCapacityKg)} />
              <Metric label="Reserved" value={formatKg(facility.reservedCapacityKg)} />
              <Metric label="Available" value={formatKg(facility.availableCapacityKg)} />
            </View>
            <View
              style={styles.progressTrack}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel="Facility capacity utilization"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(utilization) }}
            >
              <View style={[styles.progressFill, { width: `${utilization}%` }, capacityWarning && styles.progressOverLimit]} />
            </View>
            <Text style={styles.progressCaption}>{Math.round(utilization)}% utilized (occupied plus reserved)</Text>
            {capacityWarning ? <Text style={styles.warningText}>Recorded capacity exceeds the configured maximum. Contact an administrator.</Text> : null}
          </>
        )}
        <Text style={styles.acceptedLabel}>Accepted waste types</Text>
        <Text style={styles.body}>
          {facility.acceptedWasteTypes.length
            ? facility.acceptedWasteTypes.map((item) => item.name).join(', ')
            : 'No accepted waste types are configured.'}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.cardEyebrow}>RECEIVED TODAY</Text>
          <Text style={styles.summaryValue}>
            {data.receiptWindowTruncated ? '≥' : ''}{formatKg(data.receivedTodayKg)}
          </Text>
        </View>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.cardEyebrow}>COMPLETED RECEIPTS</Text>
          <Text style={styles.summaryValue}>
            {data.receiptWindowTruncated ? '≥' : ''}{data.receivedTodayCount}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Waste received by type</Text>
        <Text style={styles.sectionHint}>Measured weights from the last {data.receiptWindowDays} days</Text>
        {data.wasteTypeBreakdown30Days.length ? data.wasteTypeBreakdown30Days.map((item) => (
          <View key={item.wasteTypeId} style={styles.breakdownItem}>
            <View style={styles.breakdownLabels}>
              <Text style={styles.breakdownName}>{item.wasteTypeName}</Text>
              <Text style={styles.breakdownValue}>{formatKg(item.weightKg)} · {item.count} receipts</Text>
            </View>
            <View
              style={styles.progressTrack}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`${item.wasteTypeName} received weight`}
              accessibilityValue={{
                min: 0,
                max: maxBreakdown,
                now: item.weightKg,
              }}
            >
              <View style={[styles.progressFill, { width: `${maxBreakdown ? Math.max(4, item.weightKg / maxBreakdown * 100) : 0}%` }]} />
            </View>
          </View>
        )) : <Text style={styles.emptyText}>No measured receipts in this period.</Text>}
        <Text style={styles.sectionHint}>
          Actual weight is recorded per pickup. Mixed-type receipts are grouped
          by their selected types because no per-type weight split is recorded.
        </Text>
        {data.receiptWindowTruncated ? <Text style={styles.warningText}>This chart is based on the 1,000 most recent receipts in the period.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent waste drop-offs</Text>
        {data.recentReceipts.length ? data.recentReceipts.map((receipt) => (
          <View key={receipt.id} style={styles.receiptRow}>
            <View style={styles.receiptCopy}>
              <Text style={styles.breakdownName}>{receipt.wasteTypeName}</Text>
              <Text style={styles.sectionHint}>{formatReceivedAt(receipt.receivedAt)}</Text>
              <Text style={styles.sectionHint}>Pickup {receipt.id} · {receipt.status}</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatKg(receipt.actualWeightKg)}</Text>
          </View>
        )) : <Text style={styles.emptyText}>No facility receipts have been recorded in the last {data.receiptWindowDays} days.</Text>}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Segregation records unavailable</Text>
        <Text style={styles.body}>This system records received waste by type and measured weight. It does not currently record segregation activity, so no segregation results are shown.</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: '#1B2E21', fontSize: 18, fontWeight: '800' },
  sectionHint: { marginTop: 4, color: '#7A877D', fontSize: 11, lineHeight: 16 },
  refreshButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EAF5EC' },
  refreshText: { color: '#176B3A', fontSize: 12, fontWeight: '800' },
  card: { marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#E0E8E1', borderRadius: 18, backgroundColor: '#FFFFFF' },
  cardEyebrow: { color: '#77867A', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { color: '#1B2E21', fontSize: 15, fontWeight: '800' },
  body: { marginTop: 6, color: '#66736A', fontSize: 12, lineHeight: 18 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  metric: { width: '50%', paddingVertical: 9 },
  metricLabel: { color: '#78867B', fontSize: 10, fontWeight: '600' },
  metricValue: { marginTop: 3, color: '#17271D', fontSize: 15, fontWeight: '800' },
  progressTrack: { height: 8, overflow: 'hidden', marginTop: 10, borderRadius: 99, backgroundColor: '#E8EFE9' },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: '#238447' },
  progressOverLimit: { backgroundColor: '#B42318' },
  progressCaption: { marginTop: 6, color: '#66736A', fontSize: 10 },
  warningText: { marginTop: 8, color: '#A34100', fontSize: 11, lineHeight: 16 },
  acceptedLabel: { marginTop: 15, color: '#78867B', fontSize: 10, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1 },
  summaryValue: { marginTop: 8, color: '#17271D', fontSize: 17, fontWeight: '800' },
  breakdownItem: { marginTop: 14 },
  breakdownLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  breakdownName: { flex: 1, color: '#26382B', fontSize: 12, fontWeight: '700' },
  breakdownValue: { color: '#176B3A', fontSize: 11, fontWeight: '800' },
  emptyText: { marginTop: 12, color: '#758178', fontSize: 12, lineHeight: 18 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2EE' },
  receiptCopy: { flex: 1 },
  notice: { marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: '#F0F6F1' },
  noticeTitle: { color: '#26382B', fontSize: 12, fontWeight: '800' },
  stateCard: { alignItems: 'center', gap: 10, marginTop: 18, padding: 20, borderRadius: 18, backgroundColor: '#FFFFFF' },
  stateText: { color: '#66736A', fontSize: 12 },
  retry: { marginTop: 8, padding: 10 },
  retryText: { color: '#176B3A', fontWeight: '800' },
  errorBanner: { marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#FFF5F4', color: '#912018', fontSize: 12, lineHeight: 18 },
});
