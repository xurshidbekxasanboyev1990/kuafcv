package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	db, err := sql.Open("postgres", "postgres://postgres:postgres@localhost:5433/kuafcv?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// admin123 parolini hash qilish
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	// Admin, Registrar, Employer parollarini yangilash
	result, err := db.Exec(`
		UPDATE users 
		SET password_hash = $1 
		WHERE email IN ('admin@kuafcv.uz', 'registrar@kuafcv.uz', 'employer@kuafcv.uz')
	`, string(hash))
	if err != nil {
		log.Fatal(err)
	}

	affected, _ := result.RowsAffected()
	fmt.Printf("✅ %d ta foydalanuvchi paroli yangilandi (admin123)\n", affected)

	// student123 parolini hash qilish
	studentHash, err := bcrypt.GenerateFromPassword([]byte("student123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	// Talabalar parollarini yangilash
	result, err = db.Exec(`
		UPDATE users 
		SET password_hash = $1 
		WHERE role = 'STUDENT'
	`, string(studentHash))
	if err != nil {
		log.Fatal(err)
	}

	affected, _ = result.RowsAffected()
	fmt.Printf("✅ %d ta talaba paroli yangilandi (student123)\n", affected)
}
