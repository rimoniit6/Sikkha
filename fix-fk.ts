import { readFileSync, writeFileSync } from 'fs'

const filePath = 'src/lib/soft-delete.ts'
let content = readFileSync(filePath, 'utf-8')
let count = 0

// Replace `${model}Id` → fkField(model) — but NOT the fkField function definition itself
const patterns = [
  // softDelete()
  { from: "where: { [`\${model}Id`]: id, deletedAt: null },", to: "where: { [fkField(model)]: id, deletedAt: null }," },
  { from: "where: { [`\${model}Id`]: id, deletedAt: null },", to: "where: { [fkField(model)]: id, deletedAt: null }," },
  
  // restore() cascade
  { from: "[`\${model}Id`]: id,", to: "[fkField(model)]: id," },
  
  // bulkRestore()
  { from: "[`\${item.model}Id`]: item.id,", to: "[fkField(item.model)]: item.id," },
  
  // previewForceDelete() - direct children
  { from: "db[getPrismaModel(childModel)].count({ where: { [`\${model}Id`]: id, deletedAt: null } }),", to: "db[getPrismaModel(childModel)].count({ where: { [fkField(model)]: id, deletedAt: null } })," },
  { from: "db[getPrismaModel(childModel)].count({ where: { [`\${model}Id`]: id, deletedAt: { not: null } } }),", to: "db[getPrismaModel(childModel)].count({ where: { [fkField(model)]: id, deletedAt: { not: null } } })," },
  
  // previewForceDelete() - grandchildren
  { from: "where: { [`\${model}Id`]: id, deletedAt: { not: null } },", to: "where: { [fkField(model)]: id, deletedAt: { not: null } }," },
  { from: "db[getPrismaModel(grandchildModel)].count({ where: { [`\${childModel}Id`]: child.id, deletedAt: null } }),", to: "db[getPrismaModel(grandchildModel)].count({ where: { [fkField(childModel)]: child.id, deletedAt: null } })," },
  { from: "db[getPrismaModel(grandchildModel)].count({ where: { [`\${childModel}Id`]: child.id, deletedAt: { not: null } } }),", to: "db[getPrismaModel(grandchildModel)].count({ where: { [fkField(childModel)]: child.id, deletedAt: { not: null } } })," },
  
  // forceDelete()
  { from: "tx[getPrismaModel(childModel)].count({ where: { [`\${model}Id`]: id, deletedAt: null } }),", to: "tx[getPrismaModel(childModel)].count({ where: { [fkField(model)]: id, deletedAt: null } })," },
  { from: "tx[getPrismaModel(childModel)].count({ where: { [`\${model}Id`]: id, deletedAt: { not: null } } }),", to: "tx[getPrismaModel(childModel)].count({ where: { [fkField(model)]: id, deletedAt: { not: null } } })," },
  { from: "where: { [`\${model}Id`]: id, deletedAt: { not: null } },", to: "where: { [fkField(model)]: id, deletedAt: { not: null } }," },
  
  // bulkForceDelete()
  { from: "tx[getPrismaModel(childModel)].count({ where: { [`\${item.model}Id`]: item.id, deletedAt: null } }),", to: "tx[getPrismaModel(childModel)].count({ where: { [fkField(item.model)]: item.id, deletedAt: null } })," },
  { from: "tx[getPrismaModel(childModel)].count({ where: { [`\${item.model}Id`]: item.id, deletedAt: { not: null } } }),", to: "tx[getPrismaModel(childModel)].count({ where: { [fkField(item.model)]: item.id, deletedAt: { not: null } } })," },
  { from: "where: { [`\${item.model}Id`]: item.id, deletedAt: { not: null } },", to: "where: { [fkField(item.model)]: item.id, deletedAt: { not: null } }," },
  
  // analyzeDeleteImpact()
  { from: "db[getPrismaModel(childModel)].count({ where: { [`\${model}Id`]: id, deletedAt: null } }),", to: "db[getPrismaModel(childModel)].count({ where: { [fkField(model)]: id, deletedAt: null } })," },
  { from: "db[getPrismaModel(childModel)].count({ where: { [`\${model}Id`]: id, deletedAt: { not: null } } }),", to: "db[getPrismaModel(childModel)].count({ where: { [fkField(model)]: id, deletedAt: { not: null } } })," },
  { from: "where: { [`\${model}Id`]: id, deletedAt: { not: null } },", to: "where: { [fkField(model)]: id, deletedAt: { not: null } }," },
  { from: "db[getPrismaModel(grandchildModel)].count({ where: { [`\${directChild.model}Id`]: child.id, deletedAt: null } })", to: "db[getPrismaModel(grandchildModel)].count({ where: { [fkField(directChild.model)]: child.id, deletedAt: null } })" },
  { from: "db[getPrismaModel(grandchildModel)].count({ where: { [`\${directChild.model}Id`]: child.id, deletedAt: { not: null } } })", to: "db[getPrismaModel(grandchildModel)].count({ where: { [fkField(directChild.model)]: child.id, deletedAt: { not: null } } })" },
]

for (const p of patterns) {
  const before = content
  while (content.includes(p.from)) {
    content = content.replace(p.from, p.to)
    count++
  }
}

// Remove the fkField function definition line (it's now used, not dead code)
// The function was already added in the FK_FIELD_MAP section

writeFileSync(filePath, content, 'utf-8')
console.log(`Done. ${count} replacements made.`)
