import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the privacy-first workspace', () => {
  render(<App />);
  expect(screen.getByText(/your images never leave your device/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start local compression/i })).toBeDisabled();
  expect(screen.getByLabelText(/keep photo details/i)).toBeChecked();
});

test('links to the GitHub repo without any live widget', () => {
  render(<App />);
  const star = screen.getByRole('link', { name: /star on github/i });
  expect(star).toHaveAttribute('href', 'https://github.com/Krunalio/Privacy-first-image-compress');
  expect(star).toHaveAttribute('rel', 'noopener noreferrer');
});
