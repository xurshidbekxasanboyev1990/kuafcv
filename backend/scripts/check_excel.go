// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
package main

import (
	"fmt"

	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("c:/Users/user/Desktop/kuafcv/cvshablonimport.xlsx")
	if err != nil {
		fmt.Println("Xatolik:", err)
		return
	}
	defer f.Close()

	// Barcha sheetlarni ko'rsatish
	fmt.Println("Sheetlar:", f.GetSheetList())

	// Birinchi sheet
	sheetName := f.GetSheetName(0)
	fmt.Printf("\nSheet nomi: %s\n\n", sheetName)

	// Merged cells
	mergedCells, _ := f.GetMergeCells(sheetName)
	fmt.Println("Merged cells:")
	for _, mc := range mergedCells {
		fmt.Printf("  %s: %s\n", mc.GetStartAxis()+":"+mc.GetEndAxis(), mc.GetCellValue())
	}

	// Birinchi 5 qatorni ko'rsatish
	rows, err := f.GetRows(sheetName)
	if err != nil {
		fmt.Println("Rows xatolik:", err)
		return
	}

	fmt.Printf("\nJami qatorlar: %d\n\n", len(rows))

	for i, row := range rows {
		if i > 5 {
			break
		}
		fmt.Printf("Qator %d (%d ustun):\n", i, len(row))
		for j, cell := range row {
			if cell != "" {
				fmt.Printf("  [%d]: %s\n", j, cell)
			}
		}
		fmt.Println()
	}
}
