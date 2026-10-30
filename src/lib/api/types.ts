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

export interface CanvasElement {
  id: string;
  type:
    | 'rectangle'
    | 'ellipse'
    | 'diamond'
    | 'line'
    | 'arrow'
    | 'freehand'
    | 'text'
    | 'image'
    | 'note'
    | 'frame'
    | 'embed';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  opacity: number;
  fillStyle: 'solid' | 'hachure' | 'cross-hatch' | 'none';
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  seed: number;
  groupId: string | null;
  frameId?: string | null;
  zIndex: number;
  locked: boolean;
  text?: string;
  fontSize?: number;
  [key: string]: unknown;
}

export interface BoardDetail {
  id: string;
  name: string;
  workspaceName: string | null;
  ownerId: string;
  role: BoardRole;
  updatedAt: string;
  createdAt: string;
  elements: CanvasElement[];
  presentation?: unknown;
  revision: number;
}

export interface PatchElementsRequest {
  baseRevision: number;
  clientOperationId: string;
  upserts: CanvasElement[];
  deletedIds: string[];
}

export interface PatchElementsResponse {
  revision: number;
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
