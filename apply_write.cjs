const fs = require('fs');

function applyWriteAccess(file, moduleName, buttonTextRegex, editButtonsRegex) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject canEdit
    if (!content.includes(`hasWriteAccess`)) {
        content = content.replace(/const { state, ([^}]*) } = useApp\(\);/, "const { state, $1, hasWriteAccess } = useApp();");
    }
    if (!content.includes(`const canEdit =`)) {
        content = content.replace(/(const { state, .*? } = useApp\(\);\n)/, "$1  const canEdit = hasWriteAccess('" + moduleName + "');\n");
    }

    // Hide add button
    // The "Nova dostava"/etc button usually starts with <button onClick={handleOpenAdd} ...> <Plus /> Text </button>
    // So we wrap it:
    if (!content.includes(`{canEdit && (`)) {
        content = content.replace(/<button[^>]*onClick=\{handleOpenAdd\}[\s\S]*?<\/button>/, "{canEdit && ( $& )}");
    }

    // Hide edit/desc buttons
    // Look for <button onClick={() => handleOpenEdit(x)} ...
    if(content.match(/<button[^>]*onClick=\{[^}]*handleOpenEdit[^}]*\}/)) {
        content = content.replace(/(<div className="flex items-center gap-1[^>]*>)\s*(<button[^>]*onClick=\{[^}]*handleOpenEdit[\s\S]*?<\/button>)\s*(<button[^>]*onClick=\{[^}]*setConfirmDeleteId[\s\S]*?<\/button>)\s*<\/div>/g, 
        "{canEdit && ( $1\n$2\n$3\n</div> )}");
    }
    
    // For Loan page: 
    if (file.includes('Loan.tsx')) {
        content = content.replace(/<button[^>]*onClick=\{[^}]*setIsEditingMode[\s\S]*?<\/button>/g, "{canEdit && ( $& )}");
        // Loan page adds payment
        content = content.replace(/<button[^>]*onClick=\{handleOpenPaymentAdd\}[\s\S]*?<\/button>/, "{canEdit && ( $& )}");
    }

    fs.writeFileSync(file, content);
    console.log("Updated " + file);
}

applyWriteAccess('src/pages/Delivery.tsx', 'dostava');
applyWriteAccess('src/pages/Works.tsx', 'radovi');
applyWriteAccess('src/pages/Savings.tsx', 'ustede');
applyWriteAccess('src/pages/Payments.tsx', 'uplate');
applyWriteAccess('src/pages/Loan.tsx', 'kredit');

