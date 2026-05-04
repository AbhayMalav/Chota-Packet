/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlBar from './ControlBar';

vi.mock('../config/translations', () => ({
  translations: {
    en: {
      style: 'Style',
      tone: 'Tone',
      level: 'Level',
      output: 'Output',
      regen: 'Regen',
      enhance: 'Enhance',
      enhancing: 'Enhancing...',
      multi: 'Multi',
      multiOutputTooltip: 'Generate multiple output variants',
    },
  },
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ language: 'en' })),
}));

describe('ControlBar - Multi-Output Toggle', () => {
  const defaultProps = {
    style: 'general',
    onStyleChange: vi.fn(),
    tone: '',
    onToneChange: vi.fn(),
    level: 'basic',
    onLevelChange: vi.fn(),
    outputLang: 'auto',
    onOutputLangChange: vi.fn(),
    onEnhance: vi.fn(),
    onRegenerate: vi.fn(),
    loading: false,
    canEnhance: true,
    showRegen: false,
    models: [],
    selectedModel: '',
    onModelChange: vi.fn(),
  };

  it('renders enhance button by default', () => {
    const { container } = render(<ControlBar {...defaultProps} />);
    const enhanceBtn = container.querySelector('#enhance-btn');
    expect(enhanceBtn).toBeInTheDocument();
    expect(enhanceBtn).toHaveTextContent('Enhance');
  });

  it('renders multi-output toggle when onMultiOutputToggle prop is provided', () => {
    const { container } = render(
      <ControlBar {...defaultProps} onMultiOutputToggle={vi.fn()} />
    );
    const toggleBtn = container.querySelector('.multi-output-toggle');
    expect(toggleBtn).toBeInTheDocument();
  });

  it('does not render multi-output toggle when onMultiOutputToggle prop is not provided', () => {
    const { container } = render(<ControlBar {...defaultProps} />);
    const toggleBtn = container.querySelector('.multi-output-toggle');
    expect(toggleBtn).not.toBeInTheDocument();
  });

  it('shows active state when multiOutputEnabled is true', () => {
    const { container } = render(
      <ControlBar {...defaultProps} onMultiOutputToggle={vi.fn()} multiOutputEnabled={true} />
    );
    const toggleBtn = container.querySelector('.multi-output-toggle');
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');
    expect(toggleBtn).toHaveAttribute('role', 'switch');
    expect(toggleBtn).toHaveTextContent('Multi');
  });

  it('shows inactive state when multiOutputEnabled is false', () => {
    const { container } = render(
      <ControlBar {...defaultProps} onMultiOutputToggle={vi.fn()} multiOutputEnabled={false} />
    );
    const toggleBtn = container.querySelector('.multi-output-toggle');
    expect(toggleBtn).toHaveAttribute('aria-checked', 'false');
    expect(toggleBtn).toHaveTextContent('Multi');
  });

  it('calls onMultiOutputToggle when toggle is clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ControlBar {...defaultProps} onMultiOutputToggle={onToggle} multiOutputEnabled={false} />
    );
    const toggleBtn = container.querySelector('.multi-output-toggle');
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    const { container } = render(
      <ControlBar {...defaultProps} onMultiOutputToggle={vi.fn()} multiOutputEnabled={true} />
    );
    const toggleBtn = container.querySelector('.multi-output-toggle');
    expect(toggleBtn).toHaveAttribute('aria-label', 'Disable multi-output');
    expect(toggleBtn).toHaveAttribute('aria-checked', 'true');
    expect(toggleBtn).toHaveAttribute('role', 'switch');
  });

  it('has tooltip attribute with translation', () => {
    const { container } = render(
      <ControlBar {...defaultProps} onMultiOutputToggle={vi.fn()} />
    );
    const toggleBtn = container.querySelector('.multi-output-toggle');
    expect(toggleBtn).toHaveAttribute('title', 'Generate multiple output variants');
  });
});