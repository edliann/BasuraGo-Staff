import {
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import { auth, functions } from '@/services/firebase';

export interface FacilityStaffDashboard {
  staffName: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  facilityStatus: 'active';
}

type DashboardResponse = FacilityStaffDashboard;

const getDashboardCallable = httpsCallable<
  Record<string, never>,
  DashboardResponse
>(functions, 'getFacilityStaffDashboardFunction');

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  return credential.user;
}

export async function getAuthorizedDashboard(): Promise<FacilityStaffDashboard> {
  const result = await getDashboardCallable({});
  return result.data;
}

export interface FacilityOperationsDashboard {
  facility: {
    name: string;
    address: string;
    status: 'active' | 'inactive';
    maxCapacityKg: number | null;
    occupiedCapacityKg: number | null;
    reservedCapacityKg: number | null;
    availableCapacityKg: number | null;
    capacityAccountingReady: boolean;
    capacityAccountingReconciledAt: string | null;
    acceptedWasteTypeIds: string[];
    acceptedWasteTypes: { id: string; name: string }[];
  };
  receivedTodayKg: number;
  receivedTodayCount: number;
  receiptCount30Days: number;
  receiptWindowDays: number;
  receiptWindowTruncated: boolean;
  recentReceipts: {
    id: string;
    wasteTypeId: string;
    wasteTypeIds: string[];
    wasteTypeName: string;
    wasteTypeNames: string[];
    actualWeightKg: number;
    receivedAt: string;
    status: string;
  }[];
  wasteTypeBreakdown30Days: {
    wasteTypeId: string;
    wasteTypeIds: string[];
    wasteTypeName: string;
    weightKg: number;
    count: number;
  }[];
}

const getOperationsDashboardCallable = httpsCallable<
  Record<string, never>,
  FacilityOperationsDashboard
>(functions, 'getFacilityOperationsDashboardFunction');

export async function getFacilityOperationsDashboard(): Promise<FacilityOperationsDashboard> {
  const result = await getOperationsDashboardCallable({});
  return result.data;
}

export async function signOutStaff(): Promise<void> {
  await signOut(auth);
}
