/** @jest-environment jsdom */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import CharacterDetailView from '@/components/views/CharacterDetailView';

// Mock next/image to a simple img for snapshot stability
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={props.src} alt={props.alt} />;
  },
}));

// Mock useSupabase to return a supabase client with expected chained methods
const unit = {
  id: 'unit-1',
  name: 'Garran',
  current_job_id: 'novice',
  job: 'novice',
  rarity: 'UR',
  hp: 90,
  atk: 10,
  def: 9,
  spd: 10,
  equip_slots: [null, null, null, null, null],
  specials: [null, null, null, null],
  evolutions: ['swordman', 'mage'],
  sprite_id: null,
};

const jobRow = {
  id: 'novice',
  display_name: 'Novato',
  sprite_path: '/assets/sprites/novice.png',
  alternative_jobs: ['swordman', 'mage'],
};

const singleMock = jest.fn()
  .mockResolvedValueOnce({ data: unit })
  .mockResolvedValueOnce({ data: jobRow });

const eqMock = jest.fn(() => ({ single: singleMock }));
const selectMock = jest.fn(() => ({ eq: eqMock }));
const fromMock = jest.fn(() => ({ select: selectMock }));
const rpcMock = jest.fn();

jest.mock('@/hooks/useSupabase', () => ({
  useSupabase: () => ({ supabase: { from: fromMock, rpc: rpcMock } }),
}));

describe('CharacterDetailView snapshot', () => {
  it('renders and matches snapshot', async () => {
    const { asFragment, getByText } = render(<CharacterDetailView characterId="unit-1" />);

    await waitFor(() => expect(getByText('Garran')).toBeInTheDocument());

    expect(asFragment()).toMatchSnapshot();
  });
});
