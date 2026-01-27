import { render, screen } from '@testing-library/react';

function Hello() {
  return <h1>Constein</h1>;
}

test('renders smoke', () => {
  render(<Hello />);
  expect(screen.getByRole('heading', { name: 'Constein' })).toBeInTheDocument();
});
