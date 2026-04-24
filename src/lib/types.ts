import type { Timestamp } from "firebase/firestore";

export type City = "sichuan" | "chongqing";

export const CITY_LABEL: Record<City, string> = {
  sichuan: "四川",
  chongqing: "重慶",
};

export type RoomStatus = "waiting" | "drawn";

export interface Room {
  id: string;
  capacity: number;
  status: RoomStatus;
  assignments: Record<string, City> | null;
  playerIds: string[];
  joinedCount: number;
  createdAt: Timestamp;
}

export interface Player {
  id: string;
  name: string | null;
  joinedAt: Timestamp | null;
}

export interface Submission {
  playerId: string;
  city: City;
  restaurantName: string;
  dish: string;
  reason: string;
  mapsUrl: string | null;
  submittedAt: Timestamp;
}
