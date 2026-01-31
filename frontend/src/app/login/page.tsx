'use client';

import { useAuth } from '@/components/AuthProvider';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Mail, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginMode = 'student' | 'staff';

export default function LoginPage() {
   const [loginMode, setLoginMode] = useState<LoginMode>('student');
   const [studentId, setStudentId] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { login } = useAuth();

   // Super Admin maxfiy ma'lumotlari
   const SUPER_ADMIN_EMAIL = 'xurshidbekxasanboyev@kuafcv.uz';
   const SUPER_ADMIN_PASS = 'otamonam9900';

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      // Login uchun email ni aniqlash
      let loginEmail = '';

      if (loginMode === 'student') {
         // Student ID dan email yasash
         if (!studentId.trim()) {
            setError('Student ID kiriting');
            setLoading(false);
            return;
         }
         // Faqat raqamlar yoki oddiy ID qabul qilish
         const cleanId = studentId.trim();
         loginEmail = `${cleanId}@student.kuafcv.uz`;
      } else {
         // Staff uchun to'liq email
         loginEmail = email.trim();
      }

      try {
         // Super Admin uchun maxsus panel
         if (loginEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
            if (password === SUPER_ADMIN_PASS) {
               sessionStorage.setItem('xk_super_token_9m2v7p', 'authenticated');
               router.push('/xk9m2v7p');
               return;
            } else {
               setError('Parol noto\'g\'ri');
               setLoading(false);
               return;
            }
         }

         await login(loginEmail, password);
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
                     <div className="bg-white p-3 rounded-xl shadow-xl">
                        <Image src="/logo.svg" alt="Kokand University Logo" width={220} height={75} className="object-contain" />
                     </div>
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
                  <div className="lg:hidden mx-auto mb-4 bg-white p-4 rounded-2xl shadow-xl">
                     <Image src="/logo.svg" alt="Logo" width={200} height={70} className="object-contain" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">Xush kelibsiz</h1>
                  <p className="text-slate-500">Shaxsiy kabinetingizga kirish uchun ma'lumotlarni kiriting</p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                  {/* Login Mode Tabs */}
                  <div className="flex mb-6 bg-slate-100 p-1 rounded-xl">
                     <button
                        type="button"
                        onClick={() => { setLoginMode('student'); setError(''); }}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMode === 'student'
                           ? 'bg-white text-[#991B1B] shadow-sm'
                           : 'text-slate-500 hover:text-slate-700'
                           }`}
                     >
                        <User size={16} />
                        Talaba
                     </button>
                     <button
                        type="button"
                        onClick={() => { setLoginMode('staff'); setError(''); }}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${loginMode === 'staff'
                           ? 'bg-white text-[#991B1B] shadow-sm'
                           : 'text-slate-500 hover:text-slate-700'
                           }`}
                     >
                        <Mail size={16} />
                        Xodim
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                     {loginMode === 'student' ? (
                        <div className="space-y-2">
                           <Label htmlFor="studentId" className="text-slate-700 font-medium">Student ID</Label>
                           <div className="relative">
                              <Input
                                 id="studentId"
                                 type="text"
                                 placeholder="12345"
                                 value={studentId}
                                 onChange={(e) => setStudentId(e.target.value.replace(/\s/g, ''))}
                                 required
                                 className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all font-medium pr-36"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">
                                 @student.kuafcv.uz
                              </span>
                           </div>
                           <p className="text-xs text-slate-400">Faqat Student ID raqamini kiriting</p>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                           <Input
                              id="email"
                              type="email"
                              placeholder="name@kuafcv.uz"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all font-medium"
                           />
                        </div>
                     )}

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
               </div>

               <p className="text-center text-sm text-slate-400">
                  Hisobingiz yo'qmi? <span className="text-[#991B1B] font-semibold cursor-pointer hover:underline">Ro'yxatdan o'tish</span>
               </p>
            </div>
         </div>
      </div>
   );
}
