export interface ReceiptEligibilityState {
  status: string;
  alreadyReceived: boolean;
}

export function canSubmitReceipt(preview: ReceiptEligibilityState): boolean {
  return !preview.alreadyReceived &&
    (
      preview.status === 'awaiting_facility_receipt' ||
      preview.status === 'completed'
    );
}

export function getReceiptStatusLabel(
  preview: ReceiptEligibilityState,
): string {
  if (preview.alreadyReceived) return 'Completed — facility receipt confirmed';
  if (preview.status === 'awaiting_facility_receipt') {
    return 'Awaiting facility receipt';
  }
  if (preview.status === 'completed') {
    return 'Legacy pickup awaiting facility receipt';
  }

  const status = preview.status.replace(/_/g, ' ') || 'unknown status';
  return `Not eligible for facility receipt (${status})`;
}

export function getReceiptIneligibilityMessage(
  preview: ReceiptEligibilityState,
): string | null {
  if (preview.alreadyReceived || canSubmitReceipt(preview)) return null;

  return 'The current pickup status is not eligible for receipt. Ask the Rider or an administrator to verify collection completion before recording a facility receipt.';
}
