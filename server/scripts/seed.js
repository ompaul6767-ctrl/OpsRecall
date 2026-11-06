import { hs, BANK } from '../services/memory.js';

// Run ONCE with:  node scripts/seed.js --confirm
// Running it again will create duplicate memories and use extra credits.

const incidents = [
  {
    content: `Incident: payments-api returned 502 Bad Gateway. nginx log: "upstream timed out (110) while reading response header from upstream".
Root cause: Node process on app-server-02 hit memory limit and was OOM-killed by the kernel.
Resolution: Ran 'pm2 restart payments-api', raised max-old-space-size to 2048MB in the PM2 config, and added a Datadog memory alert at 80% usage.`,
    metadata: { type: 'resolved_incident', service: 'payments-api', environment: 'production', source: 'seed' },
  },
  {
    content: `Incident: MongoNetworkError: connection 5 to cluster0.mongodb.net:27017 closed.
Root cause: The new AWS NAT Gateway IP for the staging environment was not added to the MongoDB Atlas Network Access whitelist.
Resolution: Logged into MongoDB Atlas, navigated to Network Access, and added the new NAT Gateway IP (198.51.100.14) to the whitelist. Restarted the backend service.`,
    metadata: { type: 'resolved_incident', service: 'database', environment: 'staging', source: 'seed' },
  },
  {
    content: `Incident: Redis connection refused. Error: "ERR max number of clients reached".
Root cause: A bug in the worker-service caused it to open new Redis connections without closing old ones, exhausting the maxclients limit (10000).
Resolution: Temporarily increased Redis maxclients to 20000 via redis-cli to restore service. Reverted worker-service deployment to version v2.1.4 which does not have the connection leak.`,
    metadata: { type: 'resolved_incident', service: 'cache', environment: 'production', source: 'seed' },
  },
  {
    content: `Incident: Kubernetes pod 'auth-service' stuck in CrashLoopBackOff. Log: "Error: Missing required environment variable: JWT_SECRET".
Root cause: The latest Helm chart deployment accidentally omitted the JWT_SECRET from the Kubernetes ConfigMap mapping.
Resolution: Manually patched the deployment using 'kubectl set env deployment/auth-service JWT_SECRET=$SECRET'. Updated the helm values.yaml in the CI/CD pipeline to include the missing key.`,
    metadata: { type: 'resolved_incident', service: 'auth-service', environment: 'production', source: 'seed' },
  },
  {
    content: `Incident: Frontend users reporting 403 Forbidden when uploading profile pictures to AWS S3.
Root cause: The S3 bucket CORS (Cross-Origin Resource Sharing) configuration was overwritten during a Terraform apply, removing the allowed origin for our production domain.
Resolution: Updated the Terraform S3 module to explicitly include 'https://app.ourcompany.com' in the allowed_origins list. Ran 'terraform apply' to restore the CORS rules.`,
    metadata: { type: 'resolved_incident', service: 'frontend-uploads', environment: 'production', source: 'seed' },
  },
  {
    content: `Incident: API requests failing with "ERR_CERT_DATE_INVALID".
Root cause: The Let's Encrypt SSL/TLS certificate on the edge Nginx router expired because the certbot auto-renew cron job failed silently due to a missing dependency.
Resolution: Manually renewed the certificate by SSHing into the edge router and running 'sudo certbot renew --force-renewal'. Restarted Nginx. Created an external uptime monitor to alert on SSL expiry 7 days in advance.`,
    metadata: { type: 'resolved_incident', service: 'edge-router', environment: 'production', source: 'seed' },
  },
  {
    content: `Incident: Postgres queries failing with "FATAL: remaining connection slots are reserved for non-replication superuser connections".
Root cause: A sudden traffic spike exhausted the PostgreSQL connection pool. PgBouncer was misconfigured and not aggressively closing idle transactions.
Resolution: Edited pgbouncer.ini to reduce 'server_idle_timeout' from 600 to 60. Restarted PgBouncer service. This instantly freed up 400 stuck connection slots.`,
    metadata: { type: 'resolved_incident', service: 'database', environment: 'production', source: 'seed' },
  },
  {
    content: `Incident: Elasticsearch cluster status turned RED. Indexing failed with "flood stage disk watermark [95%] exceeded".
Root cause: The logging volume on data-node-03 reached 96% capacity, causing Elasticsearch to lock all indices to read-only mode to prevent data corruption.
Resolution: Deleted 30 days of stale debug logs using the Elasticsearch Curator API. Ran 'PUT /_all/_settings { "index.blocks.read_only_allow_delete": null }' to unlock the indices and resume normal operations.`,
    metadata: { type: 'resolved_incident', service: 'logging', environment: 'production', source: 'seed' },
  },
];

async function seedDatabase() {
  if (!process.argv.includes('--confirm')) {
    console.log(
      `This will add ${incidents.length} incidents to bank "${BANK}".\n` +
        'Running it more than once creates duplicate memories.\n' +
        'If you are sure, run:  node scripts/seed.js --confirm'
    );
    return;
  }

  console.log('Connecting to Hindsight...');

  try {
    console.log(`Ensuring bank '${BANK}' exists...`);
    await hs.createBank(BANK, { name: 'OpsRecall Infra' });
    console.log('Bank created.');
  } catch (e) {
    console.log('Bank already exists (or could not be created):', e.message);
  }

  console.log('Retaining past incidents into memory...');
  let ok = 0;
  for (const [i, incident] of incidents.entries()) {
    try {
      // async:false waits until the memory is processed, so recall works right after seeding.
      await hs.retain(BANK, incident.content, {
        context: 'past incident post-mortem',
        metadata: incident.metadata,
        async: false,
      });
      ok++;
      console.log(`  [${i + 1}/${incidents.length}] retained`);
    } catch (error) {
      console.error(`  [${i + 1}/${incidents.length}] FAILED:`, error?.message || error);
    }
  }

  console.log(`Done. ${ok}/${incidents.length} incidents seeded into Hindsight.`);
}

seedDatabase();