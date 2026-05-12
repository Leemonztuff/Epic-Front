// Reexport styled component to replace previous CharacterDetailView
"use client";
import CharacterDetailStyled from './CharacterDetailStyled';

export default function CharacterDetailView({ characterId }: { characterId: string }) {
  return <CharacterDetailStyled characterId={characterId} />;
}
