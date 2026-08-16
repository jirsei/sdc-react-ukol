import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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

  const handleSubmitUser = (user: User) => {
    if (selectedUser) {
      updateUser(user);
    } else {
      addUser(user);
    }

    handleCloseDialog();
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
  };

  const handleImportNext = (file: File) => {
    console.log('Selected CSV for import validation:', file.name);
    setImportDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    deleteSelected();
    setConfirmDeleteOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const maxPage = Math.max(0, Math.ceil(users.length / rowsPerPage) - 1);
  const safePage = Math.min(page, maxPage);
  const start = safePage * rowsPerPage;
  const visible = users.slice(start, start + rowsPerPage);

  return (
    <Box p={2}>
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

      <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
        <Typography>{users.length} users</Typography>
        <Button color="error" variant="outlined" onClick={handleDeleteSelected}>
          Delete selected ({selectedIds.length})
        </Button>
      </Box>

      <UsersTable
        users={visible}
        total={users.length}
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
        onNext={handleImportNext}
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
    </Box>
  );
}
