const fs = require('fs');
const path = require('path');

const lovableRoutesDir = path.join(__dirname, 'lovable', 'campus-muse-studio-main', 'campus-muse-studio-main', 'src', 'routes');
const nextAppDir = path.join(__dirname, 'app');

function getNextjsPath(filename) {
    if (filename === 'index.tsx') return path.join(nextAppDir, 'page.tsx');
    if (filename === 'login.tsx') return path.join(nextAppDir, 'login', 'page.tsx');
    if (filename === 'app.index.tsx') return path.join(nextAppDir, 'student', 'dashboard', 'page.tsx');
    
    // Map specific routes
    if (filename.startsWith('app.')) {
        let name = filename.replace('app.', '').replace('.tsx', '');
        
        if (name === 'tsx') return null; // app.tsx is layout

        let parts = name.split('.');
        
        // e.g. app.recruiter.jobs.tsx -> recruiter/jobs
        if (['recruiter', 'university', 'admin'].includes(parts[0])) {
            if (parts.length === 1) {
                return path.join(nextAppDir, parts[0], 'dashboard', 'page.tsx');
            } else {
                return path.join(nextAppDir, parts[0], parts[1], 'page.tsx');
            }
        }
        
        // student routes: app.jobs.tsx -> student/jobs/page.tsx
        return path.join(nextAppDir, 'student', parts[0], 'page.tsx');
    }
    return null;
}

function processContent(content, filename) {
    // 1. Replace router imports
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]@tanstack\/react-router['"];?/, (match, group) => {
        if (group.includes('Link')) return 'import Link from "next/link";';
        return '';
    });

    // 2. Remove route export block
    content = content.replace(/export\s+const\s+Route\s*=\s*createFileRoute\([^)]*\)\(\{[\s\S]*?\}\);?/m, '');

    // 3. Export default the main component
    // We look for `function ComponentName()`
    // Usually it's the one passed to component: ComponentName, but since we removed it, we just export default the first major function component that matches the filename context.
    // A simple hack is just to change `function ` to `export default function ` for the main one. We can just replace all `function ` that don't have export with export default if they match the likely main component name, or just the first non-helper function.
    // Let's just find `function Dashboard()`, `function Jobs()`, etc.
    // Actually, Lovable usually names the component based on the file or it's just the last function.
    // Let's just look at what createFileRoute exported.
    let componentNameMatch = content.match(/component:\s*([A-Za-z0-9_]+)/);
    if (componentNameMatch) {
        let compName = componentNameMatch[1];
        let regex = new RegExp(`function\\s+${compName}\\s*\\(`);
        content = content.replace(regex, `export default function ${compName}(`);
        
        // Also remove the Route block if it wasn't caught by the first regex
        content = content.replace(new RegExp(`export\\s+const\\s+Route\\s*=\s*createFileRoute[\\s\\S]*?component:\\s*${compName},?[\\s\\S]*?\\}\\);?`, 'm'), '');
    }

    // 4. Replace `to="/app/..."` with `href="/student/..."`
    // Convert links
    content = content.replace(/to=['"](\/[^'"]*)['"]/g, (match, url) => {
        if (url === '/app') return `href="/student/dashboard"`;
        if (url === '/app/recruiter') return `href="/recruiter/dashboard"`;
        if (url === '/app/university') return `href="/university/dashboard"`;
        if (url === '/app/admin') return `href="/admin/dashboard"`;
        
        if (url.startsWith('/app/recruiter/')) return `href="${url.replace('/app/recruiter', '/recruiter')}"`;
        if (url.startsWith('/app/university/')) return `href="${url.replace('/app/university', '/university')}"`;
        if (url.startsWith('/app/admin/')) return `href="${url.replace('/app/admin', '/admin')}"`;
        
        if (url.startsWith('/app/')) return `href="${url.replace('/app', '/student')}"`;
        
        return `href="${url}"`;
    });

    return content;
}

const files = fs.readdirSync(lovableRoutesDir);

for (const file of files) {
    if (!file.endsWith('.tsx') || file.startsWith('__')) continue;
    
    const targetPath = getNextjsPath(file);
    if (!targetPath) continue;

    console.log(`Migrating ${file} -> ${targetPath}`);

    let content = fs.readFileSync(path.join(lovableRoutesDir, file), 'utf8');
    
    // Extract component name before processing removes it
    let componentNameMatch = content.match(/component:\s*([A-Za-z0-9_]+)/);
    let compName = componentNameMatch ? componentNameMatch[1] : null;

    content = processContent(content, file);

    // If processContent didn't replace because the regex failed, fallback:
    if (compName && !content.includes(`export default function ${compName}`)) {
        let regex = new RegExp(`function\\s+${compName}\\s*\\(`);
        content = content.replace(regex, `export default function ${compName}(`);
    }

    // Ensure directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, content, 'utf8');
}

console.log("Migration script complete.");
