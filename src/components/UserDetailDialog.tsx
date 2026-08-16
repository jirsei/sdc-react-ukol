import { useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { User } from '../types/User';

interface UserDetailDialogProps {
  open: boolean;
  user?: User | null;
  existingUsers?: User[];
  onClose: () => void;
  onSubmit: (user: User) => void;
}

type FormErrors = Partial<Record<keyof User, string>>;

const generateUniqueUid = (users: User[] = []): string => {
  const usedIds = new Set(users.map((user) => user.uid).filter(Boolean));
  let nextIndex = 1;
  let candidate = `u-${String(nextIndex)}`;

  while (usedIds.has(candidate)) {
    nextIndex += 1;
    candidate = `u-${String(nextIndex)}`;
  }

  return candidate;
};

const createEmptyUser = (users: User[] = []): User => ({
  uid: generateUniqueUid(users),
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phoneNumber: '',
  accessAllowed: true,
  hiredSince: '',
  location: '',
});

const toInputDate = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);

  return date.toISOString().slice(0, 10);
};

const buildInitialForm = (user?: User | null, existingUsers: User[] = []): User => {
  if (!user) return createEmptyUser(existingUsers);

  return {
    uid: user.uid,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    accessAllowed: user.accessAllowed,
    hiredSince: toInputDate(user.hiredSince),
    location: user.location ?? '',
  };
};

const getEmailValidationError = (
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

const getPhoneValidationError = (phoneNumber: string): string | undefined => {
  const trimmedPhone = phoneNumber.trim();

  if (!trimmedPhone) {
    return 'Phone number is required.';
  }

  if (!/^\+?\d+(\s\d+)*$/.test(trimmedPhone)) {
    return 'Phone number must contain only numbers, optional + at start, and single spaces between numbers.';
  }

  return undefined;
};

const validateUser = (user: User, existingUsers: User[] = [], ignoredUid?: string): FormErrors => {
  const errors: FormErrors = {};

  if (!user.firstName.trim()) errors.firstName = 'First name is required.';
  if (!user.lastName.trim()) errors.lastName = 'Last name is required.';

  const emailError = getEmailValidationError(user.email, existingUsers, ignoredUid);
  if (emailError) errors.email = emailError;

  const phoneError = getPhoneValidationError(user.phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;

  return errors;
};

const normalizeUser = (user: User): User => ({
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

export default function UserDetailDialog({
  open,
  user,
  existingUsers = [],
  onClose,
  onSubmit,
}: UserDetailDialogProps) {
  const isEditMode = Boolean(user);
  const [form, setForm] = useState<User>(() => buildInitialForm(user, existingUsers));
  const [errors, setErrors] = useState<FormErrors>({});

  const dialogTitle = useMemo(() => (isEditMode ? 'Edit user' : 'Add user'), [isEditMode]);

  const handleChange = <K extends keyof User>(field: K, value: User[K]) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    if (field === 'email' && !isEditMode) {
      const nextEmailError = getEmailValidationError(String(value ?? ''), existingUsers, user?.uid);
      setErrors((current) => ({ ...current, email: nextEmailError }));
      return;
    }

    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateAndSetFieldError = <K extends keyof User>(field: K, value: User[K]) => {
    const nextForm = { ...form, [field]: value };
    const nextErrors = validateUser(normalizeUser(nextForm), existingUsers, user?.uid);

    setForm(nextForm);
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const submitDisabled = (() => {
    const normalizedForm = normalizeUser(form);
    const nextErrors = validateUser(normalizedForm, existingUsers, user?.uid);
    const originalUser = user ? normalizeUser(buildInitialForm(user, existingUsers)) : null;

    if (Object.keys(nextErrors).length > 0) {
      return true;
    }

    if (!isEditMode) {
      return (
        !normalizedForm.firstName ||
        !normalizedForm.lastName ||
        !normalizedForm.email ||
        !normalizedForm.phoneNumber
      );
    }

    return originalUser !== null && JSON.stringify(originalUser) === JSON.stringify(normalizedForm);
  })();

  const handleSubmit = () => {
    const normalizedForm = normalizeUser(form);
    const nextErrors = validateUser(normalizedForm, existingUsers, user?.uid);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(normalizedForm);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="First name"
              value={form.firstName}
              onChange={(e) => {
                handleChange('firstName', e.target.value);
              }}
              onBlur={(e) => {
                validateAndSetFieldError('firstName', e.target.value);
              }}
              error={Boolean(errors.firstName)}
              helperText={errors.firstName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Last name"
              value={form.lastName}
              onChange={(e) => {
                handleChange('lastName', e.target.value);
              }}
              onBlur={(e) => {
                validateAndSetFieldError('lastName', e.target.value);
              }}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={(e) => {
                handleChange('username', e.target.value);
              }}
              onBlur={(e) => {
                validateAndSetFieldError('username', e.target.value);
              }}
              error={Boolean(errors.username)}
              helperText={errors.username}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              value={form.email}
              onChange={(e) => {
                handleChange('email', e.target.value);
              }}
              onBlur={(e) => {
                validateAndSetFieldError('email', e.target.value);
              }}
              error={Boolean(errors.email)}
              helperText={errors.email}
              disabled={isEditMode}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone number"
              value={form.phoneNumber}
              onChange={(e) => {
                handleChange('phoneNumber', e.target.value);
              }}
              onBlur={(e) => {
                validateAndSetFieldError('phoneNumber', e.target.value);
              }}
              error={Boolean(errors.phoneNumber)}
              helperText={errors.phoneNumber}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.accessAllowed}
                  onChange={(e) => {
                    handleChange('accessAllowed', e.target.checked);
                  }}
                />
              }
              label="Access allowed"
              sx={{
                '& .MuiFormControlLabel-label': {
                  color: !form.accessAllowed && errors.accessAllowed ? 'error.main' : 'inherit',
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Hired since"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.hiredSince}
              onChange={(e) => {
                handleChange('hiredSince', e.target.value);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Location"
              value={form.location}
              onChange={(e) => {
                handleChange('location', e.target.value);
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitDisabled}>
          {isEditMode ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
