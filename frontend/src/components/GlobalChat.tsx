'use client';

import { useAuth } from './AuthProvider';
import SupportChat from './SupportChat';

export default function GlobalChat() {
  const { user, loading } = useAuth();

  // Login sahifasida yoki loading paytida ko'rsatmaslik
  if (loading || !user) {
    return null;
  }

  return <SupportChat />;
}
