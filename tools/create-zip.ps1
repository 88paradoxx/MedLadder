Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourceDir = "C:\Users\Dell\Desktop\MedLadder-main (23)\MedLadder-main"
$destZip25 = "C:\Users\Dell\Desktop\MedLadder-main (25).zip"
$destZipLatest = "C:\Users\Dell\Desktop\MedLadder-latest.zip"

if (Test-Path $destZip25) {
    Remove-Item $destZip25 -Force
}
if (Test-Path $destZipLatest) {
    Remove-Item $destZipLatest -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($destZip25, [System.IO.Compression.ZipArchiveMode]::Create)

$allFiles = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($sourceDir.Length).TrimStart('\', '/')
    $rel -notmatch '^(tmp|output|\.git|node_modules)[\\/]'
}

Write-Host "Archiving $($allFiles.Count) files into $destZip25..."

foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($sourceDir.Length).TrimStart('\', '/')
    $entryName = "MedLadder-main/" + ($relPath -replace '\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$zip.Dispose()

Copy-Item $destZip25 $destZipLatest -Force

$zipInfo = Get-Item $destZip25
Write-Host "SUCCESS: Created $destZip25 and $destZipLatest ($([math]::Round($zipInfo.Length / 1MB, 2)) MB)"
