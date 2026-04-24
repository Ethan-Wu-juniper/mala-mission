import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { pickNicknames } from "@/lib/nicknames";
import type { City, Player, Room, Submission } from "@/lib/types";

const ROOMS = "rooms";
const PLAYERS = "players";
const SUBMISSIONS = "submissions";

const roomDoc = (roomId: string) => doc(db, ROOMS, roomId);
const playersCol = (roomId: string) => collection(db, ROOMS, roomId, PLAYERS);
const playerDoc = (roomId: string, uid: string) =>
  doc(db, ROOMS, roomId, PLAYERS, uid);
const submissionDoc = (roomId: string, uid: string) =>
  doc(db, ROOMS, roomId, SUBMISSIONS, uid);
const submissionsCol = (roomId: string) =>
  collection(db, ROOMS, roomId, SUBMISSIONS);

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
): Promise<{ roomId: string }> {
  if (capacity < 2) throw new Error("人數至少要 2 人");
  const roomId = newId();
  const nicknames = pickNicknames(capacity);

  await runTransaction(db, async (tx) => {
    tx.set(roomDoc(roomId), {
      capacity,
      status: "waiting",
      assignments: null,
      nicknames,
      joinedUids: [hostUid],
      hostUid,
      createdAt: serverTimestamp(),
    });
    tx.set(playerDoc(roomId, hostUid), {
      name: nicknames[0],
      joinedAt: serverTimestamp(),
    });
  });

  return { roomId };
}

export async function joinRoom(roomId: string, uid: string): Promise<void> {
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
      name: nickname,
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
