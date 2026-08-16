import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportDialog from '../components/ImportDialog';
import UserDetailDialog from '../components/UserDetailDialog';
import UsersTable from '../components/UsersTable';
import { useUserStore } from '../stores/userStore';
import type { User } from '../types/User';

export default function UsersPage() {
  const users = useUserStore((s) => s.users);
  const selectedIds = useUserStore((s) => s.selectedIds);
  const page = useUserStore((s) => s.page);
  const rowsPerPage = useUserStore((s) => s.rowsPerPage);
  const toggleSelect = useUserStore((s) => s.toggleSelect);
  const selectAll = useUserStore((s) => s.selectAll);
  const deleteSelected = useUserStore((s) => s.deleteSelected);
  const addUser = useUserStore((s) => s.addUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const setPage = useUserStore((s) => s.setPage);
  const setRowsPerPage = useUserStore((s) => s.setRowsPerPage);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [pendingImportUsers, setPendingImportUsers] = useState<User[]>([]);
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);
  const [confirmClearImportOpen, setConfirmClearImportOpen] = useState(false);
  const [pendingClearImportUsers, setPendingClearImportUsers] = useState<User[]>([]);
  const [filterText, setFilterText] = useState('');

  const handleRowClick = (u: User) => {
    setSelectedUser(u);
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSubmitUser = (user: User, addAnother = false) => {
    if (selectedUser) {
      updateUser(user);
    } else {
      addUser(user);
    }

    if (!addAnother) {
      handleCloseDialog();
    }
  };

  const handleSelectAllVisible = (uids: string[]) => {
    selectAll(uids);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmDeleteOpen(true);
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
    setPendingImportUsers([]);
    setPendingClearImportUsers([]);
    setConfirmOverwriteOpen(false);
    setConfirmClearImportOpen(false);
  };

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const mergeUsers = (baseUsers: User[], incomingUsers: User[], overwriteExisting: boolean) => {
    const mergedUsers = [...baseUsers];
    const uidMap = new Map(baseUsers.map((user) => [user.uid, user]));
    const emailMap = new Map(baseUsers.map((user) => [normalizeEmail(user.email), user]));

    for (const incomingUser of incomingUsers) {
      const matchedByUid = uidMap.get(incomingUser.uid);
      const matchedByEmail = emailMap.get(normalizeEmail(incomingUser.email));
      const match = matchedByUid ?? matchedByEmail;

      if (match) {
        if (!overwriteExisting) {
          continue;
        }

        const targetIndex = mergedUsers.findIndex(
          (user) =>
            user.uid === match.uid ||
            normalizeEmail(user.email) === normalizeEmail(incomingUser.email),
        );

        if (targetIndex >= 0) {
          const updatedUser = { ...mergedUsers[targetIndex], ...incomingUser };
          mergedUsers[targetIndex] = updatedUser;
          uidMap.set(updatedUser.uid, updatedUser);
          emailMap.set(normalizeEmail(updatedUser.email), updatedUser);
        }

        continue;
      }

      mergedUsers.push(incomingUser);
      uidMap.set(incomingUser.uid, incomingUser);
      emailMap.set(normalizeEmail(incomingUser.email), incomingUser);
    }

    return mergedUsers;
  };

  const handleImportMerge = (newUsers: User[]) => {
    const hasDuplicates = newUsers.some((incomingUser) =>
      users.some(
        (existingUser) =>
          existingUser.uid === incomingUser.uid ||
          normalizeEmail(existingUser.email) === normalizeEmail(incomingUser.email),
      ),
    );

    if (hasDuplicates) {
      setPendingImportUsers(newUsers);
      setConfirmOverwriteOpen(true);
      return;
    }

    useUserStore.getState().setUsers([...users, ...newUsers]);
    setImportDialogOpen(false);
  };

  const handleConfirmOverwriteImport = () => {
    if (pendingImportUsers.length === 0) {
      setConfirmOverwriteOpen(false);
      return;
    }

    const mergedUsers = mergeUsers(users, pendingImportUsers, true);
    useUserStore.getState().setUsers(mergedUsers);
    setPendingImportUsers([]);
    setConfirmOverwriteOpen(false);
    setImportDialogOpen(false);
  };

  const handleSkipDuplicatesImport = () => {
    const uniqueUsers = pendingImportUsers.filter(
      (incomingUser) =>
        !users.some(
          (existingUser) =>
            existingUser.uid === incomingUser.uid ||
            normalizeEmail(existingUser.email) === normalizeEmail(incomingUser.email),
        ),
    );

    useUserStore.getState().setUsers([...users, ...uniqueUsers]);
    setPendingImportUsers([]);
    setConfirmOverwriteOpen(false);
    setImportDialogOpen(false);
  };

  const handleClearAndImport = (newUsers: User[]) => {
    setPendingClearImportUsers(newUsers);
    setConfirmClearImportOpen(true);
  };

  const handleConfirmClearImport = () => {
    if (pendingClearImportUsers.length === 0) {
      setConfirmClearImportOpen(false);
      return;
    }

    useUserStore.getState().setUsers(pendingClearImportUsers);
    setPendingClearImportUsers([]);
    setConfirmClearImportOpen(false);
    setImportDialogOpen(false);
  };

  const handleCancelClearImport = () => {
    setConfirmClearImportOpen(false);
    setPendingClearImportUsers([]);
  };

  const handleConfirmDelete = () => {
    deleteSelected();
    setConfirmDeleteOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const filterUsersByText = (user: User): boolean => {
    if (!filterText.trim()) return true;

    const searchLower = filterText.toLowerCase();
    return (
      user.uid.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phoneNumber.toLowerCase().includes(searchLower) ||
      (user.location?.toLowerCase().includes(searchLower) ?? false) ||
      (user.hiredSince?.toLowerCase().includes(searchLower) ?? false)
    );
  };

  const filteredAndSortedUsers = users
    .filter(filterUsersByText)
    .sort((a, b) => Number(a.uid) - Number(b.uid));

  const maxPage = Math.max(0, Math.ceil(filteredAndSortedUsers.length / rowsPerPage) - 1);
  const safePage = Math.min(page, maxPage);
  const start = safePage * rowsPerPage;
  const visible = filteredAndSortedUsers.slice(start, start + rowsPerPage);

  return (
    <Box p={2} mt={12}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Users</Typography>
        <Box>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={handleImportClick}>
            Import
          </Button>
          <Button variant="contained" onClick={handleAddUser}>
            Add user
          </Button>
        </Box>
      </Box>

      <Box mb={1} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography>{filteredAndSortedUsers.length} users</Typography>
          {filterText && (
            <Typography variant="body2" color="text.secondary">
              (filtered from {users.length})
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {selectedIds.length > 0 && (
            <Button color="error" variant="outlined" onClick={handleDeleteSelected}>
              Delete selected ({selectedIds.length})
            </Button>
          )}
          <TextField
            size="small"
            placeholder="Filter users..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setPage(0);
            }}
            sx={{ width: 200 }}
          />
        </Box>
      </Box>

      <UsersTable
        users={visible}
        total={filteredAndSortedUsers.length}
        page={safePage}
        rowsPerPage={rowsPerPage}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAllVisible={handleSelectAllVisible}
        onRowClick={handleRowClick}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      <UserDetailDialog
        key={
          dialogOpen
            ? `dialog-${selectedUser?.uid ?? 'new-user'}`
            : `dialog-closed-${selectedUser?.uid ?? 'new-user'}`
        }
        open={dialogOpen}
        user={selectedUser}
        existingUsers={users}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitUser}
      />

      <ImportDialog
        key={importDialogOpen ? 'import-open' : 'import-closed'}
        open={importDialogOpen}
        onClose={handleImportClose}
        onImportMerge={handleImportMerge}
        onClearImport={handleClearAndImport}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete users"
        question={`Delete ${String(selectedIds.length)} selected users?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ConfirmDialog
        open={confirmOverwriteOpen}
        title="Overwrite existing users"
        question="Existing users with the same UID or email were found. Overwrite them with the imported data?"
        confirmText="Overwrite"
        cancelText="Skip duplicates"
        onConfirm={handleConfirmOverwriteImport}
        onCancel={handleSkipDuplicatesImport}
      />

      <ConfirmDialog
        open={confirmClearImportOpen}
        title="Clear and import users"
        question="This will delete all existing users and replace them with the imported users. Continue?"
        confirmText="Clear and import"
        cancelText="Cancel"
        onConfirm={handleConfirmClearImport}
        onCancel={handleCancelClearImport}
      />
    </Box>
  );
}
