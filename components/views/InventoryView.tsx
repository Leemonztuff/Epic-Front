'use client';
import { AssetService } from '@/lib/services/asset-service';
import { RarityIcon } from '@/components/ui/RarityIcon';
import { RarityBorder } from '@/components/ui/RarityBadge';
import { ViewShell } from '@/components/ui/ViewShell';
import { getRarityCode, RARITY_COLORS } from '@/lib/config/assets-config';
import { InventoryService } from '@/lib/services/inventory-service';
import { useGameStore } from '@/lib/stores/game-store';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Zap, Sword, Shield, Sparkles, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { SkillDetailView } from './SkillDetailView';
import { CardDetailView } from './CardDetailView';
import { useToast } from '@/lib/contexts/ToastContext';
import { gameDebugger } from '@/lib/debug';
import { Button } from '@/components/ui/Button';

interface InventoryViewProps {
  targetSlot: 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill' | null;
  fromUnitDetails: boolean;
  onBack: () => void;
  onEquip: (item: any) => void;
  onOpenCardDetails: (cardId: string, itemId: string) => void;
}

// Expanded filters like Ragnarok/Brave Frontier
const FILTERS: { key: 'all' | 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill' | 'material' | 'job_core'; label: string; icon?: React.ReactNode }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'weapon', label: 'Armas', icon: <Sword size={12} /> },
  { key: 'armor', label: 'Armadura', icon: <Shield size={12} /> },
  { key: 'accessory', label: 'Acc.', icon: <Sparkles size={12} /> },
  { key: 'boots', label: 'Botas', icon: <Zap size={12} /> },
  { key: 'card', label: 'Cartas' },
  { key: 'skill', label: 'Skills' },
  { key: 'material', label: 'Mat.' },
  { key: 'job_core', label: 'Jobs' },
];

export function InventoryView({ targetSlot, fromUnitDetails, onBack, onEquip, onOpenCardDetails }: InventoryViewProps) {
  const { confirm: confirmToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'weapon' | 'armor' | 'accessory' | 'boots' | 'card' | 'skill' | 'material' | 'job_core'>('all');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Get inventory from store (already enriched with definitions)
  const storeInventory = useGameStore(state => state.inventory);
  
  // Debug: log inventory changes
  useEffect(() => {
    gameDebugger.info('inventory', 'Store inventory changed', { 
      count: storeInventory.length,
      firstItems: storeInventory.slice(0, 2).map(i => ({ id: i.id, type: i.item_type, itemId: i.item_id }))
    });
  }, [storeInventory]);

  // Use store inventory directly - already has definitions loaded
  useEffect(() => {
    // Filter based on targetSlot if provided
    let filtered = storeInventory;
    
    if (targetSlot) {
      // Map target slot to compatible item types (v2 system)
      const slotToTypes: Record<string, string[]> = {
        weapon: ['weapon'],
        armor: ['armor'],
        accessory: ['accessory'],
        boots: ['boots'],
        card: ['card'],
        skill: ['skill', 'skill_scroll'],
      };
      const allowedTypes = slotToTypes[targetSlot] || [];
      filtered = storeInventory.filter(i => allowedTypes.includes(i.item_type));
    }
    
    setItems(filtered);
    setLoading(false);
    
    gameDebugger.info('inventory', 'Using store inventory', { 
      count: storeInventory.length,
      filtered: filtered.length,
      targetSlot
    });
  }, [storeInventory, targetSlot]);

  const filteredItems = useMemo(() => items.filter(item => {
    const matchesFilter = filter === 'all' || item.item_type === filter;
    const matchesSearch = !search || item.definition?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }), [items, filter, search]);

  const handleDiscard = async (itemId: string) => {
    const confirmed = await confirmToast('¿Descartar este objeto?');
    if (!confirmed) return;
    if (!supabase) return;
    try {
      await InventoryService.discardItem(itemId);
      const updated = await InventoryService.getInventory();
      useGameStore.getState().setInventory(updated as any[]);
    } catch (e) {
      gameDebugger.error('inventory', 'Failed to discard item', e);
    }
  };

  const handleItemClick = (item: any) => {
    if (item.item_type === 'card') setSelectedCard(item.item_id);
    else if (item.item_type === 'skill' || item.item_type === 'skill_scroll') setSelectedSkill(item.item_id);
    else onEquip(item);
  };

  const renderItemIcon = (item: any) => {
    switch (item.item_type) {
      case 'card':
        return <img src={AssetService.getCardUrlWithFallback(item.item_id)} alt="" className="w-full h-full object-contain" />;
      case 'weapon':
        return <img src={AssetService.getWeaponIconUrl(item.item_id)} alt="" className="w-10 h-10 object-contain" />;
      case 'armor':
        return <Shield size={24} className="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />;
      case 'accessory':
        return <Sparkles size={24} className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />;
      case 'boots':
        return <Zap size={24} className="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />;
      case 'skill':
      case 'skill_scroll':
        return <Zap size={24} className="text-[#F5C76B] drop-shadow-[0_0_10px_rgba(245,199,107,0.5)]" />;
      case 'job_core':
        return <Shield size={24} className="text-green-400" />;
      case 'material':
        return <Package size={24} className="text-blue-400" />;
      default:
        return <Package size={24} className="text-white/30" />;
    }
  };

  if (selectedSkill) {
    const skillItem = items.find(i => i.item_id === selectedSkill);
    return <SkillDetailView skillId={selectedSkill} itemId={skillItem?.id || ''} onBack={() => setSelectedSkill(null)} onEquip={(item) => { onEquip(item); setSelectedSkill(null); }} onDiscard={handleDiscard} />;
  }

  if (selectedCard) {
    const item = items.find(i => i.item_id === selectedCard);
    return <CardDetailView cardId={selectedCard} itemId={item?.id || ''} onBack={() => setSelectedCard(null)} onEquip={(item) => { onEquip(item); setSelectedCard(null); }} onDiscard={handleDiscard} />;
  }

  return (
    <ViewShell title="Inventario" subtitle={`${items.length} objetos`} onBack={onBack} loading={loading} emptyMessage="No hay objetos en tu inventario">
      {/* Equip mode banner */}
      {targetSlot && (
        <div className="px-4 pt-4 pb-0">
          <div className="bg-[#F5C76B]/10 border border-[#F5C76B]/30 rounded-xl px-4 py-3 text-center">
            <p className="text-[9px] font-black text-[#F5C76B] uppercase tracking-widest">
              {fromUnitDetails ? 'Selecciona un objeto para equipar' : `Seleccionando: ${targetSlot}`}
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="p-4 pb-2">
        <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                aria-label="Buscar objetos en inventario"
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20" 
              />
            </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              onClick={() => setFilter(f.key)}
              variant={filter === f.key ? "primary" : "ghost"}
              size="sm"
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${filter === f.key ? 'bg-[#F5C76B] text-black' : 'bg-black/40 border border-white/10 text-white/60 hover:text-white'}`}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4 pt-0">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/40">
            <Package size={48} className="mb-2 opacity-30" />
            <p className="text-sm font-stats">No hay objetos</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4">
            {filteredItems.map((item, idx) => {
              const rarity = getRarityCode(item.definition?.rarity);
              return (
                <motion.button 
                  key={item.id} 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: idx * 0.03 }} 
                  onClick={() => handleItemClick(item)}
                  aria-label={`Ver detalles de ${item.definition?.name || item.name}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick(item); }}}
                  className="text-left card-premium"
                >
                  <RarityBorder rarity={item.definition?.rarity} className="transition-all hover:scale-105 active:scale-95">
                    <div className="w-full h-full rounded-lg bg-black/40 flex flex-col items-center justify-center relative overflow-hidden p-1">
                      <div className="flex-1 flex items-center justify-center w-full min-h-[48px]">
                        {renderItemIcon(item)}
                      </div>
                      <span className="text-[6px] font-bold text-white/60 truncate w-full text-center leading-tight mt-0.5 px-0.5">
                        {item.definition?.name || item.item_id.split('_').slice(-1)[0]}
                      </span>
                      {item.quantity > 1 && <div className="absolute top-0 right-0 bg-black/60 px-1 py-0.5 rounded-bl-lg">
                        <span className="text-[7px] font-black text-white">{item.quantity}</span>
                      </div>}
                    </div>
                  </RarityBorder>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="p-4 text-center">
        <p className="text-[10px] text-white/30 font-stats">{targetSlot ? 'Toca un objeto para equiparlo' : 'Toca un objeto para ver detalles'}</p>
      </div>
    </ViewShell>
  );
}