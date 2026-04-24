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
  nicknames: string[];
  joinedUids: string[];
  hostUid: string;
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
  mapsUrl: string;
  submittedAt: Timestamp;
}

export interface Vote {
  voterUid: string;
  allocations: Record<string, number>;
  finalized: boolean;
  updatedAt: Timestamp;
}
