const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Replace hasWriteAccess calls in methods
content = content.replace(/if \(!hasWriteAccess\(\[m\.categoryId\]\)\) return;/g, "if (!hasWriteAccess('materijali')) return;");
content = content.replace(/if \(!hasWriteAccess\(\[mat\.categoryId\]\)\) return;/g, "if (!hasWriteAccess('materijali')) return;");
content = content.replace(/if \(updates.categoryId && updates.categoryId !== mat.categoryId && !hasWriteAccess\(\[updates.categoryId\]\)\) return;\n/g, "");

// Delivery
content = content.replace(/if \(!hasWriteAccess\(getCategoriesForMaterials\(d\.materialIds \|\| \[\]\)\)\) return;/g, "if (!hasWriteAccess('dostava')) return;");
content = content.replace(/if \(!hasWriteAccess\(getCategoriesForMaterials\(del\.materialIds \|\| \[\]\)\)\) return;/g, "if (!hasWriteAccess('dostava')) return;");
content = content.replace(/if \(updates.materialIds && !hasWriteAccess\(getCategoriesForMaterials\(updates.materialIds\)\)\) return;\n/g, "");

// Work
content = content.replace(/if \(!hasWriteAccess\(getCategoriesForMaterials\(w\.materialIds \|\| \[\]\)\)\) return;/g, "if (!hasWriteAccess('radovi')) return;");
content = content.replace(/if \(!hasWriteAccess\(getCategoriesForMaterials\(work\.materialIds \|\| \[\]\)\)\) return;/g, "if (!hasWriteAccess('radovi')) return;");

// Saving
content = content.replace(/if \(!hasWriteAccess\(getCategoriesForSaving\(s\)\)\) return;/g, "if (!hasWriteAccess('ustede')) return;");
content = content.replace(/if \(!hasWriteAccess\(getCategoriesForSaving\(sav\)\)\) return;/g, "if (!hasWriteAccess('ustede')) return;");
content = content.replace(/if \(\(updates.materialId \|\| updates.workId\) && !hasWriteAccess\(getCategoriesForSaving\(\{ \.\.\.sav, \.\.\.updates \}\)\)\) return;\n/g, "");

// Payment
content = content.replace(/if \(!hasWriteAccess\(\[p\.categoryId\]\)\) return;/g, "if (!hasWriteAccess('uplate')) return;");
content = content.replace(/if \(!hasWriteAccess\(\[payment\.categoryId\]\)\) return;/g, "if (!hasWriteAccess('uplate')) return;");
content = content.replace(/if \(updates.categoryId && !hasWriteAccess\(\[updates.categoryId\]\)\) return;\n/g, "");

// Remove getCategoriesForMaterials and getCategoriesForSaving
content = content.replace(/  const getCategoriesForMaterials = \([\s\S]*?\}\;\n\n/g, "");
content = content.replace(/  const getCategoriesForSaving = \([\s\S]*?\}\;\n\n/g, "");

fs.writeFileSync('src/context/AppContext.tsx', content);
console.log("Updated AppContext!");
