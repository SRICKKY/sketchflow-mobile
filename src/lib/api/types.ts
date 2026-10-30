export interface PublicUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: string;
  hasPassword: boolean;
}

export interface SessionResponse {
  user: PublicUser | null;
}

export interface AuthResponse {
  user: PublicUser;
}

export type BoardRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type BoardScope = 'owned' | 'shared';

export interface BoardSummary {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string | null;
  workspaceId: string | null;
  role: BoardRole;
  createdAt: string;
  updatedAt: string;
  elementCount: number;
}

export interface BoardPage {
  items: BoardSummary[];
  nextCursor: string | null;
}

export interface DashboardResponse {
  capabilities: {
    isPro: boolean;
    ownedBoards: number;
    maxOwnedBoards: number | null;
    canCreateBoard: boolean;
    canSaveTemplates: boolean;
  };
  workspaces: {
    id: string;
    name: string;
    slug: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
  }[];
}
