/**
 * @vitest-environment happy-dom
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import GlobalErrorBoundary from './GlobalErrorBoundary';
import React from 'react';

// Почистване на DOM след всеки тест
afterEach(() => {
  cleanup();
});

// Помощен компонент, който хвърля грешка
const ProblematicComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Тестова грешка');
  }
  return <div>Всичко е наред</div>;
};

describe('GlobalErrorBoundary', () => {
  it('рендира децата си, когато няма грешка', () => {
    render(
      <GlobalErrorBoundary>
        <div data-testid="child">Тест</div>
      </GlobalErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByText('Тест')).toBeDefined();
  });

  it('показва fallback UI при грешка в дъщерен компонент', () => {
    // Скриваме конзолните грешки за този тест, за да не пълним лога
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <GlobalErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Упс! Нещо се обърка.')).toBeDefined();
    expect(screen.getByText('Опитай отново')).toBeDefined();
    
    consoleSpy.mockRestore();
  });

  it('извиква onRetry и възстановява състоянието при клик на "Опитай отново"', async () => {
    const onRetrySpy = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <GlobalErrorBoundary onRetry={onRetrySpy}>
        <ProblematicComponent shouldThrow={true} />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Упс! Нещо се обърка.')).toBeDefined();

    // Симулираме оправяне на проблема чрез промяна на пропъртито
    rerender(
      <GlobalErrorBoundary onRetry={onRetrySpy}>
        <ProblematicComponent shouldThrow={false} />
      </GlobalErrorBoundary>
    );

    // Все още трябва да сме в състояние на грешка, защото Error Boundary 
    // не се нулира автоматично само от промяна на децата (според имплементацията ни).
    expect(screen.getByText('Упс! Нещо се обърка.')).toBeDefined();

    // Клик на бутона за повторен опит
    fireEvent.click(screen.getByText('Опитай отново'));

    expect(onRetrySpy).toHaveBeenCalled();
    
    // Вече трябва да виждаме успешния компонент
    const successMsg = await screen.findByText('Всичко е наред');
    expect(successMsg).toBeDefined();
    expect(screen.queryByText('Упс! Нещо се обърка.')).toBeNull();

    consoleSpy.mockRestore();
  });
});
