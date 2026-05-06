'use client'

import Link from 'next/link'
import { Sword, ShoppingBag, Gem, Crown, Sparkles, Package, Zap } from 'lucide-react'
import { motion } from 'motion/react'

const coins = [
  { amount: 100, price: 0.99, bonus: 0 },
  { amount: 500, price: 4.99, bonus: 50 },
  { amount: 1200, price: 9.99, bonus: 200 },
  { amount: 2800, price: 19.99, bonus: 500 },
  { amount: 6500, price: 39.99, bonus: 1500 },
  { amount: 15000, price: 79.99, bonus: 4000 },
]

const bundles = [
  {
    name: 'Pack Inicial',
    price: 4.99,
    original: 9.99,
    items: ['500 Monedas', 'Skin Exclusiva', '3 Cartas Raras'],
    badge: 'BEST VALUE',
    color: 'from-purple-500 to-cyan-500'
  },
  {
    name: 'Battle Pass Season 1',
    price: 9.99,
    original: null,
    items: ['1000 Monedas', 'Skin Épica', 'Accesorio Legendario', 'Todas las recompensas'],
    badge: 'POPULAR',
    color: 'from-amber-500 to-orange-500'
  },
  {
    name: 'Mega Pack',
    price: 19.99,
    original: 39.99,
    items: ['2500 Monedas', 'Skin Épica', '10 Cartas Épicas', 'Boost de EXP 7 días'],
    badge: '50% OFF',
    color: 'from-red-500 to-pink-500'
  },
]

const cosmetics = [
  { name: 'Skin: Guerrero Dorado', type: 'Skin', rarity: 'Legendario', price: 1500 },
  { name: 'Skin: Mago Sombras', type: 'Skin', rarity: 'Épico', price: 800 },
  { name: 'Efecto: Partículas de Fuego', type: 'Efecto', rarity: 'Raro', price: 400 },
  { name: 'Marco: Legendario', type: 'Marco', rarity: 'Épico', price: 600 },
  { name: 'Emote: Victoria', type: 'Emote', rarity: 'Raro', price: 300 },
  { name: 'Título: Maestría', type: 'Título', rarity: 'Épico', price: 500 },
]

export default function StorePage() {
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
              { href: '/web/profile', label: 'Perfil' },
              { href: '/web/media', label: 'Multimedia' },
              { href: '/web/store', label: 'Tienda', active: true },
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
          <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest">Tienda</span>
          <h1 className="text-5xl md:text-6xl font-black font-display mt-2">COMPRA MONEDAS</h1>
          <p className="text-white/50 text-lg mt-4">Obtén monedas y cosmética exclusiva</p>
        </div>
      </section>

      {/* Coins */}
      <section className="px-6 mb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
            <Gem className="w-6 h-6 text-yellow-400" />
            Paquetes de Monedas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {coins.map((coin, i) => (
              <motion.div
                key={coin.amount}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Gem className="w-8 h-8 text-yellow-400" />
                  <span className="text-2xl font-black">{coin.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">${coin.price}</span>
                  {coin.bonus > 0 && (
                    <span className="text-green-400 text-sm font-bold">+{coin.bonus}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundles */}
      <section className="px-6 mb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
            <Package className="w-6 h-6 text-purple-400" />
            Bundles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {bundles.map((bundle, i) => (
              <motion.div
                key={bundle.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {bundle.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r ${bundle.color} rounded-full text-xs font-bold uppercase`}>
                    {bundle.badge}
                  </div>
                )}
                <div className={`p-6 bg-gradient-to-br ${bundle.color} rounded-2xl bg-opacity-10 border border-white/20`}>
                  <h3 className="text-xl font-black mb-4">{bundle.name}</h3>
                  <ul className="space-y-2 mb-6">
                    {bundle.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-white/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between">
                    {bundle.original && (
                      <span className="text-white/40 line-through">${bundle.original}</span>
                    )}
                    <span className="text-2xl font-black">${bundle.price}</span>
                  </div>
                  <button className="w-full mt-4 py-3 bg-white rounded-xl font-bold uppercase text-sm hover:bg-white/90 transition-colors">
                    Comprar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cosmetics */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
            <Crown className="w-6 h-6 text-pink-400" />
            Cosméticos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cosmetics.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                  {item.type === 'Skin' ? <Crown className="w-6 h-6 text-purple-400" /> :
                   item.type === 'Efecto' ? <Zap className="w-6 h-6 text-yellow-400" /> :
                   <Sparkles className="w-6 h-6 text-pink-400" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{item.name}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${
                      item.rarity === 'Legendario' ? 'text-yellow-400' :
                      item.rarity === 'Épico' ? 'text-purple-400' :
                      'text-blue-400'
                    }`}>
                      {item.rarity}
                    </span>
                    <span className="text-white/40 text-xs">{item.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Gem className="w-4 h-4" />
                    {item.price}
                  </div>
                </div>
              </motion.div>
            ))}
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

