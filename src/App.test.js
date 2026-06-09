import { render, screen } from '@testing-library/react';
import App from './App';

test('mostra o ecrã de login quando não há sessão', async () => {
  render(<App />);
  // Sem token guardado, a app deve trancar o utilizador no ecrã de Login.
  expect(await screen.findByText(/Bem-vindo de Volta/i)).toBeInTheDocument();
});
