$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

$tmp = "E:\Sikkhs\tool-results\payload.json"
function Send($m,$p,$obj){
  if($obj -ne $null){ $obj | ConvertTo-Json -Compress | Set-Content $tmp -Encoding utf8 }
  try {
    if($obj -eq $null){ $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -WebSession $session -UseBasicParsing -ErrorAction Stop }
    else { $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -ContentType "application/json" -InFile $tmp -WebSession $session -UseBasicParsing -ErrorAction Stop }
    return "$($r.StatusCode)|$($r.Content)"
  } catch { return "ERR$($_.Exception.Response.StatusCode.value__)|$($_.ErrorDetails.Message)" }
}
function J($s){ return ($s -split '\|',2)[1] }

# fetch valid ids
$g = Send GET "subjects?classId=ssc&limit=1"
$subj = (J $g | ConvertFrom-Json).data[0]
$g = Send GET "chapters?subjectId=$($subj.id)&limit=1"
$chap = (J $g | ConvertFrom-Json).data[0]

# ---- NOTICE lifecycle ----
$n = Send POST notices @{title="AUDIT NOTICE"; content="hello"; type="text"; isActive=$true}
Write-Host "NOTICE CREATE: $n"
$nid = (J $n | ConvertFrom-Json).data.id
$n2 = Send PUT notices @{id=$nid; title="AUDIT NOTICE EDIT"}
Write-Host "NOTICE UPDATE: $n2"
$n3 = Send PUT notices @{ids=@($nid); isActive=$false}
Write-Host "NOTICE BULK TOGGLE: $n3"
Write-Host "NOTICE DELETE: $(Send DELETE "notices?id=$nid")"

# ---- MCQ lifecycle ----
$m = Send POST mcq @{question="AUDIT MCQ?"; optionA="1"; optionB="2"; optionC="3"; optionD="4"; correctAnswer="A"; chapterId=$chap.id; classLevel="ssc"; subjectId=$subj.id; difficulty="easy"; isActive=$true}
Write-Host "MCQ CREATE: $m"
$mid = (J $m | ConvertFrom-Json).data.id
$m2 = Send PUT mcq @{id=$mid; question="AUDIT MCQ EDIT?"; correctAnswer="B"}
Write-Host "MCQ UPDATE: $m2"
Write-Host "MCQ DELETE: $(Send DELETE "mcq?id=$mid")"

# ---- BOARD FK: create board, MCQ referencing it, delete board ----
$b = Send POST boards @{name="AUDIT BOARD FK"; slug="audit-board-fk"}
$bid = (J $b | ConvertFrom-Json).data.id
Write-Host "BOARD CREATE: $bid"
$m = Send POST mcq @{question="AUDIT MCQ BOARD?"; optionA="1"; optionB="2"; optionC="3"; optionD="4"; correctAnswer="A"; chapterId=$chap.id; classLevel="ssc"; subjectId=$subj.id; board="audit-board-fk"; year="2024"; difficulty="easy"; isActive=$true}
Write-Host "MCQ on board CREATE: $m"
Write-Host "BOARD DELETE (has MCQ): $(Send DELETE "boards?id=$bid")"
# verify board still present
Write-Host "BOARD list after delete: $(Send GET "boards")"
