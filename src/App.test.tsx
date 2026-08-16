import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the content', () => {
    const wrapper = render(<App />);
    const content = wrapper.container.querySelector('.app-container');

    expect(content).toBeInTheDocument();
  });
});
