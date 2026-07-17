import { createElement, type ReactElement } from 'react';
import type { EmailTemplate } from './types';

export const renderEmailTemplate = (template: EmailTemplate): ReactElement => {
  if ('render' in template && template.render) return template.render();

  const props = template.props ?? template.component.PreviewProps ?? {};
  return createElement(template.component, props);
};
