# Script to update all pages to use MainLayout

$pages = @(
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\notifications\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\groups\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\analytics\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\my-stats\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\bookmarks\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\analysis-history\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\admin\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\registrar\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\employer\page.tsx",
    "c:\Users\user\Desktop\kuafcv\frontend\src\app\portfolio\page.tsx"
)

foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "Processing: $page"
        
        # Read file content
        $content = Get-Content $page -Raw
        
        # Replace imports
        $content = $content -replace "import Sidebar from '@/components/Sidebar';", "import MainLayout from '@/components/MainLayout';"
        $content = $content -replace "import MarqueeBanner from '@/components/MarqueeBanner';", ""
        
        # Replace layout structure patterns
        $content = $content -replace '<div className="min-h-screen bg-red-50">\s*<Sidebar />', '<MainLayout>'
        $content = $content -replace '</main>\s*</div>\s*\);', '</MainLayout>\n  );'
        
        # Replace ml-64 and md:ml-64 patterns
        $content = $content -replace 'className="(md:)?ml-64([^"]*)"', 'className="$2"'
        
        # Remove MarqueeBanner usage
        $content = $content -replace '<div className="[^"]*">\s*<MarqueeBanner[^>]*>\s*</div>', ''
        $content = $content -replace '<MarqueeBanner[^>]*>', ''
        
        # Remove main tag if it exists (MainLayout provides it)
        $content = $content -replace '<main className="[^"]*">', ''
        $content = $content -replace '</main>', ''
        
        # Save updated content
        Set-Content -Path $page -Value $content -NoNewline
        
        Write-Host "Updated: $page" -ForegroundColor Green
    }
}

Write-Host "`nAll pages updated successfully!" -ForegroundColor Cyan
