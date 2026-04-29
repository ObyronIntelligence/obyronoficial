const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\isaqu\\OneDrive\\Documentos\\Obsidian\\ObsidianNeural\\Obyron Neural\\Obyron';

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.md')) {
            // Calculate depth based on relative path from Obyron root
            const relativePath = path.relative(rootDir, dir);
            const parts = relativePath.split(path.sep).filter(p => p.trim() !== '');
            const depth = parts.length > 0 ? parts.length : 1; // Conversas, Pessoas, etc.

            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Generate tags string
            const hierarchyTags = ['obyron', ...parts.map(p => p.toLowerCase().replace(/\s+/g, '-')), `nivel/${depth}`];
            const uniqueTags = Array.from(new Set(hierarchyTags));
            const tagsStr = uniqueTags.join(', ');
            const cssClass = uniqueTags[1] || uniqueTags[0];

            // Replace frontmatter tags
            if (content.startsWith('---')) {
                const endOfFrontmatter = content.indexOf('---', 3);
                if (endOfFrontmatter !== -1) {
                    let frontmatter = content.substring(3, endOfFrontmatter);
                    
                    // Update tags
                    if (frontmatter.includes('tags:')) {
                        frontmatter = frontmatter.replace(/tags: \[.*?\]/, `tags: [${tagsStr}]`);
                    } else {
                        frontmatter += `\ntags: [${tagsStr}]`;
                    }

                    // Update cssclass
                    if (frontmatter.includes('cssclass:')) {
                        frontmatter = frontmatter.replace(/cssclass: .*/, `cssclass: folder-${cssClass}`);
                    } else {
                        frontmatter += `\ncssclass: folder-${cssClass}\n`;
                    }

                    content = '---' + frontmatter + content.substring(endOfFrontmatter);
                    fs.writeFileSync(fullPath, content);
                    console.log(`Updated ${relativePath}\\${file} with depth ${depth}`);
                }
            }
        }
    }
}

processDirectory(rootDir);
