import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { pickNicknames } from "@/lib/nicknames";
import type { City, Player, Room, Submission, Vote } from "@/lib/types";

const ROOMS = "rooms";
const PLAYERS = "players";
const SUBMISSIONS = "submissions";
const VOTES = "votes";

const roomDoc = (roomId: string) => doc(db, ROOMS, roomId);
const playersCol = (roomId: string) => collection(db, ROOMS, roomId, PLAYERS);
const playerDoc = (roomId: string, uid: string) =>
  doc(db, ROOMS, roomId, PLAYERS, uid);
const submissionDoc = (roomId: string, uid: string) =>
  doc(db, ROOMS, roomId, SUBMISSIONS, uid);
const submissionsCol = (roomId: string) =>
  collection(db, ROOMS, roomId, SUBMISSIONS);
const votesCol = (roomId: string) => collection(db, ROOMS, roomId, VOTES);
const voteDoc = (roomId: string, uid: string) =>
  doc(db, ROOMS, roomId, VOTES, uid);

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

function buildAssignments(uids: string[]): Record<string, City> {
  const n = uids.length;
  const half = Math.floor(n / 2);
  const sichuanCount = n % 2 === 0 ? half : half + (Math.random() < 0.5 ? 1 : 0);
  const chongqingCount = n - sichuanCount;
  const pool: City[] = [
    ...Array(sichuanCount).fill("sichuan"),
    ...Array(chongqingCount).fill("chongqing"),
  ];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const result: Record<string, City> = {};
  uids.forEach((uid, idx) => {
    result[uid] = pool[idx];
  });
  return result;
}

export async function createRoom(
  capacity: number,
  hostUid: string,
  hostPhotoURL?: string | null,
  title?: string,
): Promise<{ roomId: string }> {
  if (capacity < 2) throw new Error("人數至少要 2 人");
  const roomId = newId();
  const nicknames = pickNicknames(capacity);

  await runTransaction(db, async (tx) => {
    tx.set(roomDoc(roomId), {
      title: title || "",
      capacity,
      status: "waiting",
      assignments: null,
      nicknames,
      joinedUids: [hostUid],
      hostUid,
      createdAt: serverTimestamp(),
    });
    tx.set(playerDoc(roomId, hostUid), {
      uid: hostUid,
      name: nicknames[0],
      photoURL: hostPhotoURL ?? null,
      joinedAt: serverTimestamp(),
    });
  });

  return { roomId };
}

export async function joinRoom(roomId: string, uid: string, photoURL?: string | null): Promise<void> {
  await runTransaction(db, async (tx) => {
    const playerRef = playerDoc(roomId, uid);
    const roomRef = roomDoc(roomId);

    const playerSnap = await tx.get(playerRef);
    const roomSnap = await tx.get(roomRef);

    if (!roomSnap.exists()) throw new Error("房間不存在");
    if (playerSnap.exists()) return; // already joined — idempotent

    const room = roomSnap.data() as Omit<Room, "id">;
    const uids = room.joinedUids ?? [];
    if (uids.length >= room.capacity) throw new Error("房間已滿");

    const newUids = [...uids, uid];
    const nickname = room.nicknames[newUids.length - 1];

    tx.set(playerRef, {
      uid,
      name: nickname,
      photoURL: photoURL ?? null,
      joinedAt: serverTimestamp(),
    });

    const roomUpdates: Record<string, unknown> = { joinedUids: newUids };
    if (newUids.length === room.capacity && room.status === "waiting") {
      roomUpdates.status = "drawn";
      roomUpdates.assignments = buildAssignments(newUids);
    }
    tx.update(roomRef, roomUpdates);
  });
}

export function subscribeRoom(
  roomId: string,
  cb: (room: Room | null) => void,
): Unsubscribe {
  return onSnapshot(roomDoc(roomId), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb({ id: snap.id, ...(snap.data() as Omit<Room, "id">) });
  });
}

export function subscribePlayers(
  roomId: string,
  cb: (players: Player[]) => void,
): Unsubscribe {
  return onSnapshot(playersCol(roomId), (snap) => {
    const players = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Player, "id">),
    }));
    cb(players);
  });
}

export function subscribeSubmissions(
  roomId: string,
  cb: (subs: Submission[]) => void,
): Unsubscribe {
  return onSnapshot(submissionsCol(roomId), (snap) => {
    const subs = snap.docs.map(
      (d) => ({ playerId: d.id, ...(d.data() as Omit<Submission, "playerId">) }),
    );
    cb(subs);
  });
}

export async function getPlayer(
  roomId: string,
  uid: string,
): Promise<Player | null> {
  const snap = await getDoc(playerDoc(roomId, uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Player, "id">) };
}

export async function listMyRooms(uid: string): Promise<Room[]> {
  const playerSnap = await getDocs(
    query(collectionGroup(db, PLAYERS), where("uid", "==", uid)),
  );
  const roomIds = playerSnap.docs
    .map((d) => d.ref.parent.parent?.id)
    .filter((id): id is string => Boolean(id));

  const roomSnaps = await Promise.all(
    roomIds.map((id) => getDoc(roomDoc(id))),
  );
  return roomSnaps
    .filter((s) => s.exists())
    .map((s) => ({ id: s.id, ...(s.data() as Omit<Room, "id">) }))
    .sort((a, b) => {
      const at = a.createdAt?.toMillis?.() ?? 0;
      const bt = b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    });
}

export async function submitRestaurant(
  roomId: string,
  uid: string,
  payload: {
    city: City;
    restaurantName: string;
    dish: string;
    mapsUrl: string;
  },
): Promise<void> {
  await setDoc(submissionDoc(roomId, uid), {
    ...payload,
    submittedAt: serverTimestamp(),
  });
}

export function subscribeVotes(
  roomId: string,
  cb: (votes: Vote[]) => void,
): Unsubscribe {
  return onSnapshot(votesCol(roomId), (snap) => {
    cb(snap.docs.map((d) => d.data() as Vote));
  });
}

export async function setMyVote(
  roomId: string,
  voterUid: string,
  allocations: Record<string, number>,
): Promise<void> {
  await setDoc(voteDoc(roomId, voterUid), {
    voterUid,
    allocations,
    finalized: false,
    updatedAt: serverTimestamp(),
  });
}

export async function finalizeVote(
  roomId: string,
  voterUid: string,
  allocations: Record<string, number>,
): Promise<void> {
  await setDoc(voteDoc(roomId, voterUid), {
    voterUid,
    allocations,
    finalized: true,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRoom(roomId: string, uid: string): Promise<void> {
  const snap = await getDoc(roomDoc(roomId));
  if (!snap.exists()) return;
  const room = snap.data() as Omit<Room, "id">;
  if (room.hostUid !== uid) throw new Error("只有房主可以刪除房間");

  const subcollections = [PLAYERS, SUBMISSIONS, VOTES] as const;
  for (const sub of subcollections) {
    const colSnap = await getDocs(collection(db, ROOMS, roomId, sub));
    await Promise.all(colSnap.docs.map((d) => deleteDoc(d.ref)));
  }
  await deleteDoc(roomDoc(roomId));
}

export async function setSchedule(
  roomId: string,
  playerId: string,
  scheduledAt: string,
): Promise<void> {
  await updateDoc(submissionDoc(roomId, playerId), { scheduledAt });
}
