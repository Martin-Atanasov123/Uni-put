// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import GradeInputSection from './GradeInputSection';

describe('GradeInputSection', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders mandatory fields correctly', () => {
        render(<GradeInputSection onGradesChange={mockOnChange} />);
        
        // Check for mandatory fields
        expect(screen.getByText(/ДЗИ БЕЛ/i)).toBeTruthy();
        expect(screen.getByText(/Средна от диплома/i)).toBeTruthy();
        
        // Check initial inputs are empty
        const inputs = screen.getAllByPlaceholderText('0.00');
        expect(inputs).toHaveLength(2);
    });

    it('adds a subject dynamically', () => {
        render(<GradeInputSection onGradesChange={mockOnChange} />);
        
        const addButton = screen.getByText('Добави Предмет');
        fireEvent.click(addButton);
        
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'dzi_mat' } });
        
        expect(screen.getByText(/ДЗИ Математика/i)).toBeTruthy();
        expect(screen.getAllByPlaceholderText('0.00')).toHaveLength(3);
    });

    it('removes a subject dynamically', () => {
        render(<GradeInputSection onGradesChange={mockOnChange} />);
        
        // Add subject first
        const addButton = screen.getByText('Добави Предмет');
        fireEvent.click(addButton);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'dzi_mat' } });
        
        // Find remove button (X icon) and click it
        const removeButtons = screen.getAllByTitle('Премахни');
        fireEvent.click(removeButtons[0]);
        
        expect(screen.queryByText(/ДЗИ Математика/i)).toBeNull();
        expect(screen.getAllByPlaceholderText('0.00')).toHaveLength(2);
    });

    it('limits extra subjects to 5', () => {
        render(<GradeInputSection onGradesChange={mockOnChange} />);
        
        const subjectsToAdd = ['dzi_mat', 'dzi_bio', 'dzi_him', 'dzi_fiz', 'dzi_ist'];
        
        subjectsToAdd.forEach(sub => {
            const addButton = screen.getByText('Добави Предмет');
            fireEvent.click(addButton);
            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: sub } });
        });
        
        expect(screen.getByText('Достигнат лимит (5)')).toBeTruthy();
        expect(screen.getByRole('button', { name: /Достигнат лимит/i }).disabled).toBe(true);
    });

    it('validates min/max values', () => {
        render(<GradeInputSection onGradesChange={mockOnChange} />);
        
        const inputs = screen.getAllByPlaceholderText('0.00');
        const belField = inputs[0]; 

        fireEvent.change(belField, { target: { value: '7.00' } });
        
        // Expect error message or indicator
        // Since we use touched state, we might need to blur or just rely on the render update
        expect(screen.getByText(/Моля въведете валидна оценка/i)).toBeTruthy();
    });

    it('calculates and propagates changes correctly', () => {
        render(<GradeInputSection onGradesChange={mockOnChange} />);
        
        const inputs = screen.getAllByPlaceholderText('0.00');
        fireEvent.change(inputs[0], { target: { value: '5.50' } });
        
        expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({ dzi_bel: '5.50' }),
            false // invalid because diploma is empty
        );
        
        fireEvent.change(inputs[1], { target: { value: '5.00' } });
        
        expect(mockOnChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ dzi_bel: '5.50', diploma: '5.00' }),
            true // valid now
        );
    });
});
