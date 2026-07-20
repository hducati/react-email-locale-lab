import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { renderEmailTemplate } from './template';

describe('renderEmailTemplate', () => {
  it('uses PreviewProps declared by a React Email template', () => {
    const WelcomeEmail = ({ name }: { name: string }) =>
      createElement('p', null, 'Hello ', name);
    WelcomeEmail.PreviewProps = { name: 'Taylor' };

    const element = renderEmailTemplate({
      name: 'Welcome',
      component: WelcomeEmail,
    });

    expect(renderToStaticMarkup(element)).toBe('<p>Hello Taylor</p>');
  });

  it('allows configured props to override PreviewProps', () => {
    const WelcomeEmail = ({ name }: { name: string }) =>
      createElement('p', null, 'Hello ', name);
    WelcomeEmail.PreviewProps = { name: 'Taylor' };

    const element = renderEmailTemplate({
      name: 'Welcome',
      component: WelcomeEmail,
      props: { name: 'Morgan' },
    });

    expect(renderToStaticMarkup(element)).toBe('<p>Hello Morgan</p>');
  });

  it('keeps custom render functions supported', () => {
    const element = renderEmailTemplate({
      name: 'Custom',
      render: () => createElement('p', null, 'Custom'),
    });

    expect(renderToStaticMarkup(element)).toBe('<p>Custom</p>');
  });
});
