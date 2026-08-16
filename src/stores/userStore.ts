import { create } from 'zustand';
import type { User } from '../types/User';

interface UserState {
  users: User[];
  selectedIds: string[];
  page: number;
  rowsPerPage: number;
  setUsers: (u: User[]) => void;
  addUser: (u: User) => void;
  toggleSelect: (uid: string) => void;
  clearSelection: () => void;
  selectAll: (uids: string[]) => void;
  deleteSelected: () => void;
  setPage: (p: number) => void;
  setRowsPerPage: (r: number) => void;
}

const sampleUsers = (): User[] => {
  const names = [
    ['Alice', 'Novak'],
    ['Bob', 'Svoboda'],
    ['Carol', 'Kral'],
    ['David', 'Marek'],
    ['Eva', 'Polakova'],
    ['Frantisek', 'Horak'],
    ['Gina', 'Zelenka'],
    ['Hana', 'Dvorak'],
    ['Ivan', 'Bures'],
    ['Jana', 'Nemcova'],
    ['Karel', 'Vesely'],
    ['Lukas', 'Havel'],
  ];
  return names.map((n, i) => ({
    uid: `u-${String(i + 1)}`,
    firstName: n[0],
    lastName: n[1],
    username: `${n[0].toLowerCase()}.${n[1].toLowerCase()}`,
    email: `${n[0].toLowerCase()}@example.com`,
    phoneNumber: `+420 700 000 ${String(100 + i)}`,
    accessAllowed: i % 3 !== 0,
    hiredSince: new Date(2020, i % 12, (i + 1) * 2).toISOString(),
    location: i % 2 === 0 ? 'Prague' : 'Brno',
  }));
};

const clampPage = (users: User[], rowsPerPage: number, page: number) => {
  const maxPage = Math.max(0, Math.ceil(users.length / rowsPerPage) - 1);
  return Math.min(Math.max(page, 0), maxPage);
};

export const useUserStore = create<UserState>((set) => ({
  users: sampleUsers(),
  selectedIds: [],
  page: 0,
  rowsPerPage: 10,
  setUsers: (u) => {
    set((state) => ({
      users: u,
      page: clampPage(u, state.rowsPerPage, state.page),
      selectedIds: state.selectedIds.filter((uid) => u.some((user) => user.uid === uid)),
    }));
  },
  addUser: (u) => {
    set((state) => {
      const nextUsers = [u, ...state.users];
      return {
        users: nextUsers,
        page: clampPage(nextUsers, state.rowsPerPage, state.page),
      };
    });
  },
  toggleSelect: (uid) => {
    set(({ selectedIds }) => ({
      selectedIds: selectedIds.includes(uid)
        ? selectedIds.filter((id) => id !== uid)
        : [...selectedIds, uid],
    }));
  },
  clearSelection: () => {
    set({ selectedIds: [] });
  },
  selectAll: (uids) => {
    set((state) => ({
      selectedIds: uids.filter((uid) => state.users.some((user) => user.uid === uid)),
    }));
  },
  deleteSelected: () => {
    set((state) => {
      const nextUsers = state.users.filter((u) => !state.selectedIds.includes(u.uid));
      return {
        users: nextUsers,
        selectedIds: [],
        page: clampPage(nextUsers, state.rowsPerPage, state.page),
      };
    });
  },
  setPage: (p) => {
    set((state) => ({ page: clampPage(state.users, state.rowsPerPage, p) }));
  },
  setRowsPerPage: (r) => {
    set((state) => ({ rowsPerPage: r, page: clampPage(state.users, r, 0) }));
  },
}));
