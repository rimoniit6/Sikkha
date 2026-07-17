$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

$tmp = "E:\Sikkhs\tool-results\payload.json"
function ApiF($m,$p){
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -ContentType "application/json" -InFile $tmp -WebSession $session -UseBasicParsing -ErrorAction Stop
    return "$($r.StatusCode)|$($r.Content)"
  } catch {
    return "ERR$($_.Exception.Response.StatusCode.value__)|$($_.ErrorDetails.Message)"
  }
}
function ApiG($p){ try { $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method GET -WebSession $session -UseBasicParsing -ErrorAction Stop; return "$($r.StatusCode)|$($r.Content)" } catch { return "ERR$($_.Exception.Response.StatusCode.value__)|$($_.ErrorDetails.Message)" } }
function J($s){ return ($s -split '\|',2)[1] }

# ---- NOTICE lifecycle ----
Set-Content $tmp '{"title":"AUDIT NOTICE","content":"hello","type":"text","isActive":true}' -Encoding utf8
$c = ApiF POST notices
Write-Host "NOTICE CREATE: $c"
$nid = (J $c | ConvertFrom-Json).data.id
Set-Content $tmp "{'id':'$nid','title':'AUDIT NOTICE EDIT'}" -Encoding utf8
Write-Host "NOTICE UPDATE: $(ApiF PUT notices)"
Set-Content $tmp "{'ids':['$nid'],'isActive':false}" -Encoding utf8
Write-Host "NOTICE BULK TOGGLE: $(ApiF PUT notices)"
Write-Host "NOTICE DELETE: $(ApiG "notices?id=$nid")"

# ---- MCQ lifecycle ----
$subj = (J (ApiG "subjects?classId=ssc&limit=1") | ConvertFrom-Json).data[0]
$chap = (J (ApiG "chapters?subjectId=$($subj.id)&limit=1") | ConvertFrom-Json).data[0]
Write-Host "subject=$($subj.id) chapter=$($chap.id)"
Set-Content $tmp "{'question':'AUDIT MCQ?','optionA':'1','optionB':'2','optionC':'3','optionD':'4','correctAnswer':'A','chapterId':'$($chap.id)','classLevel':'ssc','subjectId':'$($subj.id)','difficulty':'easy','isActive':true}" -Encoding utf8
Write-Host "MCQ CREATE: $(ApiF POST mcq)"
$mid = (J (ApiF POST mcq) | ConvertFrom-Json).data.id
Set-Content $tmp "{'id':'$mid','question':'AUDIT MCQ EDIT?','correctAnswer':'B'}" -Encoding utf8
Write-Host "MCQ UPDATE: $(ApiF PUT mcq)"
Write-Host "MCQ DELETE: $(ApiG "mcq?id=$mid")"

# ---- BOARD FK guard test ----
Set-Content $tmp '{"name":"AUDIT BOARD FK","slug":"audit-board-fk"}' -Encoding utf8
$bid = (J (ApiF POST boards) | ConvertFrom-Json).data.id
Write-Host "BOARD FK id=$bid"
Set-Content $tmp "{'question':'AUDIT MCQ BOARD?','optionA':'1','optionB':'2','optionC':'3','optionD':'4','correctAnswer':'A','chapterId':'$($chap.id)','classLevel':'ssc','subjectId':'$($subj.id)','board':'audit-board-fk','year':'2024','difficulty':'easy','isActive':true}" -Encoding utf8
Write-Host "MCQ on board CREATE: $(ApiF POST mcq)"
Write-Host "BOARD DELETE (has MCQ): $(ApiG "boards?id=$bid")"
