import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { pickAnimals } from "@/lib/animals";
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
  const animals = pickAnimals(capacity);

  const batch = writeBatch(db);
  batch.set(roomDoc(roomId), {
    capacity,
    status: "waiting",
    assignments: null,
    playerIds,
    joinedCount: 0,
    createdAt: serverTimestamp(),
  });
  playerIds.forEach((pid, idx) => {
    batch.set(playerDoc(roomId, pid), {
      name: animals[idx],
      joinedAt: null,
    });
  });
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

export async function joinPlayer(
  roomId: string,
  playerId: string,
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const playerRef = playerDoc(roomId, playerId);
    const roomRef = roomDoc(roomId);

    const playerSnap = await tx.get(playerRef);
    const roomSnap = await tx.get(roomRef);

    if (!playerSnap.exists()) throw new Error("玩家不存在");
    if (!roomSnap.exists()) throw new Error("房間不存在");

    const player = playerSnap.data() as Omit<Player, "id">;
    if (player.joinedAt) return;

    const room = roomSnap.data() as Omit<Room, "id">;
    const newJoinedCount = (room.joinedCount ?? 0) + 1;

    tx.update(playerRef, { joinedAt: serverTimestamp() });

    const roomUpdates: Record<string, unknown> = {
      joinedCount: newJoinedCount,
    };
    if (
      newJoinedCount === room.capacity &&
      room.status === "waiting"
    ) {
      roomUpdates.status = "drawn";
      roomUpdates.assignments = buildAssignments(room.playerIds);
    }
    tx.update(roomRef, roomUpdates);
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
