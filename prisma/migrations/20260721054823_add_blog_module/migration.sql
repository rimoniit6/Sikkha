-- DropIndex
DROP INDEX "AuditLog_hash_idx";

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "gallery" TEXT,
    "authorId" TEXT,
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "scheduledAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "ogImage" TEXT,
    "robots" TEXT,
    "jsonLd" TEXT,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "deleteReason" TEXT,
    "seriesId" TEXT,
    "seriesOrder" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlogPost_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "BlogSeries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("postId", "tagId"),
    CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogRelatedPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "relatedPostId" TEXT NOT NULL,
    CONSTRAINT "BlogRelatedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogRelatedPost_relatedPostId_fkey" FOREIGN KEY ("relatedPostId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE INDEX "BlogCategory_isActive_deletedAt_idx" ON "BlogCategory"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_publishedAt_isActive_deletedAt_idx" ON "BlogPost"("status", "publishedAt", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_status_isActive_deletedAt_idx" ON "BlogPost"("categoryId", "status", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_isFeatured_status_isActive_deletedAt_idx" ON "BlogPost"("isFeatured", "status", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_seriesId_idx" ON "BlogPost"("seriesId");

-- CreateIndex
CREATE INDEX "BlogPostTag_tagId_idx" ON "BlogPostTag"("tagId");

-- CreateIndex
CREATE INDEX "BlogRelatedPost_postId_idx" ON "BlogRelatedPost"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogRelatedPost_postId_relatedPostId_key" ON "BlogRelatedPost"("postId", "relatedPostId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogSeries_slug_key" ON "BlogSeries"("slug");
