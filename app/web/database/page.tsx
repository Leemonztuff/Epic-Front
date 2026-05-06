'use client'

import Link from 'next/link'
import { Sword, Search, Filter, Shield, Zap, Crown, Users, Hexagon, Star } from 'lucide-react'
import { motion } from 'motion/react'

const items = [
  { name: 'Espada del Vacío', rarity: 'Épico', type: 'Arma', damage: 120, effect: '+15% crítico en sombras', lore: 'Creada en los restos de una estrella moribunda...' },
  { name: 'Escudo de Cristal', rarity: 'Raro', type: 'Armadura', defense: 85, effect: '+20% resistencia mágica', lore: 'Un cristal que absorbe energía oscura.' },
  { name: 'Amuleto del Dragón', rarity: 'Legendario', type: 'Accesorio', effect: '+10% daño fuego', lore: 'Contiene el aliento de un dragón antiguo.' },
  { name: 'Poción de Velocidad', rarity: 'Común', type: 'Consumible', effect: '+50% velocidad 30s', lore: 'Una mezcla que acelera los movimientos.' },
  { name: 'Daga del Asesino', rarity: 'Épico', type: 'Arma', damage: 95, effect: 'Golpe crítico guaranteeado al inicio', lore: 'Empolvada con veneno de serpiente.' },
  { name: 'Armadura de Huesos', rarity: 'Raro', type: 'Armadura', defense: 110, effect: '+15% probabilidad de恐惧', lore: 'Forjada con huesos de gigantes caídos.' },
]

const classes = [
  { name: 'Guerrero', style: 'Tanque/DPS', difficulty: 'Baja', desc: 'Combate cuerpo a cuerpo con alta defensa y daño sostenido.' },
  { name: 'Mago', style: 'DPS/AOE', difficulty: 'Media', desc: 'Invoca magia elemental para daño masivo en área.' },
  { name: 'Pícaro', style: 'Asesino', difficulty: 'Alta', desc: 'Combate ágil con alta movilidad y daño crítico.' },
  { name: 'Nigromante', style: 'Control/Invocación', difficulty: 'Alta', desc: 'Invoca sombras y absorbe vida de enemigos.' },
  { name: 'Paladín', style: 'Soporte/Tanque', difficulty: 'Baja', desc: 'Combina sanación con defensa divina.' },
]

const tabs = [
  { id: 'items', label: 'Items', icon: Sword },
  { id: 'cards', label: 'Cartas', icon: Zap },
  { id: 'classes', label: 'Clases', icon: Shield },
  { id: 'enemies', label: 'Enemigos', icon: Crown },
]

export default function DatabasePage() {
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
              { href: '/web/database', label: 'Database', active: true },
              { href: '/web/profile', label: 'Perfil' },
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

      {/* Header */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">Base de Datos</span>
          <h1 className="text-5xl md:text-6xl font-black font-display mt-2">EXPLORA EL MUNDO</h1>
          <p className="text-white/50 text-lg mt-4">Wiki completa del juego: items, cartas, clases y enemigos</p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-6 mb-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input 
              type="text" 
              placeholder="Buscar: espada, carta, boss..." 
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:border-purple-500/50 outline-none transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:bg-white/10 transition-colors">
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 mb-8">
        <div className="max-w-4xl mx-auto flex gap-3 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tab.id === 'items' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Items */}
          <div className="space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black font-display">{item.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        item.rarity === 'Legendario' ? 'bg-yellow-500/20 text-yellow-400' :
                        item.rarity === 'Épico' ? 'bg-purple-500/20 text-purple-400' :
                        item.rarity === 'Raro' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-white/20 text-white/60'
                      }`}>
                        {item.rarity}
                      </span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white/60 uppercase">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mb-2">{item.effect}</p>
                    <p className="text-white/30 text-xs italic">&#34;{item.lore}&#34;</p>
                  </div>
                  <div className="text-right">
                    {item.damage && <div className="text-red-400 font-bold">ATQ {item.damage}</div>}
                    {item.defense && <div className="text-cyan-400 font-bold">DEF {item.defense}</div>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Classes Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" />
              Clases
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {classes.map((cls, i) => (
                <motion.div
                  key={cls.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{cls.name}</h3>
                      <span className="text-white/40 text-sm">{cls.style}</span>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
                      cls.difficulty === 'Alta' ? 'bg-red-500/20 text-red-400' :
                      cls.difficulty === 'Media' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {cls.difficulty}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm">{cls.desc}</p>
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

