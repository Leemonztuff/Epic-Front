'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Shield, Sword, Sparkles, Users, Crown, Trophy, Castle, ChevronRight, Play, Star, Zap, Heart, Mail, Image, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'

export default function WebHomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
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
              { href: '/web', label: 'Home', active: true },
              { href: '/web/news', label: 'News' },
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

          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/" className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors">
              Jugar
            </Link>
            <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-sm font-bold uppercase tracking-wider hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all">
              Crear Cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] aspect-[2/1] bg-purple-600/10 blur-[200px] rounded-full pointer-events-none" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(147,51,234,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {useMemo(() => 
            [...Array(20)].map((_, i) => ({
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
              duration: 3 + (i % 4),
              delay: (i % 3) * 0.5,
              opacity: 0.3 + (i % 3) * 0.2
            })), []).map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animation: `float ${particle.duration}s ease-in-out infinite`,
                animationDelay: `${particle.delay}s`,
                opacity: particle.opacity
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 text-sm font-bold uppercase tracking-widest">
              Disponible Ahora
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tight font-display mb-6"
          >
            DOMINA EL <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400">CAOS</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/60 font-light mb-10 max-w-2xl mx-auto"
          >
            Construye tu leyenda en un mundo de fantasía oscuro. Colecciona cartas, domina habilidades y conquista los无尽 dungeons.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-lg font-bold uppercase tracking-wider hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] transition-all"
            >
              <span className="flex items-center gap-3">
                <Play className="w-5 h-5" />
                Jugar Ahora
              </span>
            </Link>
            <button className="group px-8 py-4 border border-white/20 rounded-2xl text-lg font-bold uppercase tracking-wider hover:bg-white/5 transition-all flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4" />
              </div>
              Ver Trailer
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
        >
          <ChevronRight className="w-8 h-8 rotate-90" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-purple-900/10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-purple-400 text-sm font-bold uppercase tracking-widest">Características</span>
            <h2 className="text-4xl md:text-5xl font-black font-display mt-2">SISTEMA DE COMBATE</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sword,
                title: 'Combate Estratégico',
                desc: 'Sistema de cartas con sinergias y combos. Cada partida es única.',
                color: 'from-red-500 to-orange-500'
              },
              {
                icon: Sparkles,
                title: 'Colección Profunda',
                desc: 'Más de 200 cartas, habilidades y items. Construye tu mazo perfecto.',
                color: 'from-cyan-500 to-blue-500'
              },
              {
                icon: Crown,
                title: 'Progresión Adictiva',
                desc: '50 niveles, clases únicas, tower infinita y PvP competitivo.',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative p-8 bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black font-display mb-3">{feature.title}</h3>
                <p className="text-white/50">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Content Section */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between mb-16"
          >
            <div>
              <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">Contenido Activo</span>
              <h2 className="text-4xl md:text-5xl font-black font-display mt-2">EVENTOS LIVE</h2>
            </div>
            <Link href="/web/news" className="mt-4 md:mt-0 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Evento: Sombras del Vacío',
                desc: 'Nuevas quests, items épicos y la nueva clase Nigromante',
                badge: 'ACTIVO',
                badgeColor: 'bg-green-500',
                days: '3 días restantes'
              },
              {
                title: 'Torre Infinita - Season 1',
                desc: 'Competitive tower climbing with exclusive rewards',
                badge: 'NUEVO',
                badgeColor: 'bg-purple-500',
                days: '12 días restantes'
              }
            ].map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-6 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/20 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 ${event.badgeColor} rounded-full text-xs font-bold uppercase`}>
                    {event.badge}
                  </span>
                  <span className="text-white/40 text-sm">{event.days}</span>
                </div>
                <h3 className="text-2xl font-black font-display mb-2">{event.title}</h3>
                <p className="text-white/50">{event.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Progression Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-purple-900/5">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-yellow-400 text-sm font-bold uppercase tracking-widest">Progresión</span>
            <h2 className="text-4xl md:text-5xl font-black font-display mt-2">CONSTRUYE TU LEYENDA</h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Star, label: '50 Niveles', desc: 'Sistema de progresión profundo' },
              { icon: Users, label: 'Clases Únicas', desc: 'Cada clase tiene habilidades distintas' },
              { icon: Trophy, label: 'PvP Ranked', desc: 'Compite por la cima del leaderboard' },
              { icon: Castle, label: 'Torre Infinita', desc: 'Desafía los 50 pisos' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center hover:border-purple-500/30 transition-colors"
              >
                <item.icon className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">{item.label}</h3>
                <p className="text-white/40 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Skill Tree Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/20 rounded-3xl"
          >
            <h3 className="text-2xl font-black font-display mb-6 text-center">Árbol de Habilidades</h3>
            <div className="flex justify-center gap-8 flex-wrap">
              {['Guerrero', 'Mago', 'Pícaro', 'Nigromante', 'Paladín'].map((cls, i) => (
                <div key={cls} className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                    <Shield className="w-10 h-10" />
                  </div>
                  <span className="text-sm font-bold text-white/60">{cls}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-purple-900/10 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black font-display mb-6">
              EMPIEZA TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">AVENTURA</span>
            </h2>
            <p className="text-xl text-white/50 mb-10">
              Únete a miles de jugadores en el mundo más adictivo de fantasía oscura
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link 
                href="/"
                className="px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl text-xl font-bold uppercase tracking-wider hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] transition-all"
              >
                Crear Cuenta Gratis
              </Link>
              <span className="text-white/30">•</span>
              <span className="text-white/40">Sin tarjeta de crédito</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Sword className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black tracking-wider font-display">EPIC<span className="text-purple-400">RPG</span></span>
              </div>
              <p className="text-white/40 text-sm">
                Domina el caos. Construye tu leyenda en el mundo de fantasía oscura más adictivo.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white/80">Navegación</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><Link href="/web" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/web/news" className="hover:text-white transition-colors">News</Link></li>
                <li><Link href="/web/database" className="hover:text-white transition-colors">Database</Link></li>
                <li><Link href="/web/profile" className="hover:text-white transition-colors">Perfil</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white/80">Comunidad</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reddit</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white/80">Legal</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="text-center text-white/30 text-sm">
            © 2026 Epic RPG. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}