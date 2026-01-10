# Script to add modal functionality to all portfolio category pages

$categories = @('international', 'social', 'leadership', 'career', 'awards', 'technical')

foreach ($category in $categories) {
    $filePath = "c:\Users\user\Desktop\kuafcv\frontend\src\app\portfolio\$category\page.tsx"
    Write-Host "Processing $category..."
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Check if Eye is already imported
        if ($content -notmatch 'Eye,') {
            Write-Host "  Adding Eye import to $category"
            # This will be done manually for each file
        }
        
        # Check if CardFooter is already imported
        if ($content -notmatch 'CardFooter') {
            Write-Host "  Need to add CardFooter import to $category"
        }
        
        # Check if modal state exists
        if ($content -notmatch 'showFilesModal') {
            Write-Host "  Need to add modal state to $category"
        }
        
        Write-Host "  $category needs updates"
    }
}
