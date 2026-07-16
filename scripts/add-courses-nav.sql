-- Add কোর্স (Courses) navigation item directly via SQL to avoid encoding issues
INSERT INTO "Navigation" (id, label, route, icon, location, "order", "isAuthOnly", "isAdminOnly", "isActive", "createdAt", "updatedAt")
VALUES (
  'nav-course-' || lower(hex(randomblob(4))),
  'কোর্স',
  'course-list',
  'BookOpen',
  'header',
  3,
  false,
  false,
  true,
  datetime('now'),
  datetime('now')
);