export async function checkCVEs(fileContents) {
  const pkgJson = fileContents.find((f) => f.path.endsWith('package.json'));
  if (!pkgJson || !pkgJson.content) return [];

  try {
    const pkg = JSON.parse(pkgJson.content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const findings = [];
    
    if (Object.keys(deps).length === 0) return [];

    // We can only batch query OSV.dev up to 1000 packages.
    const queries = Object.keys(deps).map((name) => {
      let version = deps[name].replace(/[\^~><=]/g, '').trim();
      if (!version) version = '0.0.0';
      return {
        package: { name, ecosystem: 'npm' },
        version: version,
      };
    }).slice(0, 100); // cap at 100 just in case

    if (queries.length === 0) return [];

    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    });

    if (!res.ok) return [];
    const data = await res.json();

    if (data && data.results) {
      data.results.forEach((result, idx) => {
        if (result.vulns && result.vulns.length > 0) {
          const pkgName = queries[idx].package.name;
          const pkgVersion = queries[idx].version;
          const vuln = result.vulns[0]; // Take the first major vuln
          
          findings.push({
            type: 'security',
            severity: 'high',
            title: `Known CVE in ${pkgName}@${pkgVersion}`,
            description: `Vulnerability ${vuln.id} detected in dependency ${pkgName}. ${vuln.summary || 'Update package immediately to avoid exploits.'}`,
            file: pkgJson.path,
            line: 1, // hard to parse exact line without ast, default to 1
            fix: `npm update ${pkgName} or switch to a patched version.`,
            confirmed: true,
          });
        }
      });
    }

    return findings;
  } catch (err) {
    console.warn('CVE Check failed:', err.message);
    return [];
  }
}
