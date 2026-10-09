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

export async function signOutStaff(): Promise<void> {
  await signOut(auth);
}
