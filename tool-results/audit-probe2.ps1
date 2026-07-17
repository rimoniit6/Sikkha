$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@localhost","password":"inp"}' -WebSession $session -UseBasicParsing | Out-Null

function G($p){ $r=Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$p" -Method GET -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue; if($r){ return $r.Content|ConvertFrom-Json } else { return $null } }

# 1. Were the destructive deletes captured in audit log?
$al = G "audit-logs?limit=20"
if($al){
  $deletes = $al.data | Where-Object { $_.action -match 'DELETE|delete' }
  Write-Host ("AUDIT-LOGS total=" + $al.data.Count + " deletes captured=" + $deletes.Count)
  $deletes | ForEach-Object { Write-Host ("  " + $_.action + " " + $_.entityType + " " + $_.entityId) }
} else { Write-Host "audit-logs ERR" }

# 2. Probe action-based modules bare GET (should 400) vs with action
foreach($m in @("mcq-exam-packages","cq-exam-packages","courses","exams","custom-exams","lessons","plans","bundles","coupons","certificates","suggestions","knowledge-questions","teachers","moderators","media","navigation","settings","feature-flags","analytics","orders","subscriptions","payments","faqs","testimonials","users","roles","permissions","banners","bulk-import","featured")){
  $r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/$m" -Method GET -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue
  if($r){ Write-Host ("$m GET " + $r.StatusCode) } else { Write-Host ("$m GET ERR") }
}
