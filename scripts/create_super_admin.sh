#!/bin/bash
# Super Admin yaratish - production serverda ishlatish
# Ishlatish: bash create_super_admin.sh

# SSH orqali serverga ulanib, bu commandni ishlatish kerak:

docker compose -f /root/kuafcv/docker-compose.prod.yml exec postgres psql -U kuafcv -d kuafcv -c "
INSERT INTO users (
    id,
    email, 
    password_hash, 
    role, 
    full_name, 
    student_id, 
    company_name,
    student_data,
    profile_image,
    permissions,
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'xurshidbekxasanboyev@kuafcv.uz',
    '\$2a\$12\$JCw7Hona.mH.3S7KL/gHX.iSvARfGmc7L/R2T7mg6465WA34FRg3K',
    'ADMIN',
    'Xurshidbek Xasanboyev',
    NULL,
    NULL,
    NULL,
    NULL,
    '{\"all\": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    full_name = EXCLUDED.full_name,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();
"

echo "Super Admin yaratildi!"
echo "Email: xurshidbekxasanboyev@kuafcv.uz"
echo "Parol: otamonam9900"
