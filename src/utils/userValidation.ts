import type { User } from '../types/User';

export type FormErrors = Partial<Record<keyof User, string>>;

export const getEmailValidationError = (
  email: string,
  existingUsers: User[] = [],
  ignoredUid?: string,
): string | undefined => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return 'Email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return 'Email is invalid.';
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  const duplicateUser = existingUsers.find(
    (existingUser) =>
      existingUser.uid !== ignoredUid &&
      existingUser.email.trim().toLowerCase() === normalizedEmail,
  );

  return duplicateUser ? 'Email already exists.' : undefined;
};

export const getPhoneValidationError = (phoneNumber: string): string | undefined => {
  const trimmedPhone = phoneNumber.trim();

  if (!trimmedPhone) {
    return 'Phone number is required.';
  }

  if (!/^\+?\d+(\s\d+)*$/.test(trimmedPhone)) {
    return 'Phone number must contain only numbers, optional + at start, and single spaces between numbers.';
  }

  return undefined;
};

export const normalizeUser = (user: User): User => ({
  uid: user.uid.trim(),
  firstName: user.firstName.trim(),
  lastName: user.lastName.trim(),
  username: user.username.trim(),
  email: user.email.trim(),
  phoneNumber: user.phoneNumber.trim(),
  accessAllowed: user.accessAllowed,
  hiredSince: user.hiredSince ? new Date(user.hiredSince).toISOString() : '',
  location: user.location?.trim() ?? '',
});

export const validateUser = (
  user: User,
  existingUsers: User[] = [],
  ignoredUid?: string,
): FormErrors => {
  const errors: FormErrors = {};

  if (!user.firstName.trim()) errors.firstName = 'First name is required.';
  if (!user.lastName.trim()) errors.lastName = 'Last name is required.';

  const emailError = getEmailValidationError(user.email, existingUsers, ignoredUid);
  if (emailError) errors.email = emailError;

  const phoneError = getPhoneValidationError(user.phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;

  return errors;
};
