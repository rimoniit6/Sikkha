$ErrorActionPreference = 'Stop'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

function Call($m,$p,$obj){
  try {
    $uri = "http://localhost:3000/api/admin/$p"
    if($obj -eq $null){
      $r = Invoke-WebRequest -Uri $uri -Method $m -WebSession $session -UseBasicParsing
    } else {
      $b = $obj | ConvertTo-Json -Compress -Depth 5
      $r = Invoke-WebRequest -Uri $uri -Method $m -ContentType "application/json" -Body $b -WebSession $session -UseBasicParsing
    }
    $json = $r.Content | ConvertFrom-Json
    return @{code=$r.StatusCode; json=$json}
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $msg = $_.ErrorDetails.Message
    try { $json = $msg | ConvertFrom-Json } catch { $json = @{error=$msg} }
    return @{code=$code; json=$json}
  }
}

$subj = (Call GET "subjects?classId=ssc&limit=1").json; $sid = $subj.data[0].id
$chap = (Call GET "chapters?subjectId=$sid&limit=1").json; $cid = $chap.data[0].id
$cls = (Call GET "classes?limit=1").json; $clid = $cls.data[0].id

Write-Host "=== MCQ EXAM PACKAGE lifecycle ==="
$p = Call POST "mcq-exam-packages" @{action="create-package"; title="AUDIT PKG"; classId=$clid; subjectIds=@($sid); price=0; isPremium=$false}
$pkgId = $p.json.data.package.id
Write-Host ("  CREATE: " + $p.code + " id=" + $pkgId)
$set = Call POST "mcq-exam-packages" @{action="create-set"; packageId=$pkgId; title="AUDIT SET1"; scheduledDate="2026-08-01"; duration=30}
$setId = $set.json.data.id
Write-Host ("  SET CREATE: " + $set.code + " id=" + $setId)
$m = Call POST mcq @{question="Q TO ADD?"; optionA="1"; optionB="2"; optionC="3"; optionD="4"; correctAnswer="A"; chapterId=$cid; classLevel="ssc"; subjectId=$sid; difficulty="easy"; isActive=$true}
$mcqId = $m.json.data.id
$add = Call POST "mcq-exam-packages" @{action="add-questions"; setId=$setId; mcqIds=@($mcqId)}
Write-Host ("  ADD QUESTIONS: " + $add.code)
$del = Call POST "mcq-exam-packages" @{action="delete-package"; id=$pkgId}
Write-Host ("  DELETE-PACKAGE: " + $del.code)
Write-Host ("  MCQ cleanup: " + (Call DELETE "mcq?id=$mcqId").code)

Write-Host "=== CQ EXAM PACKAGE (discover schema) ==="
$cqp = Call POST "cq-exam-packages" @{action="create-package"; title="AUDIT CQ PKG"; classId=$clid; subjectIds=@($sid); price=0}
Write-Host ("  create-package (classId/title): " + $cqp.code + " err=" + $cqp.json.error)

Write-Host "=== USERS / ROLES / PERMISSIONS ==="
$u = (Call GET "users?limit=1").json
Write-Host ("  users count=" + $u.data.Count + " total=" + $u.pagination.total)
if($u.data.Count -gt 0){ $uid=$u.data[0].id; $up=Call PUT users @{id=$uid; isPremium=$true}; Write-Host ("  UPDATE isPremium: " + $up.code) }
Write-Host ("  roles: " + (Call GET "roles?limit=5").json.data.Count)
Write-Host ("  permissions: " + (Call GET "permissions?limit=5").json.data.Count)

Write-Host "=== CONTENT MODULES list counts ==="
foreach($m in @("featured","banners","faqs","testimonials","suggestions","knowledge-questions","coupons","plans","bundles","certificates","teachers","moderators","media","navigation","notices","boards","years","topics")){
  $r = (Call GET ($m + "?limit=3")).json
  Write-Host ("  " + $m + ": " + $r.data.Count)
}
