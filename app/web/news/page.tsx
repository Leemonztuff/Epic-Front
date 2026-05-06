'use client'

import Link from 'next/link'
import { Sword, ChevronRight, Calendar, Tag } from 'lucide-react'
import { motion } from 'motion/react'

const newsPosts = [
  {
    id: 1,
    title: 'Nueva expansión: Sombras del Vacío',
    excerpt: 'Explora el nuevo biome shadowlands con más de 20 nuevos items y la clase Nigromante.',
    date: '28 Abril 2026',
    category: 'Actualización',
    image: 'shadow'
  },
  {
    id: 2,
    title: 'Temporada 1 de Torre Infinita',
    excerpt: 'Competitivo tower climbing con recompensas exclusivas de temporada.',
    date: '25 Abril 2026',
    category: 'Evento',
    image: 'tower'
  },
  {
    id: 3,
    title: 'Patch 2.5 - Balance de Clases',
    excerpt: 'Ajustes de balance para Pícaro y mejoras en el sistema de habilidades.',
    date: '20 Abril 2026',
    category: 'Patch Notes',
    image: 'balance'
  },
  {
    id: 4,
    title: 'Nuevo evento: Festival de Primavera',
    excerpt: 'Eventos limitados, recompensas exclusivas y items de temporada.',
    date: '15 Abril 2026',
    category: 'Evento',
    image: 'event'
  },
  {
    id: 5,
    title: 'Guía: Domina el Nigromante',
    excerpt: 'Aprende a usar la nueva clase con nuestra guía completa de builds.',
    date: '10 Abril 2026',
    category: 'Guía',
    image: 'guide'
  },
  {
    id: 6,
    title: 'Arena PvP - Temporada 3',
    excerpt: 'Nuevas recompensas ranked y ladder reset para la nueva temporada.',
    date: '5 Abril 2026',
    category: 'Evento',
    image: 'pvp'
  }
]

const categories = ['Todos', 'Actualización', 'Evento', 'Patch Notes', 'Guía']

export default function NewsPage() {
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
              { href: '/web/news', label: 'News', active: true },
              { href: '/web/database', label: 'Database' },
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
          <span className="text-purple-400 text-sm font-bold uppercase tracking-widest">Boletín</span>
          <h1 className="text-5xl md:text-6xl font-black font-display mt-2">NOVEDADES</h1>
          <p className="text-white/50 text-lg mt-4">Todas las actualizaciones, eventos y noticias del juego</p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 mb-12">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                cat === 'Todos' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* News Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          {newsPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all"
            >
              <div className={`h-40 bg-gradient-to-br ${
                post.image === 'shadow' ? 'from-purple-900 to-black' :
                post.image === 'tower' ? 'from-amber-900 to-black' :
                post.image === 'balance' ? 'from-cyan-900 to-black' :
                post.image === 'event' ? 'from-pink-900 to-black' :
                post.image === 'guide' ? 'from-blue-900 to-black' :
                'from-red-900 to-black'
              }`}>
                <div className="w-full h-full flex items-center justify-center">
                  <Tag className="w-12 h-12 text-white/20" />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-3">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold uppercase">
                    {post.category}
                  </span>
                  <span className="text-white/40 text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {post.date}
                  </span>
                </div>
                <h3 className="text-xl font-black font-display mb-2 group-hover:text-purple-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-white/50 text-sm mb-4">{post.excerpt}</p>
                <button className="flex items-center gap-2 text-purple-400 text-sm font-bold uppercase tracking-wider group-hover:gap-3 transition-all">
                  Leer más <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto text-center text-white/30 text-sm">
          © 2026 Epic RPG. Todos los derechos reservados.
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}