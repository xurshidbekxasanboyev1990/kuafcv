package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "otamonam9900"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Password:", password)
	fmt.Println("Hash:", string(hash))
}
