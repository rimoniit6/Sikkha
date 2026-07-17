$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

function Api($m,$p,$b=""){
  try {
    if($b -eq ""){ $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -WebSession $session -UseBasicParsing -ErrorAction Stop }
    else { $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -ContentType "application/json" -Body $b -WebSession $session -UseBasicParsing -ErrorAction Stop }
    return "$($r.StatusCode)|$($r.Content)"
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $msg = $_.ErrorDetails.Message
    return "ERR$code|$msg"
  }
}

function J($s){ return ($s -split '\|',2)[1] }

Write-Host "===== CLASS ====="
$c = Api POST "classes" '{"name":"AUDIT CLASS X","slug":"audit-class-x","order":99,"icon":"X","color":"#fff","gradient":"from-red-500 to-rose-500","description":"audit test"}'
Write-Host "CREATE: $c"
$cid = (J $c | ConvertFrom-Json).data.id
Write-Host "cid=$cid"
Write-Host "READ: $(Api GET "classes")"
Write-Host "UPDATE: $(Api PUT "classes" "{\"id\":\"$cid\",\"name\":\"AUDIT CLASS X EDIT\",\"isActive\":false}")"
Write-Host "DUP-NOGUARD: $(Api POST "classes" '{"name":"AUDIT CLASS X","slug":"audit-class-x"}')"
Write-Host "DELETE: $(Api DELETE "classes?id=$cid")"

Write-Host "===== SUBJECT ====="
$s = Api POST "subjects" '{"name":"AUDIT SUBJ","classId":"PUTCLASSID","slug":"audit-subj"}'
Write-Host "CREATE(no class): $s"
$s = Api POST "subjects" '{"name":"AUDIT SUBJ","classId":"cmrnuti690000aofitn64orzp","slug":"audit-subj-2"}'
Write-Host "CREATE(bad class id): $s"

Write-Host "===== BOARD ====="
$b = Api POST "boards" '{"name":"AUDIT BOARD Q"}'
Write-Host "CREATE: $b"
$bid = (J $b | ConvertFrom-Json).data.id
Write-Host "DELETE: $(Api DELETE "boards?id=$bid")"

Write-Host "===== NOTICE ====="
$n = Api POST "notices" '{"title":"AUDIT NOTICE","content":"hello","type":"text","isActive":true}'
Write-Host "CREATE: $n"
$nid = (J $n | ConvertFrom-Json).data.id
Write-Host "UPDATE: $(Api PUT "notices" "{\"id\":\"$nid\",\"title\":\"AUDIT NOTICE EDIT\"}")"
Write-Host "BULK-TOGGLE: $(Api PUT "notices" "{\"ids\":[\"$nid\"],\"isActive\":false}")"
Write-Host "DELETE: $(Api DELETE "notices?id=$nid")"

Write-Host "===== MCQ (needs valid class/subject/chapter) ====="
# get a real subject+chapter id
$subj = Api GET "subjects?classId=ssc&limit=1"
$sj = (J $subj | ConvertFrom-Json).data[0]
Write-Host "subject: $($sj.id)"
$chap = Api GET "chapters?subjectId=$($sj.id)&limit=1"
$ch = (J $chap | ConvertFrom-Json).data[0]
Write-Host "chapter: $($ch.id)"
$m = Api POST "mcq" "{\"question\":\"AUDIT MCQ?\",\"optionA\":\"1\",\"optionB\":\"2\",\"optionC\":\"3\",\"optionD\":\"4\",\"correctAnswer\":\"A\",\"chapterId\":\"$($ch.id)\",\"classLevel\":\"ssc\",\"subjectId\":\"$($sj.id)\",\"difficulty\":\"easy\",\"isActive\":true}"
Write-Host "CREATE: $m"
$mid = (J $m | ConvertFrom-Json).data.id
Write-Host "UPDATE: $(Api PUT "mcq" "{\"id\":\"$mid\",\"question\":\"AUDIT MCQ EDIT?\"}")"
Write-Host "DELETE: $(Api DELETE "mcq?id=$mid")"
