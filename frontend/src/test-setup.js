
import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('./hooks/useTranslation', () => ({
  __esModule: true,
  default: vi.fn(() => ({ t: { enhance: 'Enhance', clear: 'Clear', newThread: 'New Thread', search: 'Search...', pinned: 'Pinned', history: 'History', settings: 'Settings', shortcuts: 'Shortcuts', appearance: 'Appearance', language: 'Language', incognito: 'Incognito', feedback: 'Feedback', exportHistory: 'Export History', promptPlaceholder: 'Enter your prompt...' } }),
}));

vi.mock('./context/ThemeContext', () => ({
  __esModule: true,
  useTheme: vi.fn(() => ({ theme: 'dark', setTheme: vi.fn() })),
  ThemeProvider: ({ children }) => children,
}));

vi.mock('./hooks/usePopoverPosition', () => ({
  __esModule: true,
  usePopoverPosition: vi.fn(() => ({ position: { top: 100, left: 100, right: 'auto', bottom: 'auto' }, recalculate: vi.fn() })),
}));

const toHaveAttribute = function (element, attr, value) {
  if (element == null) {
     return { pass: false, message: () => `expected element to have attribute "${attr}", but element was ${element}` };
  }
  const hasAttr = element.hasAttribute(attr);
  const attrValue = element.getAttribute(attr);
  const pass = value !== undefined
    ? hasAttr && attrValue === value
    : hasAttr;
  return {
    pass,
    message: () => pass
      ? `expected element not to have attribute "${attr}"${value !== undefined ? `="${value}"` : ''}`
      : `expected element to have attribute "${attr}"${value !== undefined ? `="${value}"` : ''} (got "${attrValue}")`,
  };
};

const toBeInTheDocument = function (element) {
  const pass = element !== null && element !== undefined && document.body.contains(element);
  return {
    pass,
    message: () => pass
      ? `expected element not to be in the document`
      : `expected element to be in the document`,
  };
};

const toBeDisabled = function (element) {
  if (element == null) {
    return { pass: false, message: () => `expected element to be disabled, but element was ${element}`};
  }
  const pass = element.disabled === true || element.hasAttribute('disabled');
  return {
    pass,
    message: () => pass
      ? `expected element not to be disabled`
      : `expected element to be disabled`,
  };
};

const toHaveClass = function (element, ...classNames) {
  if (element == null) {
    return { pass: false, message: () => `expected element to have class(es): ${classNames.join(', ')}, but element was ${element}` };
  }
  const pass = classNames.every(cls => element.classList.contains(cls));
  return {
    pass,
    message: () => pass
      ? `expected element not to have class(es): ${classNames.join(', ')}`
      : `expected element to have class(es): ${classNames.join(', ')}`,
  };
};

const toHaveTextContent = function (element, text) {
  if (element == null) {
    return { pass: false, message: () => `expected element to have text content "${text}", but element was ${element}` };
  }
  const content = element.textContent || '';
  const match = typeof text === 'string' ? content.includes(text) : text.test(content);
  return {
    pass: match,
    message: () => `expected element ${match ? 'not ' : ''}to have text content "${text}"`,
  };
};

const toHaveFocus = function (element) {
  const pass = document.activeElement === element;
  return {
    pass,
    message: () => `expected element ${pass ? 'not ' : ''}to have focus`,
  };
};

expect.extend({ toBeInTheDocument, toBeDisabled, toHaveClass, toHaveTextContent, toHaveFocus, toHaveAttribute });
