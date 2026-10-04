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
