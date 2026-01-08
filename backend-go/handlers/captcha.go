// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package handlers

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"math/big"
	mrand "math/rand"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// CaptchaStore xotirada CAPTCHA ma'lumotlarini saqlaydi
type CaptchaStore struct {
	mu       sync.RWMutex
	captchas map[string]*CaptchaData
}

type CaptchaData struct {
	Code      string
	CreatedAt time.Time
	ExpiresAt time.Time
}

var captchaStore = &CaptchaStore{
	captchas: make(map[string]*CaptchaData),
}

func init() {
	// Muddati o'tgan CAPTCHA larni tozalash
	go func() {
		for {
			time.Sleep(1 * time.Minute)
			captchaStore.cleanup()
		}
	}()
}

func (cs *CaptchaStore) cleanup() {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	now := time.Now()
	for id, data := range cs.captchas {
		if now.After(data.ExpiresAt) {
			delete(cs.captchas, id)
		}
	}
}

func (cs *CaptchaStore) Store(id, code string) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	cs.captchas[id] = &CaptchaData{
		Code:      code,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(3 * time.Minute),
	}
}

func (cs *CaptchaStore) Verify(id, code string) bool {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	data, exists := cs.captchas[id]
	if !exists {
		return false
	}
	// Bir marta ishlatilgandan keyin o'chirish
	delete(cs.captchas, id)
	if time.Now().After(data.ExpiresAt) {
		return false
	}
	return strings.EqualFold(data.Code, code)
}

func generateRandomString(n int) string {
	// O'xshash harflarni olib tashlaymiz (0, O, I, 1, l)
	chars := "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	result := make([]byte, n)
	for i := range result {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		result[i] = chars[num.Int64()]
	}
	return string(result)
}

func generateCaptchaID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// Katta bitmap harflar (har bir harf 7x9 grid)
var charBitmaps = map[rune][]string{
	'A': {
		"  ###  ",
		" #   # ",
		"#     #",
		"#     #",
		"#######",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
	},
	'B': {
		"###### ",
		"#     #",
		"#     #",
		"###### ",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"###### ",
	},
	'C': {
		" ##### ",
		"#     #",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#     #",
		" ##### ",
	},
	'D': {
		"###### ",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"###### ",
	},
	'E': {
		"#######",
		"#      ",
		"#      ",
		"#####  ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#######",
	},
	'F': {
		"#######",
		"#      ",
		"#      ",
		"#####  ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
	},
	'G': {
		" ##### ",
		"#     #",
		"#      ",
		"#      ",
		"#  ####",
		"#     #",
		"#     #",
		"#     #",
		" ##### ",
	},
	'H': {
		"#     #",
		"#     #",
		"#     #",
		"#######",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
	},
	'J': {
		"      #",
		"      #",
		"      #",
		"      #",
		"      #",
		"      #",
		"#     #",
		"#     #",
		" ##### ",
	},
	'K': {
		"#    # ",
		"#   #  ",
		"#  #   ",
		"# #    ",
		"##     ",
		"# #    ",
		"#  #   ",
		"#   #  ",
		"#    # ",
	},
	'L': {
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#######",
	},
	'M': {
		"#     #",
		"##   ##",
		"# # # #",
		"#  #  #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
	},
	'N': {
		"#     #",
		"##    #",
		"# #   #",
		"#  #  #",
		"#   # #",
		"#    ##",
		"#     #",
		"#     #",
		"#     #",
	},
	'P': {
		"###### ",
		"#     #",
		"#     #",
		"###### ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
		"#      ",
	},
	'Q': {
		" ##### ",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#   # #",
		"#    # ",
		"#     #",
		" #### #",
	},
	'R': {
		"###### ",
		"#     #",
		"#     #",
		"###### ",
		"# #    ",
		"#  #   ",
		"#   #  ",
		"#    # ",
		"#     #",
	},
	'S': {
		" ##### ",
		"#     #",
		"#      ",
		" #     ",
		"  ###  ",
		"     # ",
		"      #",
		"#     #",
		" ##### ",
	},
	'T': {
		"#######",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
	},
	'U': {
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		" ##### ",
	},
	'V': {
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		" #   # ",
		"  # #  ",
		"   #   ",
		"   #   ",
	},
	'W': {
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		"#  #  #",
		"# # # #",
		"##   ##",
		"#     #",
		"#     #",
	},
	'X': {
		"#     #",
		" #   # ",
		"  # #  ",
		"   #   ",
		"   #   ",
		"  # #  ",
		" #   # ",
		"#     #",
		"#     #",
	},
	'Y': {
		"#     #",
		" #   # ",
		"  # #  ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
	},
	'Z': {
		"#######",
		"      #",
		"     # ",
		"    #  ",
		"   #   ",
		"  #    ",
		" #     ",
		"#      ",
		"#######",
	},
	'2': {
		" ##### ",
		"#     #",
		"      #",
		"     # ",
		"   ##  ",
		"  #    ",
		" #     ",
		"#      ",
		"#######",
	},
	'3': {
		" ##### ",
		"#     #",
		"      #",
		"    ## ",
		"      #",
		"      #",
		"      #",
		"#     #",
		" ##### ",
	},
	'4': {
		"#     #",
		"#     #",
		"#     #",
		"#######",
		"      #",
		"      #",
		"      #",
		"      #",
		"      #",
	},
	'5': {
		"#######",
		"#      ",
		"#      ",
		"###### ",
		"      #",
		"      #",
		"      #",
		"#     #",
		" ##### ",
	},
	'6': {
		" ##### ",
		"#     #",
		"#      ",
		"###### ",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		" ##### ",
	},
	'7': {
		"#######",
		"      #",
		"     # ",
		"    #  ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
		"   #   ",
	},
	'8': {
		" ##### ",
		"#     #",
		"#     #",
		" ##### ",
		"#     #",
		"#     #",
		"#     #",
		"#     #",
		" ##### ",
	},
	'9': {
		" ##### ",
		"#     #",
		"#     #",
		" ######",
		"      #",
		"      #",
		"      #",
		"#     #",
		" ##### ",
	},
}

func generateCaptchaImage(code string) ([]byte, error) {
	width := 240
	height := 80

	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Oq fon
	bgColor := color.RGBA{255, 255, 255, 255}
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, bgColor)
		}
	}

	// Harflar uchun ranglar
	colors := []color.RGBA{
		{0, 0, 0, 255},    // Qora
		{30, 30, 30, 255}, // To'q kulrang
		{50, 50, 50, 255}, // Kulrang
	}

	mrand.Seed(time.Now().UnixNano())

	// Harflarni chizish
	charWidth := 35 // Har bir harf kengligi
	startX := 15    // Boshlang'ich X

	for i, char := range code {
		bitmap, exists := charBitmaps[char]
		if !exists {
			continue
		}

		charColor := colors[mrand.Intn(len(colors))]
		x := startX + i*charWidth
		y := 8 + mrand.Intn(5) // Biroz vertikal offset

		// Bitmap asosida harfni chizish
		pixelSize := 6 // Har bir "piksel" 6x6 haqiqiy piksel
		for row, line := range bitmap {
			for col, ch := range line {
				if ch == '#' {
					// 6x6 blok chizish
					for py := 0; py < pixelSize; py++ {
						for px := 0; px < pixelSize; px++ {
							newX := x + col*pixelSize + px
							newY := y + row*pixelSize + py
							if newX >= 0 && newX < width && newY >= 0 && newY < height {
								img.Set(newX, newY, charColor)
							}
						}
					}
				}
			}
		}
	}

	// Yengil chiziqlar qo'shish (kam)
	lineColor := color.RGBA{200, 200, 200, 255}
	for i := 0; i < 2; i++ {
		y := mrand.Intn(height)
		for x := 0; x < width; x++ {
			if mrand.Float32() > 0.3 {
				img.Set(x, y+mrand.Intn(3)-1, lineColor)
			}
		}
	}

	// PNG formatga aylantirish
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// GenerateCaptcha yangi CAPTCHA yaratadi
func GenerateCaptcha(c *gin.Context) {
	code := generateRandomString(5)
	captchaID := generateCaptchaID()

	captchaStore.Store(captchaID, code)

	imageBytes, err := generateCaptchaImage(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "CAPTCHA yaratishda xatolik"})
		return
	}

	imageBase64 := base64.StdEncoding.EncodeToString(imageBytes)

	c.JSON(http.StatusOK, gin.H{
		"id":    captchaID,
		"image": "data:image/png;base64," + imageBase64,
	})
}

// VerifyCaptcha CAPTCHA ni tekshiradi
func VerifyCaptcha(c *gin.Context) {
	var req struct {
		ID   string `json:"id"`
		Code string `json:"code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Noto'g'ri so'rov"})
		return
	}

	if captchaStore.Verify(req.ID, req.Code) {
		c.JSON(http.StatusOK, gin.H{"valid": true})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "CAPTCHA noto'g'ri yoki muddati o'tgan"})
	}
}

// VerifyCaptchaInternal ichki tekshirish uchun
func VerifyCaptchaInternal(id, code string) bool {
	return captchaStore.Verify(id, code)
}
