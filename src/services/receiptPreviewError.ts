export type ReceiptPreviewFailureReason =
  | 'collection-not-complete'
  | 'collection-record-invalid'
  | 'receipt-data-inconsistent'
  | 'unknown-failed-precondition';

function getErrorCode(error: unknown): string {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    typeof error.code !== 'string'
  ) return '';

  return error.code.replace(/^functions\//, '');
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('message' in error) ||
    typeof error.message !== 'string'
  ) return '';

  return error.message;
}

export function getReceiptPreviewFailureReason(
  error: unknown,
): ReceiptPreviewFailureReason | null {
  if (getErrorCode(error) !== 'failed-precondition') return null;

  const message = getErrorMessage(error);
  if (message === 'This pickup must have completed collection before facility receipt.') {
    return 'collection-not-complete';
  }
  if (message === 'The pickup collection completion record is invalid.') {
    return 'collection-record-invalid';
  }
  if (
    message === 'This pickup has inconsistent receipt data.' ||
    message === 'This pickup has inconsistent facility receipt data.'
  ) {
    return 'receipt-data-inconsistent';
  }
  return 'unknown-failed-precondition';
}

export function getReceiptPreviewFailureMessage(
  reason: ReceiptPreviewFailureReason | null,
): string | null {
  switch (reason) {
    case 'collection-not-complete':
      return 'Collection is not confirmed complete yet. Ask the assigned Rider to complete collection, then refresh this preview.';
    case 'collection-record-invalid':
      return 'The collection completion record is incomplete or inconsistent. Do not record a receipt; ask an administrator to verify this pickup.';
    case 'receipt-data-inconsistent':
      return 'The pickup contains inconsistent receipt data. Do not submit another receipt; ask an administrator to review it.';
    case 'unknown-failed-precondition':
      return 'The pickup is not currently eligible for receipt. Ask an administrator to review its status before retrying.';
    default:
      return null;
  }
}
