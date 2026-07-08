import React from 'react';
import { Link } from 'wouter';
import { Mail, Phone, MapPin, GitBranch, Share2, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                SK
              </div>
              <span>SKY4444</span>
            </Link>
            <p className="text-sm text-slate-400 mb-4">
              The Strategic Digital Ecosystem Where Every Action Matters
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors">
                <GitBranch className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors">
                <ExternalLink className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors">
                <Heart className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors">
                <Share2 className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Finance & Trading */}
          <div>
            <h3 className="font-semibold text-white mb-4">💰 Finance</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/trading" className="hover:text-pink-400 transition-colors">Trading</Link></li>
              <li><Link href="/portfolio" className="hover:text-pink-400 transition-colors">Portfolio</Link></li>
              <li><Link href="/wallet" className="hover:text-pink-400 transition-colors">Wallet</Link></li>
              <li><Link href="/mining" className="hover:text-pink-400 transition-colors">Mining</Link></li>
              <li><Link href="/staking" className="hover:text-pink-400 transition-colors">Staking</Link></li>
              <li><Link href="/yield-farming" className="hover:text-pink-400 transition-colors">Yield Farming</Link></li>
            </ul>
          </div>

          {/* Community & Social */}
          <div>
            <h3 className="font-semibold text-white mb-4">👥 Community</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/feed" className="hover:text-pink-400 transition-colors">Social Feed</Link></li>
              <li><Link href="/profiles" className="hover:text-pink-400 transition-colors">Profiles</Link></li>
              <li><Link href="/communities" className="hover:text-pink-400 transition-colors">Communities</Link></li>
              <li><Link href="/messages" className="hover:text-pink-400 transition-colors">Messaging</Link></li>
              <li><Link href="/followers" className="hover:text-pink-400 transition-colors">Followers</Link></li>
              <li><Link href="/creator-economy" className="hover:text-pink-400 transition-colors">Creator Economy</Link></li>
            </ul>
          </div>

          {/* Products & Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">🛍️ Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketplace" className="hover:text-pink-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/games" className="hover:text-pink-400 transition-colors">Gaming</Link></li>
              <li><Link href="/courses" className="hover:text-pink-400 transition-colors">Learning</Link></li>
              <li><Link href="/ai-tools" className="hover:text-pink-400 transition-colors">AI Tools</Link></li>
              <li><Link href="/api-docs" className="hover:text-pink-400 transition-colors">API</Link></li>
              <li><Link href="/analytics-dashboard" className="hover:text-pink-400 transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">⚙️ Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-pink-400 transition-colors">Help Center</Link></li>
              <li><Link href="/docs" className="hover:text-pink-400 transition-colors">Documentation</Link></li>
              <li><Link href="/contact" className="hover:text-pink-400 transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-pink-400 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-pink-400 transition-colors">Terms</Link></li>
              <li><Link href="/security" className="hover:text-pink-400 transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-slate-800 pt-8 mb-8">
          <h3 className="font-semibold text-white mb-4">Get in Touch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white hover:text-pink-400 transition-colors">iitrskylerblue4444@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm text-slate-400">Phone</p>
                <p className="text-white hover:text-pink-400 transition-colors">+1 (479) 387-1040</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm text-slate-400">Address</p>
                <p className="text-white">IITR 1845 Lake Fort Smith Rd, Mountainburg, AR 72946</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800 pt-8 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-500">1,062</p>
            <p className="text-sm text-slate-400">Pages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">1,095</p>
            <p className="text-sm text-slate-400">Routes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-500">320+</p>
            <p className="text-sm text-slate-400">API Endpoints</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">1M+</p>
            <p className="text-sm text-slate-400">Lines of Code</p>
          </div>
        </div>

        {/* Project Info */}
        <div className="border-t border-slate-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold text-white mb-2">🚀 Production Status</p>
              <p className="text-slate-400">✅ Production Ready (RC1) • Fully Deployed • All Systems Operational</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">🏗️ Architecture</p>
              <p className="text-slate-400">React 19 • Tailwind 4 • Express 4 • tRPC 11 • MySQL/TiDB • Manus OAuth</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">📊 Features</p>
              <p className="text-slate-400">Trading • Crypto • Marketplace • Social • Gaming • Learning • Creator • AI</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>&copy; 2026 SKY4444. All rights reserved. Built with ❤️ by Skyler Blue</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy"><a className="hover:text-pink-400 transition-colors">Privacy Policy</a></Link>
            <Link href="/terms"><a className="hover:text-pink-400 transition-colors">Terms of Service</a></Link>
            <Link href="/cookies"><a className="hover:text-pink-400 transition-colors">Cookie Policy</a></Link>
            <Link href="/sitemap"><a className="hover:text-pink-400 transition-colors">Sitemap</a></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
