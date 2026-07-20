# Delete Operation Runtime Audit - v2 (curl-based)

$baseUrl = "http://localhost:3000/api"
$cookieFile = "$PSScriptRoot\.audit-cookie.txt"

function Get-CookieArg {
    $content = Get-Content $cookieFile -Raw
    if ($content -match "session=([^;]+)") {
        return "-H ""Cookie: session=$($matches[1])"""
    }
    return ""
}

function Query-DB {
    param($table, $id)
    # Direct SQLite query using bun
    $result = bun -e "const db = require('better-sqlite3')('./dev.db'); const r = db.prepare('SELECT id, deletedAt, deletedBy, isActive FROM $table WHERE id = ?').get('$id'); console.log(JSON.stringify(r || {})); db.close();" 2>$null
    if ($result) { return ($result | ConvertFrom-Json) } else { return $null }
}

function Test-Delete {
    param($name, $endpoint, $table, $recordId, $desc)

    Write-Host "`n[TEST] $name" -ForegroundColor Yellow
    Write-Host "  Endpoint: $endpoint"
    Write-Host "  Table: $table"
    Write-Host "  Record: $recordId"

    # Get before state
    $before = Query-DB -table $table -id $recordId
    Write-Host "  Before: $(if($before){$before.deletedAt}else'NULL')"

    # Call delete API
    $cookieArg = Get-CookieArg
    $fullUrl = "$baseUrl$endpoint"
    $curlCmd = "curl -s -X DELETE $cookieArg -H ""Content-Type: application/json"" $fullUrl"
    $apiResult = Invoke-Expression $curlCmd | ConvertFrom-Json

    Write-Host "  API Response: success=$($apiResult.success), status=$(if($apiResult.error){'ERROR'}else{'OK'})"

    # Get after state
    $after = Query-DB -table $table -id $recordId
    Write-Host "  After: $(if($after){$after.deletedAt}else'NULL')"

    $changed = ($null -ne $before.deletedAt) -ne ($null -ne $after.deletedAt)
    $passed = $apiResult.success -eq $true -and $changed

    Write-Host "  Result: $(if($passed){'PASS ✓'}else{'FAIL ✗'}) - $desc"

    return @{
        Name = $name
        ApiSuccess = $apiResult.success
        DbChanged = $changed
        Passed = $passed
    }
}

# Main
Write-Host "=== DELETE OPERATION RUNTIME AUDIT ===" -ForegroundColor Cyan

# Get cookie
$cookieArg = Get-CookieArg
Write-Host "Using session cookie: $($cookieArg.Substring(0,40))..." -ForegroundColor Gray

# List: classes
Write-Host "`n--- FETCHING AVAILABLE DATA ---" -ForegroundColor Gray

# Test 1: Delete class
Write-Host "`n[TEST 1] CLASS (soft delete)" -ForegroundColor Green
$classesJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/classes" | ConvertFrom-Json
if ($classesJson.data.Count -gt 0) {
    $c = $classesJson.data[0]
    Write-Host "  Testing class: $($c.name) [$($c.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/classes?id=$($c.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "ClassCategory" -id $c.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No classes found" }

# Test 2: Subject
Write-Host "`n[TEST 2] SUBJECT (soft delete)" -ForegroundColor Green
$subjectsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/subjects" | ConvertFrom-Json
if ($subjectsJson.data.Count -gt 0) {
    $s = $subjectsJson.data[0]
    Write-Host "  Testing subject: $($s.name) [$($s.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/subjects?id=$($s.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Subject" -id $s.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No subjects found" }

# Test 3: Chapter
Write-Host "`n[TEST 3] CHAPTER (soft delete)" -ForegroundColor Green
$chaptersJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/chapters" | ConvertFrom-Json
if ($chaptersJson.data.Count -gt 0) {
    $ch = $chaptersJson.data[0]
    Write-Host "  Testing chapter: $($ch.name) [$($ch.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/chapters?id=$($ch.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Chapter" -id $ch.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No chapters found" }

# Test 4: MCQ
Write-Host "`n[TEST 4] MCQ (soft delete)" -ForegroundColor Green
$mcqsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/mcq" | ConvertFrom-Json
if ($mcqsJson.data.Count -gt 0) {
    $m = $mcqsJson.data[0]
    Write-Host "  Testing MCQ: $($m.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/mcq?id=$($m.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "MCQ" -id $m.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No MCQs found" }

# Test 5: CQ
Write-Host "`n[TEST 5] CQ (soft delete)" -ForegroundColor Green
$cqsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/cq" | ConvertFrom-Json
if ($cqsJson.data.Count -gt 0) {
    $cq = $cqsJson.data[0]
    Write-Host "  Testing CQ: $($cq.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/cq?id=$($cq.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "CQ" -id $cq.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No CQs found" }

# Test 6: Lecture
Write-Host "`n[TEST 6] LECTURE (soft delete)" -ForegroundColor Green
$lecturesJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/lectures" | ConvertFrom-Json
if ($lecturesJson.data.Count -gt 0) {
    $l = $lecturesJson.data[0]
    Write-Host "  Testing lecture: $($l.title) [$($l.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/lectures?id=$($l.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Lecture" -id $l.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No lectures found" }

# Test 7: Banner
Write-Host "`n[TEST 7] BANNER (soft delete)" -ForegroundColor Green
$bannersJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/banners" | ConvertFrom-Json
if ($bannersJson.data.Count -gt 0) {
    $b = $bannersJson.data[0]
    Write-Host "  Testing banner: $($b.title) [$($b.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/banners?id=$($b.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Banner" -id $b.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No banners found" }

# Test 8: FAQ
Write-Host "`n[TEST 8] FAQ (soft delete)" -ForegroundColor Green
$faqsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/faqs" | ConvertFrom-Json
if ($faqsJson.data.Count -gt 0) {
    $f = $faqsJson.data[0]
    Write-Host "  Testing FAQ: $($f.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/faqs?id=$($f.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "FAQ" -id $f.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No FAQs found" }

# Test 9: Notice
Write-Host "`n[TEST 9] NOTICE (soft delete)" -ForegroundColor Green
$noticesJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/notices" | ConvertFrom-Json
if ($noticesJson.data.Count -gt 0) {
    $n = $noticesJson.data[0]
    Write-Host "  Testing notice: $($n.title) [$($n.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/notices?id=$($n.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Notice" -id $n.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No notices found" }

# Test 10: Board
Write-Host "`n[TEST 10] BOARD (soft delete)" -ForegroundColor Green
$boardsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/boards" | ConvertFrom-Json
if ($boardsJson.data.Count -gt 0) {
    $bd = $boardsJson.data[0]
    Write-Host "  Testing board: $($bd.name) [$($bd.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/boards?id=$($bd.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Board" -id $bd.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No boards found" }

# Test 11: Package
Write-Host "`n[TEST 11] PACKAGE (soft delete)" -ForegroundColor Green
$packagesJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/packages" | ConvertFrom-Json
if ($packagesJson.data.Count -gt 0) {
    $p = $packagesJson.data[0]
    Write-Host "  Testing package: $($p.title) [$($p.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/packages?id=$($p.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "ContentPackage" -id $p.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No packages found" }

# Test 12: Bundle
Write-Host "`n[TEST 12] BUNDLE (soft delete)" -ForegroundColor Green
$bundlesJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/bundles" | ConvertFrom-Json
if ($bundlesJson.data.Count -gt 0) {
    $bund = $bundlesJson.data[0]
    Write-Host "  Testing bundle: $($bund.title) [$($bund.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/bundles?id=$($bund.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "ContentBundle" -id $bund.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No bundles found" }

# Test 13: Exam
Write-Host "`n[TEST 13] EXAM (soft delete)" -ForegroundColor Green
$examsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/exams" | ConvertFrom-Json
if ($examsJson.data.Count -gt 0) {
    $e = $examsJson.data[0]
    Write-Host "  Testing exam: $($e.title) [$($e.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/exams?id=$($e.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Exam" -id $e.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No exams found" }

# Test 14: User (HARD delete)
Write-Host "`n[TEST 14] USER (hard delete)" -ForegroundColor Green
$usersJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/users" | ConvertFrom-Json
$nonAdmin = $usersJson.data | Where-Object { $_.role -ne "SUPER_ADMIN" } | Select-Object -First 1
if ($nonAdmin) {
    Write-Host "  Testing user: $($nonAdmin.email) [$($nonAdmin.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/users?id=$($nonAdmin.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "User" -id $nonAdmin.id
    Write-Host "  DB after delete: $($after)"
} else { Write-Host "  No non-admin users found" }

# Test 15: Note (hard delete)
Write-Host "`n[TEST 15] NOTE (hard delete)" -ForegroundColor Green
$notesJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/notes" | ConvertFrom-Json
if ($notesJson.data.Count -gt 0) {
    $note = $notesJson.data[0]
    Write-Host "  Testing note: $($note.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/notes?id=$($note.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
} else { Write-Host "  No notes found" }

# Test 16: Notification (hard delete)
Write-Host "`n[TEST 16] NOTIFICATION (hard delete)" -ForegroundColor Green
$notifsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/notifications" | ConvertFrom-Json
if ($notifsJson.data.Count -gt 0) {
    $notif = $notifsJson.data[0]
    Write-Host "  Testing notification: $($notif.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/notifications?id=$($notif.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
} else { Write-Host "  No notifications found" }

# Test 17: Knowledge Question
Write-Host "`n[TEST 17] KNOWLEDGE QUESTION (soft delete)" -ForegroundColor Green
$kqsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/knowledge-questions" | ConvertFrom-Json
if ($kqsJson.data.Count -gt 0) {
    $kq = $kqsJson.data[0]
    Write-Host "  Testing KQ: $($kq.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/knowledge-questions?id=$($kq.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "KnowledgeQuestion" -id $kq.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No knowledge questions found" }

# Test 18: Suggestion
Write-Host "`n[TEST 18] SUGGESTION (soft delete)" -ForegroundColor Green
$sugsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/suggestions" | ConvertFrom-Json
if ($sugsJson.data.Count -gt 0) {
    $sug = $sugsJson.data[0]
    Write-Host "  Testing suggestion: $($sug.id)"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/suggestions?id=$($sug.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Suggestion" -id $sug.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No suggestions found" }

# Test 19: Topic
Write-Host "`n[TEST 19] TOPIC (soft delete)" -ForegroundColor Green
$topicsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/topics" | ConvertFrom-Json
if ($topicsJson.data.Count -gt 0) {
    $t = $topicsJson.data[0]
    Write-Host "  Testing topic: $($t.name) [$($t.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/topics?id=$($t.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Topic" -id $t.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No topics found" }

# Test 20: Featured Content
Write-Host "`n[TEST 20] FEATURED CONTENT (soft delete)" -ForegroundColor Green
$featJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/featured" | ConvertFrom-Json
if ($featJson.data.Count -gt 0) {
    $fc = $featJson.data[0]
    Write-Host "  Testing featured: $($fc.title) [$($fc.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/featured?id=$($fc.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "FeaturedContent" -id $fc.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No featured content found" }

# Test 21: Testimonial
Write-Host "`n[TEST 21] TESTIMONIAL (soft delete)" -ForegroundColor Green
$testsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/testimonials" | ConvertFrom-Json
if ($testsJson.data.Count -gt 0) {
    $tst = $testsJson.data[0]
    Write-Host "  Testing testimonial: $($tst.name) [$($tst.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/testimonials?id=$($tst.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Testimonial" -id $tst.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No testimonials found" }

# Test 22: Content Type
Write-Host "`n[TEST 22] CONTENT TYPE (soft delete)" -ForegroundColor Green
$ctsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/content-types" | ConvertFrom-Json
if ($ctsJson.data.Count -gt 0) {
    $ct = $ctsJson.data[0]
    Write-Host "  Testing content type: $($ct.key) [$($ct.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/content-types?id=$($ct.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "ContentType" -id $ct.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No content types found" }

# Test 23: Navigation
Write-Host "`n[TEST 23] NAVIGATION (soft delete)" -ForegroundColor Green
$navsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/navigation" | ConvertFrom-Json
if ($navsJson.data.Count -gt 0) {
    $nav = $navsJson.data[0]
    Write-Host "  Testing nav: $($nav.label) [$($nav.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/navigation?id=$($nav.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "Navigation" -id $nav.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No navigation items found" }

# Test 24: Exam Year
Write-Host "`n[TEST 24] EXAM YEAR (soft delete)" -ForegroundColor Green
$yearsJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/years" | ConvertFrom-Json
if ($yearsJson.data.Count -gt 0) {
    $yr = $yearsJson.data[0]
    Write-Host "  Testing year: $($yr.year) [$($yr.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/years?id=$($yr.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "ExamYear" -id $yr.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No exam years found" }

# Test 25: Teacher Moderator
Write-Host "`n[TEST 25] TEACHER (soft delete)" -ForegroundColor Green
$teachersJson = curl -s $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/teacher-moderators" | ConvertFrom-Json
if ($teachersJson.data.Count -gt 0) {
    $teach = $teachersJson.data[0]
    Write-Host "  Testing teacher: $($teach.name) [$($teach.id)]"
    $testResult = curl -s -X DELETE $cookieArg -H "Content-Type: application/json" "$baseUrl/admin/teacher-moderators?id=$($teach.id)" | ConvertFrom-Json
    Write-Host "  API: success=$($testResult.success) msg=$($testResult.message)"
    $after = Query-DB -table "TeacherModerator" -id $teach.id
    Write-Host "  DB after delete: deletedAt=$($after.deletedAt)"
} else { Write-Host "  No teachers found" }

Write-Host "`n=== AUDIT COMPLETE ===" -ForegroundColor Cyan