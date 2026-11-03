import { httpsCallable } from 'firebase/functions';

import { functions } from '@/services/firebase';

export interface PickupReceiptPreview {
  pickupId: string;
  status: string;
  wasteTypeName: string | null;
  items: {
    wasteTypeName: string;
    bagSizeLabel: string;
    quantity: number;
    estimatedWeightKg: number;
  }[];
  acceptedAmountCentavos: number | null;
  currency: string | null;
  pricingVersion: string | null;
  breakdown: Record<string, unknown> | null;
  estimatedWeightKg: number | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  alreadyReceived: boolean;
  actualWeightKg: number | null;
  receivedAt: string | null;
}

export interface PickupReceiptResult {
  success: true;
  alreadyReceived: boolean;
  pickupId: string;
  facilityId: string;
  staffUid: string;
  actualWeightKg: number;
  estimatedWeightKg: number;
  acceptedAmountCentavos: number | null;
  currency: string | null;
  pricingVersion: string | null;
  breakdown: Record<string, unknown> | null;
  receivedAt: string;
  exceedsMaximumCapacity: boolean;
}

const pickupReceiptPreviewCallable = httpsCallable<
  { pickupId: string; diagnosticId: string },
  PickupReceiptPreview
>(functions, 'getPickupReceiptPreviewFunction');

const receivePickupCallable = httpsCallable<
  { pickupId: string; actualWeightKg: number },
  PickupReceiptResult
>(functions, 'receivePickupFunction');

function isPickupReceiptResult(value: unknown): value is PickupReceiptResult {
  if (typeof value !== 'object' || value === null) return false;
  const receipt = value as Record<string, unknown>;
  const isNullableNumber = (entry: unknown) =>
    entry === null || (
      typeof entry === 'number' && Number.isFinite(entry)
    );
  const isNullableString = (entry: unknown) =>
    entry === null || typeof entry === 'string';
  const isNullableObject = (entry: unknown) =>
    entry === null || (
      typeof entry === 'object' && !Array.isArray(entry)
    );

  return receipt.success === true &&
    typeof receipt.alreadyReceived === 'boolean' &&
    typeof receipt.pickupId === 'string' &&
    typeof receipt.facilityId === 'string' &&
    typeof receipt.staffUid === 'string' &&
    typeof receipt.actualWeightKg === 'number' &&
    Number.isFinite(receipt.actualWeightKg) &&
    receipt.actualWeightKg > 0 &&
    typeof receipt.estimatedWeightKg === 'number' &&
    Number.isFinite(receipt.estimatedWeightKg) &&
    isNullableNumber(receipt.acceptedAmountCentavos) &&
    isNullableString(receipt.currency) &&
    isNullableString(receipt.pricingVersion) &&
    isNullableObject(receipt.breakdown) &&
    typeof receipt.receivedAt === 'string' &&
    Number.isFinite(Date.parse(receipt.receivedAt)) &&
    typeof receipt.exceedsMaximumCapacity === 'boolean';
}

export async function getPickupReceiptPreview(
  pickupId: string,
  diagnosticId: string,
): Promise<PickupReceiptPreview> {
  const result = await pickupReceiptPreviewCallable({
    pickupId: pickupId.trim(),
    diagnosticId,
  });
  return result.data;
}

export async function receivePickup(
  pickupId: string,
  actualWeightKg: number,
): Promise<PickupReceiptResult> {
  const normalizedPickupId = pickupId.trim();
  const result = await receivePickupCallable({
    pickupId: normalizedPickupId,
    actualWeightKg,
  });
  const receipt: unknown = result.data;
  if (
    !isPickupReceiptResult(receipt) ||
    receipt.pickupId !== normalizedPickupId ||
    !receipt.facilityId.trim()
  ) {
    throw new Error('The Backend did not confirm the facility receipt.');
  }
  return receipt;
}
