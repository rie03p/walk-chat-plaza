export interface User {
  id: string;
  x: number;
  y: number;
  name: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface UserState {
  id: string;
  x: number;
  y: number;
}

export type ServerMessage =
  | { type: "init"; userId: string; x: number; y: number; users: UserState[] }
  | { type: "join"; userId: string; x: number; y: number }
  | { type: "leave"; userId: string }
  | { type: "move"; userId: string; x: number; y: number }
  | { type: "chat"; userId: string; message: string };

export type ClientMessage =
  | { type: "move"; x: number; y: number }
  | { type: "chat"; message: string };
