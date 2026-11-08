import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the privacy-first workspace', () => {
  render(<App />);
  expect(screen.getByText(/your images never leave your device/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /start local compression/i })).toBeDisabled();
  expect(screen.getByLabelText(/keep photo details/i)).toBeChecked();
});
