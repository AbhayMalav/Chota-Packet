
import { expect, vi } from 'vitest';

const toHaveAttribute = function (element, attr, value) {
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
  const pass = element.disabled === true || element.hasAttribute('disabled');
  return {
    pass,
    message: () => pass
      ? `expected element not to be disabled`
      : `expected element to be disabled`,
  };
};

const toHaveClass = function (element, ...classNames) {
  const pass = classNames.every(cls => element.classList.contains(cls));
  return {
    pass,
    message: () => pass
      ? `expected element not to have class(es): ${classNames.join(', ')}`
      : `expected element to have class(es): ${classNames.join(', ')}`,
  };
};

const toHaveTextContent = function (element, text) {
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
