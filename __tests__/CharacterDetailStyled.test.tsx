import React from 'react';
import { render } from '@testing-library/react';
import CharacterDetailStyled from '@/components/views/CharacterDetailStyled';

// Mock next/image to render a simple img element for snapshots
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock useSupabase to return predictable unit data
jest.mock('@/hooks/useSupabase', () => ({
  useSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: null,
          }),
        }),
      }),
    }),
  }),
}));

describe('CharacterDetailStyled', () => {
  it('renders placeholder state without crashing', () => {
    const { container } = render(<CharacterDetailStyled characterId={"missing-id"} />);
    expect(container).toBeTruthy();
    // snapshot will be generated locally with `npm run test -u`
    expect(container).toMatchSnapshot();
  });
});
