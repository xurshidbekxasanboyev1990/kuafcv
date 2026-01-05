'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

interface CaptchaProps {
  onCaptchaChange: (captchaId: string, captchaCode: string) => void;
  error?: boolean;
}

export default function Captcha({ onCaptchaChange, error }: CaptchaProps) {
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<number>(0);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setCaptchaCode('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/captcha/generate`);
      const data = await response.json();
      
      if (data.captcha_id && data.image) {
        setCaptchaId(data.captcha_id);
        setCaptchaImage(data.image);
        setExpiresAt(Date.now() + (data.expires_in * 1000));
        onCaptchaChange(data.captcha_id, '');
      }
    } catch (error) {
      console.error('CAPTCHA yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  }, [onCaptchaChange]);

  // Load CAPTCHA on mount
  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  // Auto-refresh CAPTCHA before expiration
  useEffect(() => {
    if (expiresAt > 0) {
      const timeout = setTimeout(() => {
        fetchCaptcha();
      }, expiresAt - Date.now() - 5000); // Refresh 5 seconds before expiration

      return () => clearTimeout(timeout);
    }
  }, [expiresAt, fetchCaptcha]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setCaptchaCode(value);
    onCaptchaChange(captchaId, value);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Shield size={16} className="text-red-500" />
        Tekshiruv kodi
      </label>
      
      <div className="flex items-center gap-3">
        {/* CAPTCHA Image */}
        <div className={`relative flex-shrink-0 bg-white border-2 rounded-xl overflow-hidden transition-colors ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}>
          {loading ? (
            <div className="w-[280px] h-[90px] flex items-center justify-center bg-white border border-gray-200 rounded-xl">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : captchaImage ? (
            <img 
              src={captchaImage} 
              alt="CAPTCHA" 
              className="w-[280px] h-[90px] object-contain select-none border border-gray-200 rounded-xl bg-white"
              draggable={false}
            />
          ) : (
            <div className="w-[280px] h-[90px] flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 text-sm">
              Yuklanmoqda...
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={loading}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 hover:text-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Yangi kod olish"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Input Field */}
        <div className="flex-1">
          <input
            type="text"
            value={captchaCode}
            onChange={handleCodeChange}
            placeholder="Tekshiruv kodini kiriting"
            maxLength={6}
            autoComplete="off"
            className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 placeholder-gray-400 transition-all duration-200 uppercase tracking-widest font-mono ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">
          Tekshiruv kodi noto'g'ri. Qaytadan urinib ko'ring.
        </p>
      )}
    </div>
  );
}
