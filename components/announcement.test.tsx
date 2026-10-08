import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Announcement } from './announcement';

afterEach(cleanup);

it('shows its message until the dismiss button is pressed', () => {
  render(<Announcement>Private beta is open.</Announcement>);
  expect(
    screen.getByRole('complementary', { name: 'Announcement' }).textContent,
  ).toBe('Private beta is open.');

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));

  expect(screen.queryByRole('complementary')).toBeNull();
  expect(screen.queryByText('Private beta is open.')).toBeNull();
});

const page = () =>
  render(
    <>
      <Announcement>Private beta is open.</Announcement>
      <nav>
        <button type="button">Menu</button>
      </nav>
    </>,
  );

it('hands keyboard focus to the next control when dismissed from the keyboard', () => {
  page();
  const dismiss = screen.getByRole('button', { name: 'Dismiss announcement' });
  dismiss.focus();
  fireEvent.click(dismiss);
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Menu' }),
  );
});

it('leaves focus alone when the dismissing press did not focus the button', () => {
  page();
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
  expect(document.activeElement).toBe(document.body);
});
