import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  canSubmitReceipt,
  getReceiptIneligibilityMessage,
  getReceiptStatusLabel,
} from './receiptEligibility.ts';

test('eligible receipt states expose the weight-entry action', () => {
  assert.equal(
    canSubmitReceipt({
      status: 'awaiting_facility_receipt',
      alreadyReceived: false,
    }),
    true,
  );
  assert.equal(
    canSubmitReceipt({status: 'completed', alreadyReceived: false}),
    true,
  );
});

test('recorded or ineligible receipts do not expose the weight-entry action', () => {
  assert.equal(
    canSubmitReceipt({status: 'completed', alreadyReceived: true}),
    false,
  );
  assert.equal(
    canSubmitReceipt({status: 'in_progress', alreadyReceived: false}),
    false,
  );
});

test('only completed legacy pickups receive the legacy status label', () => {
  assert.equal(
    getReceiptStatusLabel({status: 'completed', alreadyReceived: false}),
    'Legacy pickup awaiting facility receipt',
  );
  assert.equal(
    getReceiptStatusLabel({status: 'in_progress', alreadyReceived: false}),
    'Not eligible for facility receipt (in progress)',
  );
});

test('ineligible pickup status includes an actionable explanation', () => {
  assert.match(
    getReceiptIneligibilityMessage({
      status: 'in_progress',
      alreadyReceived: false,
    }) ?? '',
    /verify collection completion/i,
  );
  assert.equal(
    getReceiptIneligibilityMessage({
      status: 'awaiting_facility_receipt',
      alreadyReceived: false,
    }),
    null,
  );
});
