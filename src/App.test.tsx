import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';
import { useUserStore } from './stores/userStore';
import type { User } from './types/User';
import { validateUser } from './utils/userValidation';

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

  it('opens and closes the map dialog', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /map/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /^map$/i })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /^close$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

describe('ImportDialog', () => {
  it('opens and enables next when a CSV file is selected', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    const dialog = await screen.findByRole('dialog');

    const input = within(dialog).getByLabelText(/select csv file/i);
    expect(input).toHaveAttribute('accept', '.csv');

    const file = new File(['firstName,lastName\nAlice,Smith'], 'users.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(within(dialog).getAllByText(/users\.csv/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByRole('button', { name: /^next$/i })).toBeEnabled();
  });
});

describe('shared user validation', () => {
  it('validates required fields and duplicate emails outside the dialog', () => {
    const user: User = {
      uid: 'u-99',
      firstName: 'New',
      lastName: 'Person',
      username: 'new.person',
      email: 'u-1@example.com',
      phoneNumber: '123456789',
      accessAllowed: true,
      hiredSince: '2024-01-01',
      location: 'Prague',
    };

    expect(validateUser(user, [makeUser('u-1', 'Alice')])).toMatchObject({
      email: 'Email already exists.',
    });
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
      rowsPerPage: 5,
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

describe('UserDetailDialog', () => {
  beforeEach(() => {
    useUserStore.setState({
      users: [makeUser('u-1', 'Alice'), makeUser('u-2', 'Bob')],
      selectedIds: [],
      page: 0,
      rowsPerPage: 5,
    });
  });

  it('opens the create-user dialog and adds a user', async () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: /add user/i })[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /add user/i })).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/^jméno$/i), {
      target: { value: 'New' },
    });
    fireEvent.change(within(dialog).getByLabelText(/příjmení/i), {
      target: { value: 'Person' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^uživatelské jméno$/i), {
      target: { value: 'new.person' },
    });
    fireEvent.change(within(dialog).getByLabelText(/e-mail/i), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(within(dialog).getByLabelText(/telefonní číslo/i), {
      target: { value: '123456789' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('disables add when the form is empty or invalid', async () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: /add user/i })[0]);
    const dialog = await screen.findByRole('dialog');
    const addButton = within(dialog).getByRole('button', { name: /^add$/i });

    expect(addButton).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText(/^jméno$/i), {
      target: { value: 'New' },
    });
    fireEvent.change(within(dialog).getByLabelText(/příjmení/i), {
      target: { value: 'Person' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^uživatelské jméno$/i), {
      target: { value: 'new.person' },
    });
    fireEvent.change(within(dialog).getByLabelText(/e-mail/i), {
      target: { value: 'not-an-email' },
    });

    expect(within(dialog).getByRole('button', { name: /^add$/i })).toBeDisabled();
  });

  it('shows a red validation message after an invalid field is blurred', async () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: /add user/i })[0]);
    const dialog = await screen.findByRole('dialog');
    const emailInput = within(dialog).getByLabelText(/e-mail/i);

    fireEvent.change(emailInput, { target: { value: 'bad-email' } });
    fireEvent.blur(emailInput);

    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).getByText(/email is invalid\./i)).toBeInTheDocument();
  });

  it('blocks duplicate email addresses and auto-generates a unique UID', async () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: /add user/i })[0]);
    const dialog = await screen.findByRole('dialog');
    const emailInput = within(dialog).getByLabelText(/e-mail/i);

    fireEvent.change(within(dialog).getByLabelText(/^jméno$/i), {
      target: { value: 'New' },
    });
    fireEvent.change(within(dialog).getByLabelText(/příjmení/i), {
      target: { value: 'Person' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^uživatelské jméno$/i), {
      target: { value: 'new.person' },
    });
    fireEvent.change(emailInput, { target: { value: 'u-1@example.com' } });
    fireEvent.change(within(dialog).getByLabelText(/telefonní číslo/i), {
      target: { value: '123456789' },
    });
    fireEvent.blur(emailInput);

    expect(within(dialog).getByText(/email already exists\./i)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /^add$/i })).toBeDisabled();
  });
});
