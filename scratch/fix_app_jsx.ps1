$filePath = "frontend/src/App.jsx"
$content = Get-Content $filePath
$startLine = 723
$endLine = 1039
# PowerShell arrays are 0-indexed. Line 1 is index 0.
# Keep up to line 722 (index 721)
# Keep from line 1040 (index 1039)
$newContent = $content[0..721] + $content[1039..($content.Count-1)]
$newContent | Set-Content $filePath
