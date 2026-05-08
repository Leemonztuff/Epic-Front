'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Key, AlertTriangle, Users, Package, Crown } from 'lucide-react';
import { ViewShell } from '@/components/ui/ViewShell';
import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/lib/stores/game-store';
import { supabase } from '@/lib/supabase';
import { AssetService } from '@/lib/services/asset-service';
import { RarityBorder } from '@/components/ui/RarityBadge';
import type { GameUnit } from '@/lib/types/game-types';

interface ProfileViewProps {
  onBack: () => void;
}

export function ProfileView({ onBack }: ProfileViewProps) {
  const { profile, roster, reinitializeAccount } = useGameStore();
  const [username, setUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    }
    
    if (profile) {
      setUsername(profile.username || 'Jugador');
    }
    loadUserData();
  }, [profile]);

  const handleSaveUsername = async () => {
    if (!username.trim() || !supabase) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('players')
      .update({ username: username.trim() })
      .eq('id', user.id);

    setLoading(false);
    if (!error) {
      setIsEditingName(false);
      await useGameStore.getState().refreshState();
    }
  };

  const handleResetAccount = async () => {
    setLoading(true);
    await reinitializeAccount((msg, type) => {
      alert(msg);
    });
    setLoading(false);
    setShowResetConfirm(false);
  };

  const handleChangePassword = () => {
    alert('Para cambiar la contraseña, usa el enlace en el email de verificación de Supabase.');
  };

  return (
    <ViewShell 
      title="PERFIL" 
      subtitle="Gestiona tu cuenta"
      onBack={onBack}
      background="home"
    >
      <div className="p-4 space-y-6">
        {/* User Info Card */}
        <div className="relative p-4 rounded-2xl bg-gradient-to-b from-[#1a1a2e]/80 to-[#0f0f1a]/90 border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5C76B]/30 to-[#8B5CF6]/30 border border-[#F5C76B]/30 flex items-center justify-center">
              <User size={32} className="text-[#F5C76B]" />
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-stats"
                    placeholder="Tu nombre"
                    autoFocus
                  />
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSaveUsername}
                    disabled={loading}
                  >
                    Guardar
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setUsername(profile?.username || 'Jugador');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white font-display">
                    {username || 'Jugador'}
                  </h2>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-white/40 hover:text-white/60 text-xs underline"
                  >
                    Editar
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Mail size={12} className="text-white/40" />
                <span className="text-xs text-white/40 font-stats truncate max-w-[200px]">
                  {userEmail || 'Sin email'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#1a1a2e]/60 border border-white/5 text-center">
            <div className="text-lg font-black text-[#F5C76B] font-display">
              {profile?.currency || 0}
            </div>
            <div className="text-[10px] text-white/40 font-stats uppercase">Oro</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1a1a2e]/60 border border-white/5 text-center">
            <div className="text-lg font-black text-purple-400 font-display">
              {profile?.gems || 0}
            </div>
            <div className="text-[10px] text-white/40 font-stats uppercase">Gemas</div>
          </div>
          <div className="p-3 rounded-xl bg-[#1a1a2e]/60 border border-white/5 text-center">
            <div className="text-lg font-black text-emerald-400 font-display">
              {profile?.power || 0}
            </div>
            <div className="text-[10px] text-white/40 font-stats uppercase">Poder</div>
          </div>
        </div>

        {/* Characters Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-[#F5C76B]" />
            <h3 className="text-sm font-black text-white/80 font-stats uppercase tracking-wider">
              Tus Personajes
            </h3>
          </div>
          
          {roster && roster.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {roster.map((unit) => (
                <CharacterCard 
                  key={unit.id} 
                  unit={unit} 
                  onSelect={() => useGameStore.getState().handleSelectUnit(unit.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#1a1a2e]/40 border border-white/5 text-center">
              <Users size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40 font-stats">No tienes personajes</p>
              <p className="text-[10px] text-white/20 mt-1">Crea uno en la tabs</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-[#F5C76B]" />
            <h3 className="text-sm font-black text-white/80 font-stats uppercase tracking-wider">
              Gestión
            </h3>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="secondary" 
              className="w-full justify-start gap-3"
              onClick={() => useGameStore.getState().openFullInventory()}
            >
              <Package size={18} />
              <span className="font-stats">Abrir Inventario</span>
            </Button>
            
            <Button 
              variant="secondary" 
              className="w-full justify-start gap-3"
              onClick={handleChangePassword}
            >
              <Key size={18} />
              <span className="font-stats">Cambiar Contraseña</span>
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-black text-red-400 font-stats uppercase tracking-wider">
              Zona de Peligro
            </h3>
          </div>
          
          {showResetConfirm ? (
            <div className="space-y-3">
              <p className="text-xs text-red-300 font-stats">
                ¿Estás seguro? Perderás todos tus personajes, items y progreso.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleResetAccount}
                  disabled={loading}
                >
                  {loading ? 'Reiniciando...' : 'Confirmar Reset'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="secondary" 
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => setShowResetConfirm(true)}
            >
              <AlertTriangle size={16} className="mr-2" />
              Reiniciar Cuenta
            </Button>
          )}
        </div>

        {/* Version */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-white/20 font-stats">Epic RPG v2.0 • Leem0n Studio</p>
        </div>
      </div>
    </ViewShell>
  );
}

function CharacterCard({ unit, onSelect }: { unit: GameUnit; onSelect: () => void }) {
  const jobIcon = AssetService.getJobIconUrl(unit.current_job_id || 'novice');
  const jobSprite = AssetService.getJobSpriteUrl(unit.current_job_id || 'novice');
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="p-3 rounded-xl bg-[#1a1a2e]/60 border border-white/5 text-left hover:border-[#F5C76B]/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center">
          {jobSprite ? (
            <img src={jobSprite} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-white/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white font-display truncate">
            {unit.name || 'Sin nombre'}
          </p>
          <p className="text-[10px] text-[#F5C76B] font-stats uppercase">
            Lv.{unit.level} • {unit.current_job_id || 'Novato'}
          </p>
        </div>
        {unit.level >= 50 && (
          <Crown size={14} className="text-[#F5C76B]" />
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[8px]">
        <div className="text-center">
          <span className="text-white/40">ATQ</span>
          <div className="font-black text-white">{unit.base_stats?.atk || 0}</div>
        </div>
        <div className="text-center">
          <span className="text-white/40">DEF</span>
          <div className="font-black text-white">{unit.base_stats?.def || 0}</div>
        </div>
        <div className="text-center">
          <span className="text-white/40">VEL</span>
          <div className="font-black text-white">{unit.base_stats?.agi || 0}</div>
        </div>
      </div>
    </motion.button>
  );
}