import { render } from '@testing-library/react';
import Skeleton from './Skeleton';

describe('Skeleton', () => {
  test('renderiza sem lançar erro', () => {
    expect(() => render(<Skeleton />)).not.toThrow();
  });
});
