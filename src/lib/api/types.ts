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
