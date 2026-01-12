package database

import (
	"fmt"
	"kuafcv-backend/models"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// SeedSuperAdmin creates the default super admin if not exists
func SeedSuperAdmin() {
	email := "xurshidbekxasanboyev@kuafcv.uz"
	password := "otamonam9900" 

	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)"
	err := DB.QueryRow(query, email).Scan(&exists)
	if err != nil {
		log.Printf("⚠️ Super admin tekshirishda xatolik: %v", err)
		return
	}

	if !exists {
		log.Println("👤 Super admin yaratilmoqda...")
		
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Parol hash qilishda xatolik: %v", err)
			return
		}

		newID := uuid.New().String()
		
		insertQuery := `
			INSERT INTO users (id, email, password_hash, role, full_name, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`
		
		_, err = DB.Exec(insertQuery, 
			newID, 
			email, 
			string(hash), 
			models.RoleAdmin, 
			"Super Admin", 
			time.Now(), 
			time.Now(),
		)
		
		if err != nil {
			log.Printf("❌ Super admin yaratishda xatolik: %v", err)
		} else {
			log.Println("✅ Super admin muvaffaqiyatli yaratildi!")
			log.Printf("📧 Email: %s", email)
		}
	} else {
		fmt.Println("ℹ️ Super admin allaqachon mavjud.")
	}
}
