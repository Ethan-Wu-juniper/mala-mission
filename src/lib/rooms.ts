import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { City, Player, Room, Submission } from "@/lib/types";

const ROOMS = "rooms";
const PLAYERS = "players";
const SUBMISSIONS = "submissions";

const roomDoc = (roomId: string) => doc(db, ROOMS, roomId);
const playersCol = (roomId: string) => collection(db, ROOMS, roomId, PLAYERS);
const playerDoc = (roomId: string, playerId: string) =>
  doc(db, ROOMS, roomId, PLAYERS, playerId);
const submissionsCol = (roomId: string) =>
  collection(db, ROOMS, roomId, SUBMISSIONS);
const submissionDoc = (roomId: string, playerId: string) =>
  doc(db, ROOMS, roomId, SUBMISSIONS, playerId);

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

export async function createRoom(
  capacity: number,
): Promise<{ roomId: string; playerIds: string[] }> {
  if (capacity < 2) throw new Error("人數至少要 2 人");
  const roomId = newId();
  const playerIds = Array.from({ length: capacity }, () => newId());

  const batch = writeBatch(db);
  batch.set(roomDoc(roomId), {
    capacity,
    status: "waiting",
    assignments: null,
    createdAt: serverTimestamp(),
  });
  for (const pid of playerIds) {
    batch.set(playerDoc(roomId, pid), {
      name: null,
      joinedAt: null,
    });
  }
  await batch.commit();
  return { roomId, playerIds };
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
  playerId: string,
): Promise<Player | null> {
  const snap = await getDoc(playerDoc(roomId, playerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Player, "id">) };
}

export async function joinPlayer(
  roomId: string,
  playerId: string,
  name: string,
): Promise<void> {
  await setDoc(
    playerDoc(roomId, playerId),
    { name: name.trim(), joinedAt: serverTimestamp() },
    { merge: true },
  );
}

function buildAssignments(
  playerIds: string[],
): Record<string, City> {
  const n = playerIds.length;
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
  playerIds.forEach((pid, idx) => {
    result[pid] = pool[idx];
  });
  return result;
}

export async function drawCards(roomId: string): Promise<void> {
  const playersSnap = await getDocs(playersCol(roomId));
  const players = playersSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Player, "id">),
  }));
  const allJoined = players.every((p) => p.joinedAt && p.name);
  if (!allJoined) throw new Error("還有人沒加入");

  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomDoc(roomId));
    if (!roomSnap.exists()) throw new Error("房間不存在");
    const data = roomSnap.data() as Omit<Room, "id">;
    if (data.status === "drawn") return;
    const assignments = buildAssignments(players.map((p) => p.id));
    tx.update(roomDoc(roomId), { status: "drawn", assignments });
  });
}

export async function submitRestaurant(
  roomId: string,
  playerId: string,
  payload: {
    city: City;
    restaurantName: string;
    dish: string;
    reason: string;
    mapsUrl: string | null;
  },
): Promise<void> {
  await setDoc(submissionDoc(roomId, playerId), {
    ...payload,
    submittedAt: serverTimestamp(),
  });
}
