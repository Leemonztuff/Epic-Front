'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Sword, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AssetService } from '@/lib/services/asset-service';
import { NineSlicePanel } from '@/components/ui/NineSlicePanel';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { ViewShell } from '@/components/ui/ViewShell';
import { Button } from '@/components/ui/Button';

interface CardDetailViewProps {
  cardId: string;
  itemId: string;
  onBack: () => void;
  onEquip: (item: any) => void;
  onDiscard: (itemId: string) => void;
}

export function CardDetailView({ cardId, itemId, onBack, onEquip, onDiscard }: CardDetailViewProps) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCard() {
      if (!supabase) return;
      const { data } = await supabase.from('cards').select('*').eq('id', cardId).single();
      setCard(data);
      setLoading(false);
    }
    loadCard();
  }, [cardId]);

  if (loading) return <ViewShell title="Carta" onBack={onBack} loading />;
  if (!card) return <ViewShell title="Carta" onBack={onBack} emptyMessage="Carta no encontrada" />;

  return (
    <ViewShell title="DETALLES" subtitle="CARTA DE PODER" onBack={onBack} background="gacha">
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">

        <NineSlicePanel type="border" variant="fancy" className="p-0 glass-frosted frame-earthstone overflow-hidden relative aspect-[3/4] shrink-0">
<img
              src={AssetService.getCardUrlWithFallback(card.id)}
              className="w-full h-full object-cover"
              alt={card.name}
            />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
           <div className="absolute bottom-6 left-6 right-6 text-center">
              <h3 className="text-3xl font-black text-white uppercase font-display drop-shadow-2xl">{card.name}</h3>
              <RarityBadge rarity={card.rarity} className="mx-auto mt-2" />
           </div>
        </NineSlicePanel>

        <NineSlicePanel type="border" variant="default" className="p-4 bg-black/40">
           <p className="text-xs text-white/60 italic text-center leading-relaxed font-stats">
              {card.description || 'Una carta misteriosa que emana un poder antiguo.'}
           </p>
        </NineSlicePanel>

        <div className="mt-auto space-y-3">
           <Button variant="primary" className="w-full h-14" onClick={() => onEquip({ ...card, item_type: 'card', item_id: card.id })}>EQUIPAR CARTA</Button>
           <Button variant="secondary" className="w-full" onClick={() => onDiscard(itemId)}>DESCARTAR</Button>
        </div>
      </div>
    </ViewShell>
  );
}
