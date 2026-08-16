export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  accessAllowed: boolean;
  hiredSince?: string; // ISO date
  location?: string;
}
