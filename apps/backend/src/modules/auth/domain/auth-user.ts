export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  phoneNumber?: string | undefined;
  photoURL?: string | undefined;
}

export interface NewAuthUser {
  email: string;
  emailVerified: boolean;
  displayName: string;
  phoneNumber?: string | undefined;
  photoURL?: string | undefined;
}
