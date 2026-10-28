/**
 * NEON RIFT - Firebase Authentication & Cloud Firestore Integration
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MatchResults } from '../shared/types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting.');
    }
  }
}
testConnection();

export interface UserProfileData {
  id: string;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  totalMatches: number;
  wins: number;
  selectedCharacter: string;
  createdAt: string;
  updatedAt: string;
}

const GUEST_STORAGE_KEY = 'neon_rift_guest_profile';

export function getLocalGuestProfile(): UserProfileData {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
  const defaultProfile: UserProfileData = {
    id: guestId,
    displayName: 'CYBER_AGENT_' + Math.floor(100 + Math.random() * 900),
    avatar: 'avatar_1',
    level: 1,
    xp: 0,
    totalMatches: 0,
    wins: 0,
    selectedCharacter: 'vortex',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(defaultProfile));
  } catch (e) {}
  return defaultProfile;
}

export function saveLocalGuestProfile(profile: UserProfileData) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertUserProfile(profile: UserProfileData): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const docRef = doc(db, 'users', profile.id);
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordMatchCompletion(
  results: MatchResults,
  userId: string,
  profile: UserProfileData
): Promise<UserProfileData> {
  const playerResult = results.players.find(p => p.id === userId);
  const score = playerResult?.score || 0;
  const isWin = results.winner?.id === userId;
  const xpEarned = playerResult?.xpEarned || Math.floor(score * 1.5 + (isWin ? 200 : 50));

  const newXp = profile.xp + xpEarned;
  const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
  const updatedProfile: UserProfileData = {
    ...profile,
    level: newLevel,
    xp: newXp,
    totalMatches: profile.totalMatches + 1,
    wins: profile.wins + (isWin ? 1 : 0),
    updatedAt: new Date().toISOString()
  };

  // If authenticated, sync with Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await upsertUserProfile(updatedProfile);

      // Record match
      const matchDocPath = `matches/${results.matchId}_${userId}`;
      await setDoc(doc(db, 'matches', `${results.matchId}_${userId}`), {
        matchId: results.matchId,
        userId: userId,
        roomCode: results.roomCode,
        score: score,
        rank: playerResult?.rank || 8,
        crystalsCollected: playerResult?.crystalsCollected || 0,
        zonesCaptured: playerResult?.zonesCapturedSec || 0,
        character: playerResult?.character || 'vortex',
        xpEarned: xpEarned,
        createdAt: new Date().toISOString()
      });

      // Update leaderboard entry
      const lbPath = `leaderboard/${userId}`;
      await setDoc(doc(db, 'leaderboard', userId), {
        userId,
        displayName: updatedProfile.displayName,
        avatar: updatedProfile.avatar,
        score: updatedProfile.xp,
        wins: updatedProfile.wins,
        level: updatedProfile.level,
        period: 'all_time',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not sync match results to Firestore:', e);
    }
  } else {
    saveLocalGuestProfile(updatedProfile);
  }

  return updatedProfile;
}

export async function fetchLeaderboard(): Promise<any[]> {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(20));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push(d.data()));
    return list;
  } catch (error) {
    console.warn('Leaderboard fetch fallback to local:', error);
    return [];
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    return res.user;
  } catch (err) {
    console.error('Sign-in failed:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}
