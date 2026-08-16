import { useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import MapDialog from './MapDialog';
import type { User } from '../types/User';
import { generateRandomCzechLocation } from '../utils/location';
import {
  getEmailValidationError,
  normalizeUser,
  validateUser,
  type FormErrors,
} from '../utils/userValidation';

interface UserDetailDialogProps {
  open: boolean;
  user?: User | null;
  existingUsers?: User[];
  onClose: () => void;
  onSubmit: (user: User, addAnother?: boolean) => void;
}

const generateUniqueUid = (users: User[] = []): string => {
  const usedIds = new Set(users.map((user) => user.uid).filter(Boolean));
  let nextIndex = 1;
  let candidate = String(nextIndex);

  while (usedIds.has(candidate)) {
    nextIndex += 1;
    candidate = String(nextIndex);
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
  location: generateRandomCzechLocation(),
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

export default function UserDetailDialog({
  open,
  user,
  existingUsers = [],
  onClose,
  onSubmit,
}: UserDetailDialogProps) {
  const isEditMode = Boolean(user);
  const [actualExistingUsers, setActualExistingUsers] = useState<User[]>(existingUsers);
  const [form, setForm] = useState<User>(() => buildInitialForm(user, actualExistingUsers));
  const [errors, setErrors] = useState<FormErrors>({});
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  const dialogTitle = useMemo(() => (isEditMode ? 'Edit user' : 'Add user'), [isEditMode]);

  const handleChange = <K extends keyof User>(field: K, value: User[K]) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    if (field === 'email' && !isEditMode) {
      const nextEmailError = getEmailValidationError(
        String(value ?? ''),
        actualExistingUsers,
        user?.uid,
      );
      setErrors((current) => ({ ...current, email: nextEmailError }));
      return;
    }

    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateAndSetFieldError = <K extends keyof User>(field: K, value: User[K]) => {
    const nextForm = { ...form, [field]: value };
    const nextErrors = validateUser(normalizeUser(nextForm), actualExistingUsers, user?.uid);

    setForm(nextForm);
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const submitDisabled = (() => {
    const normalizedForm = normalizeUser(form);
    const nextErrors = validateUser(normalizedForm, actualExistingUsers, user?.uid);
    const originalUser = user ? normalizeUser(buildInitialForm(user, actualExistingUsers)) : null;

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

  const handleSubmit = (addAnother = false) => {
    const normalizedForm = normalizeUser(form);
    const nextErrors = validateUser(normalizedForm, actualExistingUsers, user?.uid);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(normalizedForm, addAnother);
    if (addAnother) {
      setActualExistingUsers([...actualExistingUsers, normalizedForm]);
      setForm(buildInitialForm(undefined, [...actualExistingUsers, normalizedForm]));
      setErrors({});
    }
  };

  return (
    <>
      <Dialog open={open} onClose={mapDialogOpen ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Jméno"
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
                label="Příjmení"
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
                label="Uživatelské jméno"
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
                label="E-mail"
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
                label="Telefonní číslo"
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Přístup"
                value={String(form.accessAllowed)}
                onChange={(e) => {
                  handleChange('accessAllowed', e.target.value === 'true');
                }}
              >
                <MenuItem value="true">Přístup</MenuItem>
                <MenuItem value="false">Bez přístupu</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Najatý od"
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
                label="Lokace"
                value={form.location}
                onChange={(e) => {
                  handleChange('location', e.target.value);
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setMapDialogOpen(true);
            }}
          >
            Map
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleSubmit(false);
            }}
            disabled={submitDisabled}
          >
            {isEditMode ? 'Save' : 'Add'}
          </Button>
          {!isEditMode && (
            <Button
              variant="contained"
              onClick={() => {
                handleSubmit(true);
              }}
              disabled={submitDisabled}
            >
              Add another
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <MapDialog
        open={mapDialogOpen}
        users={[form]}
        onClose={() => {
          setMapDialogOpen(false);
        }}
      />
    </>
  );
}
