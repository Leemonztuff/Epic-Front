'use client'

import Link from 'next/link'
import { Sword, User, Trophy, Calendar, Clock, Star, Shield, Zap, Crown, Share2 } from 'lucide-react'
import { motion } from 'motion/react'

const playerStats = {
  level: 42,
  rank: 'Diamante III',
  playTime: '127 horas',
  wins: 342,
  winRate: '68%',
  currentStreak: 5,
  maxStreak: 12,
}

const achievements = [
  { name: 'Primer Paso', desc: 'Completa el tutorial', icon: Star, completed: true },
  { name: 'Guerrero de las Sombras', desc: 'Derrota al Boss de Chapter 10', icon: Crown, completed: true },
  { name: 'Coleccionista', desc: 'Obten 50 cartas diferentes', icon: Zap, completed: true },
  { name: 'Maestro del PvP', desc: 'Alcanza Diamante', icon: Trophy, completed: true },
  { name: 'Torre Infinita', desc: 'Llega al piso 30', icon: Shield, completed: false },
  { name: 'Nigromante', desc: 'Desbloquea la clase Nigromante', icon: Star, completed: false },
]

const equippedItems = [
  { slot: 'Arma', name: 'Espada del Vacío', rarity: 'Épico' },
  { slot: 'Armadura', name: 'Armadura de Huesos', rarity: 'Raro' },
  { slot: 'Accesorio', name: 'Amuleto del Dragón', rarity: 'Legendario' },
  { slot: 'Accesorio', name: 'Anillo de Sabiduría', rarity: 'Épico' },
]

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/web" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Sword className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-wider font-display">EPIC<span className="text-purple-400">RPG</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '/web', label: 'Home' },
              { href: '/web/news', label: 'News' },
              { href: '/web/database', label: 'Database' },
              { href: '/web/profile', label: 'Perfil', active: true },
              { href: '/web/media', label: 'Multimedia' },
              { href: '/web/store', label: 'Tienda' },
            ].map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                  link.active ? 'text-purple-400' : 'text-white/60 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-sm font-bold uppercase tracking-wider">
            Jugar
          </Link>
        </div>
      </nav>

      {/* Profile Header */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-6xl font-black">
                <User className="w-16 h-16 text-white/50" />
              </div>
              <div className="absolute -bottom-2 -right-2 px-4 py-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-sm font-bold">
                Lv. {playerStats.level}
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-black font-display">Jugador123</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                <span className="px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-sm font-bold">
                  {playerStats.rank}
                </span>
                <span className="text-white/40 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {playerStats.playTime}
                </span>
                <span className="text-white/40 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {playerStats.wins} victorias
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5 text-white/60" />
              </button>
              <button className="px-6 py-3 bg-purple-600 rounded-xl font-bold uppercase text-sm">
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 mb-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Win Rate', value: playerStats.winRate, icon: Trophy, color: 'text-yellow-400' },
            { label: 'Racha Actual', value: playerStats.currentStreak, icon: Star, color: 'text-green-400' },
            { label: 'Racha Máxima', value: playerStats.maxStreak, icon: Crown, color: 'text-purple-400' },
            { label: 'Victorias', value: playerStats.wins, icon: Shield, color: 'text-cyan-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center"
            >
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-white/40 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Inventario */}
          <div>
            <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" />
              Equipado
            </h2>
            <div className="space-y-3">
              {equippedItems.map((item, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <Sword className="w-6 h-6 text-white/40" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-white/40 text-sm">{item.slot}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.rarity === 'Legendario' ? 'bg-yellow-500/20 text-yellow-400' :
                    item.rarity === 'Épico' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {item.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Logros */}
          <div>
            <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Logros
            </h2>
            <div className="space-y-3">
              {achievements.map((ach, i) => (
                <motion.div
                  key={ach.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`p-4 border rounded-xl flex items-center gap-4 ${
                    ach.completed 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-black/20 border-white/5 opacity-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ach.completed 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                      : 'bg-white/10'
                  }`}>
                    <ach.icon className={`w-6 h-6 ${ach.completed ? 'text-white' : 'text-white/30'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{ach.name}</div>
                    <div className="text-white/40 text-sm">{ach.desc}</div>
                  </div>
                  {ach.completed && (
                    <div className="text-green-400">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto text-center text-white/30 text-sm">
          © 2026 Epic RPG. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}

