#!/usr/bin/env node

/**
 * Provision or reuse a Supabase project via the Management API.
 * Outputs JSON: { projectRef, apiUrl, anonKey }
 */

const MGMT_API = 'https://api.supabase.com';

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`ERROR: Missing required env var. Set ${name}=... in your environment or .env.setup`);
    process.exit(1);
  }
  return val;
}

async function apiCall(method, path, body) {
  const token = requireEnv('SUPABASE_ACCESS_TOKEN');
  const res = await fetch(`${MGMT_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`API error ${res.status} ${method} ${path}: ${text}`);
    process.exit(1);
  }
  return res.json();
}

async function waitForReady(ref, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const project = await apiCall('GET', `/v1/projects/${ref}`);
    if (project.status === 'ACTIVE_HEALTHY') return project;
    console.error(`Waiting for project to be ready... (${project.status})`);
    await new Promise(r => setTimeout(r, 5000));
  }
  console.error('ERROR: Project did not become ready within timeout');
  process.exit(1);
}

async function getProjectKeys(ref) {
  const keys = await apiCall('GET', `/v1/projects/${ref}/api-keys`);
  const anonKey = keys.find(k => k.name === 'anon');
  if (!anonKey) {
    console.error('ERROR: Could not find anon key for project');
    process.exit(1);
  }
  return anonKey.api_key;
}

async function main() {
  const existingRef = process.env.SUPABASE_PROJECT_REF;

  if (existingRef) {
    // Reuse existing project
    console.error(`Reusing existing project: ${existingRef}`);
    const project = await apiCall('GET', `/v1/projects/${existingRef}`);
    const apiUrl = `https://${project.id}.supabase.co`;
    const anonKey = await getProjectKeys(project.id);
    console.log(JSON.stringify({ projectRef: project.id, apiUrl, anonKey }));
    return;
  }

  // Fresh provisioning
  const orgSlug = requireEnv('SUPABASE_ORG_SLUG');
  const dbPassword = requireEnv('SUPABASE_DB_PASSWORD');
  const region = process.env.SUPABASE_REGION || 'us-east-1';

  console.error('Creating new Supabase project: moto-rental');
  const created = await apiCall('POST', '/v1/projects', {
    name: 'moto-rental',
    organization_id: orgSlug,
    db_pass: dbPassword,
    region,
  });

  console.error(`Project created: ${created.id}. Waiting for it to be ready...`);
  await waitForReady(created.id);

  const apiUrl = `https://${created.id}.supabase.co`;
  const anonKey = await getProjectKeys(created.id);
  console.log(JSON.stringify({ projectRef: created.id, apiUrl, anonKey }));
}

main().catch(err => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
