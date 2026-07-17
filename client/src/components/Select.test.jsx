import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from './Select';

const OPTIONS = [
  ['all', 'Todas'],
  ['pending', 'Pendentes'],
  ['completed', 'Concluídas'],
];

describe('Select', () => {
  test('renderiza o label e as opções fornecidas', () => {
    render(<Select label="Status" value="all" onChange={() => {}} options={OPTIONS} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('all');
    expect(screen.getByRole('option', { name: 'Pendentes' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Concluídas' })).toBeInTheDocument();
  });

  test('chama onChange com o value bruto da opção selecionada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="Status" value="all" onChange={onChange} options={OPTIONS} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'completed');

    expect(onChange).toHaveBeenCalledWith('completed');
  });
});
