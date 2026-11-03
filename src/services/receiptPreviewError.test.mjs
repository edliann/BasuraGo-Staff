import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  getReceiptPreviewFailureMessage,
  getReceiptPreviewFailureReason,
} from './receiptPreviewError.ts';

test('classifies preview collection state preconditions without logging details', () => {
  assert.equal(
    getReceiptPreviewFailureReason({
      code: 'functions/failed-precondition',
      message: 'This pickup must have completed collection before facility receipt.',
    }),
    'collection-not-complete',
  );
  assert.match(
    getReceiptPreviewFailureMessage('collection-not-complete') ?? '',
    /assigned Rider to complete collection/,
  );
});

test('classifies invalid collection and receipt records', () => {
  assert.equal(
    getReceiptPreviewFailureReason({
      code: 'failed-precondition',
      message: 'The pickup collection completion record is invalid.',
    }),
    'collection-record-invalid',
  );
  assert.equal(
    getReceiptPreviewFailureReason({
      code: 'failed-precondition',
      message: 'This pickup has inconsistent receipt data.',
    }),
    'receipt-data-inconsistent',
  );
  assert.equal(
    getReceiptPreviewFailureReason({
      code: 'failed-precondition',
      message: 'This pickup has inconsistent facility receipt data.',
    }),
    'receipt-data-inconsistent',
  );
});

test('does not expose arbitrary server messages as diagnostic reasons', () => {
  assert.equal(
    getReceiptPreviewFailureReason({
      code: 'failed-precondition',
      message: 'Private or unexpected detail',
    }),
    'unknown-failed-precondition',
  );
  assert.equal(
    getReceiptPreviewFailureReason({
      code: 'permission-denied',
      message: 'Not authorized',
    }),
    null,
  );
  assert.match(
    getReceiptPreviewFailureMessage('unknown-failed-precondition') ?? '',
    /ask an administrator/i,
  );
});
