import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ErrorNotice } from './error-notice';

afterEach(cleanup);

it('retries exactly once per press', () => {
  const retry = vi.fn();
  render(<ErrorNotice retry={retry} />);
  const button = screen.getByRole('button', { name: 'Try again' });

  expect(retry).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(retry).toHaveBeenCalledTimes(1);
  fireEvent.click(button);
  expect(retry).toHaveBeenCalledTimes(2);
});

it('omits the retry button without a retry callback', () => {
  render(<ErrorNotice />);

  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
});

it('offers email contact with and without a retry callback', () => {
  const view = render(<ErrorNotice retry={vi.fn()} />);

  expect(
    screen.getByRole('link', { name: 'reach out to us' }).getAttribute('href'),
  ).toBe('mailto:austin@neuramance.com');

  view.rerender(<ErrorNotice />);

  expect(
    screen.getByRole('link', { name: 'reach out to us' }).getAttribute('href'),
  ).toBe('mailto:austin@neuramance.com');
});
