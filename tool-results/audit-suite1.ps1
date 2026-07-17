$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

function Send($m,$p,$obj){
  try {
    if($obj -eq $null){ $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -WebSession $session -UseBasicParsing -ErrorAction Stop }
    else { $b = $obj | ConvertTo-Json -Compress -Depth 5; $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -ContentType "application/json" -Body $b -WebSession $session -UseBasicParsing -ErrorAction Stop }
    return "$($r.StatusCode)|$($r.Content)"
  } catch { return "ERR$($_.Exception.Response.StatusCode.value__)|$($_.ErrorDetails.Message)" }
}
function Parse($s){ $i=$s.IndexOf('|'); $j=$s.Substring($i+1); try { return $j|ConvertFrom-Json } catch { return $null } }
function Err($s){ $o=Parse $s; if($o -and $o.error){ return $o.error } return ($s -split '\|',2)[0] }

function GETr($p){ return (Send GET $p)|Parse }

$subj = GETr "subjects?classId=ssc&limit=1"; $sid = $subj.data[0].id
$chap = GETr "chapters?subjectId=$sid&limit=1"; $cid = $chap.data[0].id
$cls = GETr "classes?limit=1"; $clid = $cls.data[0].id

Write-Host "=== MCQ EXAM PACKAGE lifecycle ==="
$p = Send POST "mcq-exam-packages" @{action="create-package"; title="AUDIT PKG"; classId=$clid; subjectIds=@($sid); price=0; isPremium=$false}
$pkgId = (Parse $p).data.package.id
Write-Host ("  CREATE: " + $p.Split('|')[0] + " id=" + $pkgId)
$set = Send POST "mcq-exam-packages" @{action="create-set"; packageId=$pkgId; title="AUDIT SET1"; scheduledDate="2026-08-01"; duration=30}
$setId = (Parse $set).data.id
Write-Host ("  SET CREATE: " + $set.Split('|')[0] + " id=" + $setId)
$m = Send POST mcq @{question="Q TO ADD?"; optionA="1"; optionB="2"; optionC="3"; optionD="4"; correctAnswer="A"; chapterId=$cid; classLevel="ssc"; subjectId=$sid; difficulty="easy"; isActive=$true}
$mcqId = (Parse $m).data.id
$add = Send POST "mcq-exam-packages" @{action="add-questions"; setId=$setId; mcqIds=@($mcqId)}
Write-Host ("  ADD QUESTIONS: " + $add.Split('|')[0])
# delete package (delete-package reads id from body)
$del = Send POST "mcq-exam-packages" @{action="delete-package"; id=$pkgId}
Write-Host ("  DELETE-PACKAGE: " + $del.Split('|')[0])
Write-Host ("  MCQ cleanup: " + (Send DELETE "mcq?id=$mcqId").Split('|')[0])

Write-Host "=== CQ EXAM PACKAGE lifecycle (field names?) ==="
# read cq schema field names quickly via error
$cqp = Send POST "cq-exam-packages" @{action="create-package"; title="AUDIT CQ PKG"; classId=$clid; subjectIds=@($sid); price=0; isPremium=$false}
Write-Host ("  CREATE (mcq-style fields): " + $cqp.Split('|')[0] + " -> " + (Err $cqp))
$cqp2 = Send POST "cq-exam-packages" @{action="create-package"; name="AUDIT CQ PKG"; class="ssc"; subjects=@($sid)}
Write-Host ("  CREATE (alt fields): " + $cqp2.Split('|')[0] + " -> " + (Err $cqp2))

Write-Host "=== USERS ==="
$u = GETr "users?limit=1"
Write-Host ("  users count=" + $u.data.Count + " total=" + $u.pagination.total)
# user update (isPremium toggle)
if($u.data.Count -gt 0){ $uid=$u.data[0].id; $up=Send PUT users @{id=$uid; isPremium=$true}; Write-Host ("  UPDATE isPremium: " + $up.Split('|')[0]) }

Write-Host "=== ROLES / PERMISSIONS ==="
$roles = GETr "roles?limit=5"; Write-Host ("  roles count=" + $roles.data.Count)
$perms = GETr "permissions?limit=5"; Write-Host ("  permissions count=" + $perms.data.Count)

Write-Host "=== FEATURED / BANNERS / FAQ / TESTIMONIALS ==="
$f = GETr "featured?limit=3"; Write-Host ("  featured: " + $f.data.Count)
$b = GETr "banners?limit=3"; Write-Host ("  banners: " + $b.data.Count)
$fq = GETr "faqs?limit=3"; Write-Host ("  faqs: " + $fq.data.Count)
$tt = GETr "testimonials?limit=3"; Write-Host ("  testimonials: " + $tt.data.Count)

Write-Host "=== SUGGESTIONS / KNOWLEDGE-QUESTIONS ==="
$sug = GETr "suggestions?limit=3"; Write-Host ("  suggestions: " + $sug.data.Count)
$kq = GETr "knowledge-questions?limit=3"; Write-Host ("  knowledge-questions: " + $kq.data.Count)
