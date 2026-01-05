'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Phone,
  Mail,
  Loader2,
  Sparkles,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: number;
  question: string;
  category: string;
}

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [contactInfo, setContactInfo] = useState({
    admin_email: 'admin@kuafcv.uz',
    admin_phone: '+998 71 123 45 67',
    admin_telegram: '@kuafcv_admin',
    registrar_email: 'registrar@kuafcv.uz',
    registrar_phone: '+998 71 234 56 78',
    registrar_location: 'A korpus, 105-xona',
    registrar_working_hours: '09:00 - 18:00 (Dushanba - Juma)',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time polling for contact info - har 5 sekundda yangilanadi
  useEffect(() => {
    fetchContactInfo(); // Dastlab yuklash
    
    const interval = setInterval(() => {
      fetchContactInfo();
    }, 5000); // Har 5 sekundda
    
    return () => clearInterval(interval);
  }, []);

  // Load suggestions when opened
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContactInfo = async () => {
    try {
      const res = await fetch('/api/settings/public');
      const data = await res.json();
      if (data.settings) {
        const s = data.settings;
        setContactInfo({
          admin_email: s.admin_email || 'admin@kuafcv.uz',
          admin_phone: s.admin_phone || '+998 71 123 45 67',
          admin_telegram: s.admin_telegram || '@kuafcv_admin',
          registrar_email: s.registrar_email || 'registrar@kuafcv.uz',
          registrar_phone: s.registrar_phone || '+998 71 234 56 78',
          registrar_location: s.registrar_location || 'A korpus, 105-xona',
          registrar_working_hours: s.registrar_working_hours || '09:00 - 18:00',
        });
      }
    } catch (err) {
      console.error('Failed to load contact info');
    }
  };

  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/suggestions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions');
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, type: 'support' }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Kechirasiz, javob olishda xatolik yuz berdi.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xatolik yuz berdi. Iltimos, Admin yoki Registrator office bilan bog\'laning.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        style={{ background: '#991B1B' }}
        aria-label="Yordam chatini ochish"
      >
        <MessageCircle size={24} />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
          AI
        </span>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="text-white p-4" style={{ background: '#991B1B' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Yordam Markazi</h3>
                <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  AI yordamchi online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Chatni yopish"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowContacts(!showContacts)}
              className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={14} />
              Admin bilan bog'lanish
            </button>
            <button
              onClick={() => setShowContacts(!showContacts)}
              className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={14} />
              Registrator office
            </button>
          </div>

          {/* Contact Info Dropdown */}
          {showContacts && (
            <div className="mt-3 p-3 bg-white/10 rounded-lg text-sm space-y-2 animate-fadeIn">
              <p className="font-semibold text-white/80 mb-2">Admin:</p>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{contactInfo.admin_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>{contactInfo.admin_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span>Telegram: {contactInfo.admin_telegram}</span>
              </div>
              <hr className="border-white/20 my-2" />
              <p className="font-semibold text-white/80 mb-2">Registrator:</p>
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{contactInfo.registrar_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <span>{contactInfo.registrar_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{contactInfo.registrar_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🕐</span>
                <span>{contactInfo.registrar_working_hours}</span>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)' }}>
                <Sparkles size={28} style={{ color: '#991B1B' }} />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Salom! 👋</h4>
              <p className="text-sm text-gray-500 mb-4">
                Men sizga Portfolio tizimi bo'yicha yordam beraman
              </p>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Tez-tez so'raladigan savollar:</p>
                  {suggestions.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSuggestionClick(s.question)}
                      className="block w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(153, 27, 27, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(153, 27, 27, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <HelpCircle size={14} className="inline mr-2" style={{ color: '#991B1B' }} />
                      {s.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                  style={msg.role === 'user' ? { background: '#991B1B' } : {}}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.role === 'user' ? '' : 'text-gray-400'
                    }`}
                    style={msg.role === 'user' ? { color: 'rgba(255, 255, 255, 0.7)' } : {}}
                  >
                    {msg.timestamp.toLocaleTimeString('uz-UZ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" style={{ color: '#991B1B' }} />
                  <span className="text-sm text-gray-500">AI yozmoqda...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savolingizni yozing..."
              className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-400 text-sm"
              style={{ outline: 'none' }}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(153, 27, 27, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#991B1B' }}
              onMouseEnter={(e) => !input.trim() || loading ? null : e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              aria-label="Xabar yuborish"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            GPT-4o model bilan ishlaydi
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
