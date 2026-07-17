$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

$tmp = "E:\Sikkhs\tool-results\payload.json"
function Send($m,$p,$obj){
  if($obj -ne $null){ $obj | ConvertTo-Json -Compress | Set-Content $tmp -Encoding utf8 }
  try {
    if($obj -eq $null){ $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -WebSession $session -UseBasicParsing -ErrorAction Stop }
    else { $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method $m -ContentType "application/json" -InFile $tmp -WebSession $session -UseBasicParsing -ErrorAction Stop }
    return $r
  } catch { return $null }
}
function Jid($r,$path){ $o = $r.Content | ConvertFrom-Json; foreach($k in $path.Split('.')){ $o = $o.$k }; return $o }

# valid ids
$subj = (Send GET "subjects?classId=ssc&limit=1").Content | ConvertFrom-Json
$sid = $subj.data[0].id
$chap = (Send GET "chapters?subjectId=$sid&limit=1").Content | ConvertFrom-Json
$cid = $chap.data[0].id

# NEW board to test FK delete
$br = Send POST boards @{name="AUDIT BOARD FK2"; slug="audit-board-fk2"}
$bid = $br.Content | ConvertFrom-Json; $bid = $bid.data.id
Write-Host "BOARD id=$bid"
# MCQ referencing that board (by slug)
$mr = Send POST mcq @{question="AUDIT MCQ BOARD2?"; optionA="1"; optionB="2"; optionC="3"; optionD="4"; correctAnswer="A"; chapterId=$cid; classLevel="ssc"; subjectId=$sid; board="audit-board-fk2"; year="2024"; difficulty="easy"; isActive=$true}
Write-Host "MCQ on board: $($mr.StatusCode)"
# Now DELETE the board (it has a child MCQ) -> should it crash or orphan?
$dr = Send DELETE "boards?id=$bid"
Write-Host "BOARD DELETE (has MCQ child): $($dr.StatusCode) $(if($dr){$dr.Content}else{'NO RESPONSE / 500'})"

# DELETE a real subject that has chapters+MCQs (ssc physics subject)
# find a subject with chapters
$allsubj = (Send GET "subjects?classId=ssc&limit=50").Content | ConvertFrom-Json
$target = $allsubj.data | Where-Object { $_.id -eq $sid }
Write-Host "Attempt delete subject $sid which has chapters..."
$ds = Send DELETE "subjects?id=$sid"
Write-Host "SUBJECT DELETE (has chapters/MCQs): $($ds.StatusCode) $(if($ds){$ds.Content}else{'NO RESPONSE / 500'})"

# DELETE a real class that has subjects
$cls = (Send GET "classes?limit=1").Content | ConvertFrom-Json
$clid = $cls.data[0].id
Write-Host "Attempt delete class $clid which has subjects..."
$dc = Send DELETE "classes?id=$clid"
Write-Host "CLASS DELETE (has subjects/children): $($dc.StatusCode) $(if($dc){$dc.Content}else{'NO RESPONSE / 500'})"
