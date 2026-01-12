# PowerShell script to reformat batch2 questions to correct parser format
# Converts: "### Q#. Exam: NAME – Topic: TOPIC" 
# To: "### Q#. (NAME – TOPIC)"

$inputFiles = @(
    "questions_batch2_chunk1.txt",
    "questions_batch2_chunk2.txt"
)

$outputFile = "questions_batch2_formatted_complete.txt"
$content = ""

foreach ($file in $inputFiles) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $text = Get-Content $file -Raw
        
        # Replace the format: "### Q#. Exam: EXAM_NAME – Topic: TOPIC_NAME"
        # With: "### Q#. (EXAM_NAME – TOPIC_NAME)"
        $text = $text -replace '### (Q\d+)\. Exam: ([^–]+) – Topic: (.+)', '### $1. ($2– $3)'
        
        $content += $text + "`n`n"
    }
}

# Write the reformatted content
$content | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "Created $outputFile with reformatted questions"
Write-Host "File size: $((Get-Item $outputFile).Length / 1KB) KB"
