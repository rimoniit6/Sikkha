import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'fs'

const files = globSync('prisma/seed-data/*.seed.ts')

function fixCreateCall(text: string): string {
  // Match .create({ ... }) patterns (single and multi-line)
  const result: string[] = []
  let i = 0
  while (i < text.length) {
    const createIdx = text.indexOf('.create({', i)
    if (createIdx === -1) {
      result.push(text.slice(i))
      break
    }

    // Check if there's already `data:` after `.create({`
    const beforeData = text.slice(createIdx + 9, createIdx + 20)
    if (beforeData.trimStart().startsWith('data:')) {
      // Already has data: wrapper
      result.push(text.slice(i, createIdx + 9))
      i = createIdx + 9
      continue
    }

    // Check if this .create({ is inside an upsert's create: key
    const before = text.slice(Math.max(0, createIdx - 200), createIdx)
    if (before.match(/upsert\s*\([^)]*$/)) {
      // This is inside upsert - the { is not the data but the whole upsert arg
      // Actually .create({ inside upsert means db.xxx.create({...})
      // which should still have data:
    }

    // Push everything before .create({
    result.push(text.slice(i, createIdx + 8))
    result.push('.create({ data: ')

    // Now find matching closing brace
    let depth = 1
    let j = createIdx + 9  // after .create({
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++
      else if (text[j] === '}') depth--
      if (depth > 0) j++
    }
    // j points to the closing }
    const inner = text.slice(createIdx + 9, j)
    result.push(inner)
    result.push(' }')
    i = j + 1
  }
  return result.join('')
}

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const fixed = fixCreateCall(content)
  if (fixed !== content) {
    writeFileSync(file, fixed, 'utf-8')
    console.log(`Fixed: ${file}`)
  } else {
    console.log(`No changes: ${file}`)
  }
}
