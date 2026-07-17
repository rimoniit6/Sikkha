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

Write-Host "=== CQ EXAM PACKAGE create (isolated) ==="
$cqp = Call POST "cq-exam-packages" @{action="create-package"; title="AUDIT CQ PKG"; classId=$clid; subjectIds=@($sid); price=0}
Write-Host ("  CQ create-package: " + $cqp.code + " err=" + $cqp.json.error + " id=" + $cqp.json.package.id)
if($cqp.code -eq 201){
  $cqpid = $cqp.json.package.id
  $cqset = Call POST "cq-exam-packages" @{action="create-set"; packageId=$cqpid; title="AUDIT CQ SET"; scheduledDate="2026-08-01"; duration=30}
  Write-Host ("  CQ create-set: " + $cqset.code + " id=" + $cqset.json.set.id)
  Write-Host ("  CQ delete-package: " + (Call DELETE ("cq-exam-packages?action=delete-package&id=" + $cqpid)).code)
}

Write-Host "=== SEARCH / FILTER / PAGINATION (mcq) ==="
$s1 = (Call GET "mcq?search=test&limit=2&page=1").json
Write-Host ("  search=test count=" + $s1.data.Count + " total=" + $s1.pagination.total)
$f1 = (Call GET ("mcq?subjectId=" + $sid + "&limit=2")).json
Write-Host ("  filter subjectId count=" + $f1.data.Count)
$pg = (Call GET "mcq?limit=1&page=2").json
Write-Host ("  page=2 count=" + $pg.data.Count + " (pagination works if differs from page1)")

Write-Host "=== COURSES (action-based) lifecycle ==="
$cl = (Call GET "courses?action=list&limit=1").json
Write-Host ("  courses list: " + $cl.code + " count=" + $cl.data.Count)
$crc = Call POST "courses" @{action="create"; title="AUDIT COURSE"; description="x"; classId=$clid; price=0; isPremium=$false}
Write-Host ("  course create: " + $crc.code + " err=" + $crc.json.error)
if($crc.code -eq 201 -or $crc.code -eq 200){ $courseId = $crc.json.course.id; Write-Host ("  course id=" + $courseId); Write-Host ("  course delete: " + (Call DELETE ("courses?action=delete&id=" + $courseId)).code) }

Write-Host "=== ORDERS / PAYMENTS / SUBSCRIPTIONS (read + update) ==="
$ord = (Call GET "orders?limit=2").json; Write-Host ("  orders: " + $ord.code + " count=" + $ord.data.Count)
$pay = (Call GET "payments?limit=2").json; Write-Host ("  payments: " + $pay.code + " count=" + $pay.data.Count)
$sub = (Call GET "subscriptions?limit=2").json; Write-Host ("  subscriptions: " + $sub.code + " count=" + $sub.data.Count)

Write-Host "=== BULK-IMPORT (POST endpoint?) ==="
$bi = Call POST "bulk-import" @{module="mcq"; data=@(@{question="x"})}
Write-Host ("  bulk-import POST: " + $bi.code + " err=" + $bi.json.error)

Write-Host "=== SETTINGS / FEATURE-FLAGS / ANALYTICS ==="
$set = (Call GET "settings").json; Write-Host ("  settings: " + $set.code + " keys=" + ($set.data.PSObject.Properties.Name -join ','))
$ff = (Call GET "feature-flags").json; Write-Host ("  feature-flags: " + $ff.code + " count=" + $ff.data.Count)
$an = (Call GET "analytics?range=7d").json; Write-Host ("  analytics: " + $an.code)
