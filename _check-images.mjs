import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const dbUrl = 'file:E:/Sikkhs/db/custom.db';
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

try {
  // Check CQExamAnswerImage records
  const images = await prisma.cQExamAnswerImage.findMany({ take: 10 });
  console.log("Images:", JSON.stringify(images, null, 2));
  
  // Check if there are submissions with answers that have images
  const submissions = await prisma.cQExamSubmission.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      answers: {
        include: { images: true },
        where: { images: { some: {} } },
      },
    },
  });
  console.log("\nSubmissions with images:", JSON.stringify(submissions.map(s => ({
    id: s.id,
    status: s.status,
    answersWithImages: s.answers.filter(a => a.images.length > 0).map(a => ({
      questionId: a.questionId,
      subIndex: a.subIndex,
      images: a.images.map(i => ({ id: i.id, imageUrl: i.imageUrl }))
    }))
  })), null, 2));
  
} catch(e) { console.error("Error:", e.message); } finally { await prisma.$disconnect(); }
