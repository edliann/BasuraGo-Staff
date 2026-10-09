import { httpsCallable } from 'firebase/functions';

import { functions } from '@/services/firebase';

export interface PickupReceiptResult {
  success: true;
  alreadyReceived: boolean;
  pickupId: string;
  facilityId: string;
  staffUid: string;
  actualWeightKg: number;
  estimatedWeightKg: number;
  receivedAt: string;
  exceedsMaximumCapacity: boolean;
}

const receivePickupCallable = httpsCallable<
  { pickupId: string; actualWeightKg: number },
  PickupReceiptResult
>(functions, 'receivePickupFunction');

export async function receivePickup(
  pickupId: string,
  actualWeightKg: number,
): Promise<PickupReceiptResult> {
  const result = await receivePickupCallable({
    pickupId: pickupId.trim(),
    actualWeightKg,
  });
  return result.data;
}
