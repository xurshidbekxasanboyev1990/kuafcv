'use client';

import { useAuth } from '@/components/AuthProvider';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { login } = useAuth();

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
         await login(email, password);
         router.push('/dashboard');
      } catch (err: any) {
         setError(err.message || 'Xatolik yuz berdi');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex min-h-screen">
         {/* Left Side: Branding / Marketing (Hidden on Mobile) */}
         <div className="hidden lg:flex w-1/2 bg-[#991B1B] relative overflow-hidden items-center justify-center text-white">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#991B1B] animate-gradient-xy opacity-90 z-0"></div>

            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

            {/* Content */}
            <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full max-w-2xl">
               <div>
                  <div className="flex items-center gap-3 mb-12">
                     <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
                        <Image src="/logo.svg" alt="Logo" width={160} height={160} className="object-contain brightness-0 invert" />
                     </div>
                     <h1 className="text-2xl font-bold tracking-wider font-mono">KUAFCV</h1>
                  </div>

                  <h2 className="text-5xl font-extrabold tracking-tight leading-tight mb-8 drop-shadow-lg">
                     Ta'lim kelajagi <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">bugundan</span> boshlanadi.
                  </h2>
                  <p className="text-xl text-white/90 max-w-lg leading-relaxed font-light">
                     Raqamli portfolioingizni yarating, yutuqlaringizni dunyoga namoyish eting va karyerangizni yangi bosqichga olib chiqing.
                  </p>
               </div>

               <div className="relative">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg">
                     <blockquote className="space-y-4">
                        <p className="text-lg italic font-medium leading-loose">
                           "Portfolio tizimi orqali har bir talaba o'zining professional yo'lini yaratish imkoniyatiga ega. Bu shunchaki CV emas, bu sizning tarixinigiz."
                        </p>
                        <footer className="text-sm font-bold text-yellow-300 flex items-center gap-2">
                           <span className="w-8 h-0.5 bg-yellow-300 inline-block"></span>
                           Qo'qon Universiteti Andijon filiali
                        </footer>
                     </blockquote>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Side: Form */}
         <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

            <div className="w-full max-w-[440px] space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               <div className="flex flex-col space-y-2 text-center">
                  <div className="lg:hidden mx-auto mb-4 bg-[#991B1B] p-4 rounded-2xl shadow-xl shadow-red-900/20 transform rotate-3">
                     <Image src="/logo.svg" alt="Logo" width={160} height={160} className="brightness-0 invert" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">Xush kelibsiz</h1>
                  <p className="text-slate-500">Shaxsiy kabinetingizga kirish uchun ma'lumotlarni kiriting</p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  <form onSubmit={handleSubmit} className="space-y-5">
                     <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                        <Input
                           id="email"
                           type="email"
                           placeholder="name@example.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           required
                           className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all font-medium"
                        />
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="password" className="text-slate-700 font-medium">Parol</Label>
                           <Button variant="link" size="sm" className="px-0 font-medium text-red-600 hover:text-red-700 h-auto text-xs" type="button">
                              Parolni unutdingizmi?
                           </Button>
                        </div>
                        <div className="relative">
                           <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all font-medium pr-10"
                           />
                           <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600"
                              onClick={() => setShowPassword(!showPassword)}
                           >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </Button>
                        </div>
                     </div>

                     {error && (
                        <div className="p-4 text-sm font-medium text-red-600 bg-red-50 rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
                           <AlertCircle className="h-5 w-5 shrink-0" />
                           {error}
                        </div>
                     )}

                     <Button type="submit" className="w-full h-11 bg-[#991B1B] hover:bg-[#7F1717] text-white font-bold shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-2">Kirish <ArrowRight size={18} strokeWidth={2.5} /></span>}
                     </Button>
                  </form>

                  <div className="mt-8 relative">
                     <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                     </div>
                     <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-4 text-slate-400 font-semibold tracking-wider">Tezkor kirish (Demo)</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8">
                     <Button
                        variant="outline"
                        onClick={() => { setEmail('admin@kuafcv.uz'); setPassword('admin123'); }}
                        className="h-10 border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 transition-colors"
                     >
                        Admin
                     </Button>
                     <Button
                        variant="outline"
                        onClick={() => { setEmail('registrar@kuafcv.uz'); setPassword('admin123'); }}
                        className="h-10 border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 transition-colors"
                     >
                        Registrar
                     </Button>
                  </div>
               </div>

               <p className="text-center text-sm text-slate-400">
                  Hisobingiz yo'qmi? <span className="text-[#991B1B] font-semibold cursor-pointer hover:underline">Ro'yxatdan o'tish</span>
               </p>
            </div>
         </div>
      </div>
   );
}
