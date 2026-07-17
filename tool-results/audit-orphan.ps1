$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

function G($p){ $r=Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method GET -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue; if($r){ return $r.Content|ConvertFrom-Json } else { return $null } }

# The deleted class was cmrnutir90005aofi6mgahmxz (ssc-class-6 region). Re-check counts.
Write-Host "=== Orphan check after deletes ==="
$subs = G "subjects?classId=ssc&limit=1"
Write-Host "subjects ssc count via GET: $(($subs.data|Measure-Object).Count) (first batch)"

# Try to fetch a subject that belonged to deleted class - use known ssc physics subject id cmrnutiv3000qaofipn5c6mjm
$ch = G "chapters?subjectId=cmrnutiv3000qaofipn5c6mjm&limit=1"
Write-Host "chapters for deleted-subject cmrnutiv3000qaofipn5c6mjm: count=$(if($ch){($ch.data|Measure-Object).Count}else{'ERR'})"

# Check board 'audit-board-fk2' children: query mcq with board filter
$mcq = G "mcq?board=audit-board-fk2&limit=5"
Write-Host "MCQ with board=audit-board-fk2: $(if($mcq){'found '+(($mcq.data|Measure-Object).Count+' (ORPHAN - board gone but MCQ references it)'}else{'ERR'})"

# Check prisma schema for onDelete behavior on ClassCategory->Subject etc
Write-Host "=== Check content-types (action-based module) ==="
$t = G "content-types?limit=2"
Write-Host "content-types: $(if($t){'OK count='+(($t.data|Measure-Object).Count}else{'ERR'})"
