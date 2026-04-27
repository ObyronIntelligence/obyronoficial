const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\isaqu\\OneDrive\\Documentos\\Obsidian\\ObsidianNeural\\Obyron Neural\\Obyron';

function processDirectory(dir, parentDirName = null) {
    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`);
        return;
    }
    
    const items = fs.readdirSync(dir);
    const dirName = path.basename(dir);
    const parentName = parentDirName || (dirName === 'Obyron' ? null : path.basename(path.dirname(dir)));

    // Identificar MOC (Map of Content) desta pasta
    const mocFile = dirName === 'Obyron' ? 'Obyron.md' : `${dirName}.md`;

    // 1. Gather all children of this directory (files and subfolders)
    const childrenNodes = [];
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            childrenNodes.push(item);
        } else if (item.endsWith('.md')) {
            if (item !== mocFile) {
                childrenNodes.push(path.basename(item, '.md'));
            }
        }
    }

    // 2. Process all Markdown files in this directory
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath, dirName);
        } else if (item.endsWith('.md')) {
            const isMoc = item === mocFile;
            
            // Calculate tags and depth
            const relativePath = path.relative(rootDir, dir);
            const parts = relativePath.split(path.sep).filter(p => p.trim() !== '');
            const depth = parts.length > 0 ? parts.length : 1;
            
            let hierarchyTags = ['obyron', ...parts.map(p => p.toLowerCase().replace(/\s+/g, '-')), `nivel/${depth}`];
            let uniqueTags = Array.from(new Set(hierarchyTags));
            let tagsStr = uniqueTags.join(', ');
            let cssClass = uniqueTags[1] || uniqueTags[0];
            
            let content = fs.readFileSync(fullPath, 'utf8');
            let lines = content.split('\n');
            let frontmatterStart = -1;
            let frontmatterEnd = -1;

            // find frontmatter
            if (lines[0].trim() === '---') {
                frontmatterStart = 0;
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '---') {
                        frontmatterEnd = i;
                        break;
                    }
                }
            }

            let frontmatterLines = [];
            let bodyLines = [];
            
            if (frontmatterStart !== -1 && frontmatterEnd !== -1) {
                frontmatterLines = lines.slice(1, frontmatterEnd);
                bodyLines = lines.slice(frontmatterEnd + 1);
            } else {
                bodyLines = lines;
            }

            // Update frontmatter tags and cssclass
            let hasTags = false;
            let hasCssClass = false;
            let cleanFrontmatter = [];
            let skipTagItems = false;
            for (let line of frontmatterLines) {
                if (line.startsWith('tags:')) {
                    cleanFrontmatter.push(`tags: [${tagsStr}]`);
                    hasTags = true;
                    skipTagItems = true;
                    continue;
                }
                if (line.startsWith('cssclass:')) {
                    cleanFrontmatter.push(`cssclass: folder-${cssClass}`);
                    hasCssClass = true;
                    skipTagItems = false;
                    continue;
                }
                if (skipTagItems && line.startsWith('  - ')) {
                    continue; // drop old multiline tags
                } else {
                    skipTagItems = false;
                    cleanFrontmatter.push(line);
                }
            }
            
            if (!hasTags) cleanFrontmatter.push(`tags: [${tagsStr}]`);
            if (!hasCssClass) cleanFrontmatter.push(`cssclass: folder-${cssClass}`);

            let newFrontmatter = ['---', ...cleanFrontmatter, '---'];

            // Now handle links
            // Find "## Conteúdos e Conexões" or "## Relacionamentos" or create it
            let conexoesIndex = bodyLines.findIndex(line => line.startsWith('## Conteúdos e Conexões') || line.startsWith('## Relacionamentos'));
            
            if (conexoesIndex === -1) {
                // Not found, append to end
                bodyLines.push('');
                bodyLines.push('## Conteúdos e Conexões');
                conexoesIndex = bodyLines.length - 1;
            }

            // Gather existing links in body (naive search)
            let existingLinks = new Set();
            for (const line of bodyLines) {
                let matches = line.match(/\[\[(.*?)\]\]/g);
                if (matches) {
                    for (const m of matches) {
                        existingLinks.add(m.replace('[[', '').replace(']]', ''));
                    }
                }
            }

            let linksToAdd = [];
            if (isMoc) {
                if (parentName && !existingLinks.has(parentName)) {
                    linksToAdd.push(parentName);
                    existingLinks.add(parentName);
                }
                for (const child of childrenNodes) {
                    if (!existingLinks.has(child)) {
                        linksToAdd.push(child);
                        existingLinks.add(child);
                    }
                }
            } else {
                // leaf node, ensure link to parent directory (dirName)
                if (dirName !== 'Obyron' && !existingLinks.has(dirName)) {
                    linksToAdd.push(dirName);
                    existingLinks.add(dirName);
                }
            }

            if (linksToAdd.length > 0) {
                // insert after conexoesIndex
                for (const link of linksToAdd) {
                    bodyLines.splice(conexoesIndex + 1, 0, `- [[${link}]]`);
                    conexoesIndex++; // move down
                }
            }

            let finalContent = [...newFrontmatter, ...bodyLines].join('\n');
            if (finalContent !== content) {
                fs.writeFileSync(fullPath, finalContent, 'utf8');
                console.log(`Fixed: ${relativePath ? relativePath + '\\' : ''}${item}`);
            }
        }
    }
}

console.log("Starting hierarchy fix...");
processDirectory(rootDir);
console.log("Hierarchy fix completed.");
