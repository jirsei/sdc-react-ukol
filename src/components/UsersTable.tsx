import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import TablePagination from '@mui/material/TablePagination';
import type { User } from '../types/User';

interface Props {
  users: User[];
  total: number;
  page: number;
  rowsPerPage: number;
  selectedIds: string[];
  onToggleSelect: (uid: string) => void;
  onSelectAllVisible: (uids: string[]) => void;
  onRowClick: (u: User) => void;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRows: number) => void;
}

export default function UsersTable({
  users,
  total,
  page,
  rowsPerPage,
  selectedIds,
  onToggleSelect,
  onSelectAllVisible,
  onRowClick,
  onPageChange,
  onRowsPerPageChange,
}: Props) {
  const visibleUids = users.map((u) => u.uid);
  const allVisibleSelected =
    visibleUids.every((id) => selectedIds.includes(id)) && visibleUids.length > 0;
  const someSelected = visibleUids.some((id) => selectedIds.includes(id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) onSelectAllVisible(visibleUids);
    else onSelectAllVisible([]);
  };

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={someSelected && !allVisibleSelected}
                  checked={allVisibleSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>UID</TableCell>
              <TableCell>First name</TableCell>
              <TableCell>Last name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Access allowed</TableCell>
              <TableCell>Hired since</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const checked = selectedIds.includes(u.uid);
              return (
                <TableRow
                  key={u.uid}
                  hover
                  onClick={() => {
                    onRowClick(u);
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => {
                        onToggleSelect(u.uid);
                      }}
                    />
                  </TableCell>
                  <TableCell>{u.uid}</TableCell>
                  <TableCell>{u.firstName}</TableCell>
                  <TableCell>{u.lastName}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phoneNumber}</TableCell>
                  <TableCell>{u.accessAllowed ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    {u.hiredSince ? new Date(u.hiredSince).toLocaleDateString() : ''}
                  </TableCell>
                  <TableCell>{u.location}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_e, p) => {
          onPageChange(p);
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          onRowsPerPageChange(parseInt(e.target.value, 10));
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
