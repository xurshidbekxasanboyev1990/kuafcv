// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
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
