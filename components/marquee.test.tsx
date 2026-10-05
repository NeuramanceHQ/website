import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Marquee } from './marquee';

afterEach(cleanup);

const renderMarquee = () =>
  render(
    <Marquee label="At a glance">
      <li>Shop: Austin, TX</li>
      <li>Order status: In code</li>
    </Marquee>,
  );

it('exposes one labelled list and hides its looping copy from assistive tech', () => {
  const { container } = renderMarquee();
  const list = screen.getByRole('list', { name: 'At a glance' });
  expect(
    screen.getAllByRole('listitem').map((item) => item.textContent),
  ).toEqual(['Shop: Austin, TX', 'Order status: In code']);

  const lists = container.querySelectorAll('ul');
  expect(lists).toHaveLength(2);
  const [, copy] = lists;
  expect(copy.textContent).toBe(list.textContent);
  expect(copy.getAttribute('aria-hidden')).toBe('true');
  expect(copy.hasAttribute('inert')).toBe(true);
});

it('toggles scrolling with a pressed-state pause button', () => {
  renderMarquee();
  const toggle = screen.getByRole('button', { name: 'Pause scrolling' });
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
});
