import { render } from '@testing-library/react';
import App from './App';
import { useUserStore } from './stores/userStore';
import type { User } from './types/User';

const makeUser = (uid: string, firstName = 'Test'): User => ({
  uid,
  firstName,
  lastName: 'User',
  username: `${firstName.toLowerCase()}.${uid}`,
  email: `${uid}@example.com`,
  phoneNumber: '123456789',
  accessAllowed: true,
  hiredSince: '2024-01-01',
  location: 'Prague',
});

describe('App', () => {
  it('renders the content', () => {
    const wrapper = render(<App />);
    const content = wrapper.container.querySelector('.app-container');

    expect(content).toBeInTheDocument();
  });
});

describe('userStore pagination safety', () => {
  beforeEach(() => {
    useUserStore.setState({
      users: [
        makeUser('u-1', 'A'),
        makeUser('u-2', 'B'),
        makeUser('u-3', 'C'),
        makeUser('u-4', 'D'),
      ],
      selectedIds: ['u-1', 'u-2', 'u-4'],
      page: 10,
      rowsPerPage: 2,
    });
  });

  it('clamps the page after deleting selected users and clears invalid rows', () => {
    useUserStore.setState({
      selectedIds: ['u-1', 'u-3'],
    });

    useUserStore.getState().deleteSelected();

    expect(useUserStore.getState().page).toBe(0);
    expect(useUserStore.getState().selectedIds).toEqual([]);
    expect(useUserStore.getState().users).toHaveLength(2);
  });
});
