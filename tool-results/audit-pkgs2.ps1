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
function J($s){ return ($s -split '\|',2)[1] | ConvertFrom-Json }
function G($p){ return (Send GET $p)|ConvertFrom-Json }

$subj = G "subjects?classId=ssc&limit=1"; $sid = $subj.data[0].id
$chap = G "chapters?subjectId=$sid&limit=1"; $cid = $chap.data[0].id
$cls = G "classes?limit=1"; $clid = $cls.data[0].id

# MCQ exam package lifecycle
$p = Send POST "mcq-exam-packages" @{action="create-package"; title="AUDIT PKG"; classId=$clid; subjectIds=@($sid); price=0; isPremium=$false}
Write-Host "PKG CREATE: $($p.Split('|')[0])"
$pkgId = (J $p).data.id
$set = Send POST "mcq-exam-packages" @{action="create-set"; packageId=$pkgId; title="AUDIT SET1"; scheduledDate="2026-08-01"; duration=30}
Write-Host "SET CREATE: $($set.Split('|')[0])"
$setId = (J $set).data.id
$m = Send POST mcq @{question="Q TO ADD?"; optionA="1"; optionB="2"; optionC="3"; optionD="4"; correctAnswer="A"; chapterId=$cid; classLevel="ssc"; subjectId=$sid; difficulty="easy"; isActive=$true}
$mcqId = (J $m).data.id
$add = Send POST "mcq-exam-packages" @{action="add-questions"; setId=$setId; mcqIds=@($mcqId)}
Write-Host "ADD QUESTIONS: $($add.Split('|')[0])"
Write-Host "PKG LIST: $((Send GET "mcq-exam-packages?action=list").Split('|')[0])"
# cleanup
Write-Host "PKG DELETE: $(Send DELETE "mcq-exam-packages?action=delete&id=$pkgId")"
Write-Host "MCQ cleanup: $(Send DELETE "mcq?id=$mcqId")"

# CQ exam package
Write-Host "CQ PKG LIST: $((Send GET "cq-exam-packages?action=list").Split('|')[0])"
$cqp = Send POST "cq-exam-packages" @{action="create-package"; title="AUDIT CQ PKG"; classId=$clid; subjectIds=@($sid); price=0}
Write-Host "CQ PKG CREATE: $($cqp.Split('|')[0])"

# users
$u = G "users?limit=1"
Write-Host ("USERS list count: " + $u.data.Count + " total: " + $u.pagination.total)
Write-Host "BULK-IMPORT GET: $((Send GET "bulk-import").Split('|')[0])"
