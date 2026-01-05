# SSL Sertifikatlar uchun papka
# Production'da Let's Encrypt yoki boshqa CA'dan sertifikat oling

# Development uchun self-signed sertifikat yaratish:
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout key.pem -out cert.pem \
#   -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=KUAFCV/CN=localhost"

# Production uchun:
# certbot certonly --standalone -d your-domain.com -d www.your-domain.com
# keyin sertifikatlarni bu papkaga nusxalang
