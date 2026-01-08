// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Eye, EyeOff, AlertCircle, Sparkles, Zap, Shield, Users } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData?.role === 'STUDENT') {
        router.push('/portfolio');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #F2F3F5, #ffffff, rgba(153, 27, 27, 0.05))' }}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(153, 27, 27, 0.2)' }} />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)', animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)', animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(153, 27, 27, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(153, 27, 27, 0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-float"
            style={{
              backgroundColor: 'rgba(153, 27, 27, 0.2)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10">
        <div className="flex flex-col justify-center px-16 xl:px-24 w-full">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/logo.svg"
              alt="Kokand University"
              width={300}
              height={100}
              className="object-contain"
              priority
            />
          </div>

          {/* Hero Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)', color: '#991B1B' }}>
              <Sparkles size={16} />
              <span>Portfolio Boshqaruv Tizimi</span>
            </div>
            
            <h1 className="text-5xl xl:text-6xl font-bold text-gray-900 leading-tight">
              Ta'lim <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #991B1B, #991B1B)' }}>kelajagi</span><br />
              bugundan boshlanadi
            </h1>
            
            <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
              Raqamli portfolioingizni yarating, yutuqlaringizni namoyish eting va karyerangizni rivojlantiring.
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(to bottom right, #991B1B, #991B1B)', boxShadow: '0 10px 25px rgba(153, 27, 27, 0.25)' }}>
                <Zap className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">Tezkor</h3>
              <p className="text-sm text-gray-500">Bir necha daqiqada</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(to bottom right, #991B1B, #991B1B)', boxShadow: '0 10px 25px rgba(153, 27, 27, 0.25)' }}>
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">Xavfsiz</h3>
              <p className="text-sm text-gray-500">Ma'lumotlar himoyasi</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(to bottom right, #991B1B, #991B1B)', boxShadow: '0 10px 25px rgba(153, 27, 27, 0.25)' }}>
                <Users className="text-white" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900">13,000+</h3>
              <p className="text-sm text-gray-500">Talabalar</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(to bottom right, #991B1B, #991B1B)' }}>
                KU
              </div>
              <div>
                <p className="text-gray-700 italic">"Portfolio tizimi orqali talabalarimiz o'z yutuqlarini professional tarzda namoyish etish imkoniyatiga ega bo'ldi."</p>
                <p className="mt-2 text-sm font-medium text-gray-900">Qo'qon Universiteti Andijon filiali</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.svg"
              alt="Kokand University"
              width={250}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Xush kelibsiz! 👋</h2>
              <p className="text-gray-500">
                Shaxsiy kabinetingizga kirish uchun ma'lumotlarni kiriting
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 border rounded-xl flex items-center gap-3 animate-shake" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)', borderColor: 'rgba(153, 27, 27, 0.2)', color: '#991B1B' }}>
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email manzil
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sizning@email.uz"
                    required
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
                    style={{ backgroundColor: '#F2F3F5' }}
                    onFocus={(e) => {
                      e.target.style.outline = 'none';
                      e.target.style.borderColor = '#991B1B';
                      e.target.style.boxShadow = '0 0 0 3px rgba(153, 27, 27, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Parol
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl focus:bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
                    style={{ backgroundColor: '#F2F3F5' }}
                    onFocus={(e) => {
                      e.target.style.outline = 'none';
                      e.target.style.borderColor = '#991B1B';
                      e.target.style.boxShadow = '0 0 0 3px rgba(153, 27, 27, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded cursor-pointer"
                    style={{ accentColor: '#991B1B' }}
                  />
                  <span className="text-sm text-gray-600">Eslab qolish</span>
                </label>
                <a href="#" className="text-sm font-medium transition-colors" style={{ color: '#991B1B' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'} onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  Parolni unutdingizmi?
                </a>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg overflow-hidden group"
                style={{ 
                  background: 'linear-gradient(to right, #991B1B, #991B1B)',
                  boxShadow: '0 10px 25px rgba(153, 27, 27, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(153, 27, 27, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(153, 27, 27, 0.25)';
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Kirish...</span>
                    </>
                  ) : (
                    <>
                      <span>Tizimga kirish</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">yoki</span>
              </div>
            </div>

            {/* Quick Access */}
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-500 mb-4">Tezkor kirish</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@kuafcv.uz'); setPassword('admin123'); }}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
                  style={{ backgroundColor: '#F2F3F5' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F2F3F5';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  👨‍💼 Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('registrar@kuafcv.uz'); setPassword('admin123'); }}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
                  style={{ backgroundColor: '#F2F3F5' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F2F3F5';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  📋 Registrar
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            © 2026 Qo'qon Universiteti Andijon filiali. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
