'use client'

import Link from 'next/link'
import { Sword, Play, Image, Youtube, Instagram, Palette } from 'lucide-react'
import { motion } from 'motion/react'

const videos = [
  { title: 'Trailer Oficial', duration: '2:34', views: '1.2M', type: 'trailer' },
  { title: 'Gameplay - Pícaro', duration: '8:15', views: '450K', type: 'gameplay' },
  { title: 'Eventos de Abril', duration: '3:22', views: '280K', type: 'event' },
  { title: 'Tutorial: Nigromante', duration: '6:45', views: '320K', type: 'guide' },
]

const screenshots = [
  'Combate', 'Menú Principal', 'Torre Infinita', 'PvP Arena',
  'Inventory', 'Clases', 'Mapa', 'Eventos'
]

const fanArt = [
  { title: 'Guerrero vs Dragón', artist: '@Artista1', likes: '2.4K' },
  { title: 'Nigromante Concept', artist: '@Artista2', likes: '1.8K' },
  { title: 'Paisaje: Sombras del Vacío', artist: '@Artista3', likes: '3.1K' },
  { title: 'Arte de Menú', artist: '@Artista4', likes: '950' },
]

export default function MediaPage() {
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
              { href: '/web/media', label: 'Multimedia', active: true },
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
          <span className="text-pink-400 text-sm font-bold uppercase tracking-widest">Contenido</span>
          <h1 className="text-5xl md:text-6xl font-black font-display mt-2">MULTIMEDIA</h1>
          <p className="text-white/50 text-lg mt-4">Trailers, gameplay, fan art y capturas</p>
        </div>
      </section>

      {/* Videos Section */}
      <section className="px-6 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
            <Youtube className="w-6 h-6 text-red-400" />
            Videos
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video, i) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-black rounded-2xl overflow-hidden mb-3">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-xs font-bold">
                    {video.duration}
                  </div>
                </div>
                <h3 className="font-bold">{video.title}</h3>
                <span className="text-white/40 text-sm">{video.views} vistas</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="px-6 mb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black font-display mb-6 flex items-center gap-3">
            <Image className="w-6 h-6 text-cyan-400" />
            Capturas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {screenshots.map((screenshot, i) => (
              <motion.div
                key={screenshot}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="aspect-video bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl cursor-pointer overflow-hidden group"
              >
                <div className="w-full h-full flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                  <Image className="w-8 h-8 text-white/30" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-sm font-bold">{screenshot}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fan Art Section */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black font-display flex items-center gap-3">
              <Palette className="w-6 h-6 text-pink-400" />
              Fan Art
            </h2>
            <button className="px-4 py-2 bg-pink-600 rounded-xl text-sm font-bold uppercase">
              Subir Arte
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {fanArt.map((art, i) => (
              <motion.div
                key={art.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="aspect-square bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl mb-3 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Palette className="w-12 h-12 text-white/20" />
                  </div>
                </div>
                <h3 className="font-bold text-sm">{art.title}</h3>
                <div className="flex items-center justify-between text-white/40 text-xs">
                  <span>{art.artist}</span>
                  <span>♥ {art.likes}</span>
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

