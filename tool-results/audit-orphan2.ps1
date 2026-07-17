$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

function G($p){ $r=Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method GET -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue; if($r){ return $r.Content|ConvertFrom-Json } else { return $null } }

Write-Host "=== Orphan check after deletes ==="
$subs = G "subjects?classId=ssc&limit=50"
Write-Host ("subjects ssc total in first 50 batch: " + $subs.data.Count)

$ch = G "chapters?subjectId=cmrnutiv3000qaofipn5c6mjm&limit=1"
if($ch){ Write-Host ("chapters for DELETED subject cmrnutiv3000qaofipn5c6mjm: " + $ch.data.Count + " (ORPHAN if >0)") } else { Write-Host "chapters query ERR (subject id unknown now)" }

$mcq = G "mcq?board=audit-board-fk2&limit=5"
if($mcq){ Write-Host ("MCQ referencing DELETED board audit-board-fk2: " + $mcq.data.Count + " (ORPHAN if >0)") } else { Write-Host "mcq board query ERR" }

Write-Host "=== content-types module (needs action?) ==="
$t = G "content-types?limit=2"
if($t){ Write-Host ("content-types GET OK, count=" + $t.data.Count) } else { Write-Host "content-types GET ERR" }
