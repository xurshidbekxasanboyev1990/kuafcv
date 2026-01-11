import re

file_path = r'frontend\src\app\xk9m2v7p\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add API_URL constant after TabType
content = content.replace(
    "type TabType = 'dashboard' | 'students' | 'staff' | 'portfolios' | 'categories' | 'webhooks' | 'ai' | 'announcements' | 'notifications' | 'settings' | 'system';\n\nexport default function SuperAdminPage() {",
    "type TabType = 'dashboard' | 'students' | 'staff' | 'portfolios' | 'categories' | 'webhooks' | 'ai' | 'announcements' | 'notifications' | 'settings' | 'system';\n\nconst API_URL = process.env.NEXT_PUBLIC_API_URL || '';\n\nexport default function SuperAdminPage() {"
)

# Replace fetch('/api/ with fetch(`${API_URL}/api/
content = re.sub(r"fetch\('(/api/[^']+)'", r"fetch(`${API_URL}\1`", content)

# Replace fetch(`/api/ with fetch(`${API_URL}/api/
content = re.sub(r"fetch\(`(/api/[^`]+)`", r"fetch(`${API_URL}\1`", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ API URLs yangilandi!")
