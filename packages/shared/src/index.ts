export type ApiError = { error: string };

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type Workspace = {
  id: string;
  name: string;
  createdAt: string;
};

export type DirectThread = {
  id: string;
  workspaceId: string;
  userAId: string;
  userBId: string;
  createdAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type WsClientMessage =
  | { type: "subscribe.thread"; threadId: string }
  | { type: "unsubscribe.thread"; threadId: string };

export type WsServerMessage =
  | { type: "ready" }
  | { type: "message.created"; message: Message };

