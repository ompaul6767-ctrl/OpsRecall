import { hs, BANK } from '../services/memory.js';

const incidents = [
  {
    content: `Incident: payments-api returned 502 Bad Gateway. nginx log: "upstream timed out (110) while reading response header from upstream".
Root cause: Node process on app-server-02 hit memory limit and was OOM-killed by the kernel.
Resolution: Ran 'pm2 restart payments-api', raised max-old-space-size to 2048MB in the PM2 config, and added a Datadog memory alert at 80% usage.`,
    metadata: { type: 'resolved_incident', service: 'payments-api', environment: 'production' }
  },
  {
    content: `Incident: MongoNetworkError: connection 5 to cluster0.mongodb.net:27017 closed.
Root cause: The new AWS NAT Gateway IP for the staging environment was not added to the MongoDB Atlas Network Access whitelist.
Resolution: Logged into MongoDB Atlas, navigated to Network Access, and added the new NAT Gateway IP (198.51.100.14) to the whitelist. Restarted the backend service.`,
    metadata: { type: 'resolved_incident', service: 'database', environment: 'staging' }
  },
  {
    content: `Incident: Redis connection refused. Error: "ERR max number of clients reached".
Root cause: A bug in the worker-service caused it to open new Redis connections without closing old ones, exhausting the maxclients limit (10000).
Resolution: Temporarily increased Redis maxclients to 20000 via redis-cli to restore service. Reverted worker-service deployment to version v2.1.4 which does not have the connection leak.`,
    metadata: { type: 'resolved_incident', service: 'cache', environment: 'production' }
  },
  {
    content: `Incident: Kubernetes pod 'auth-service' stuck in CrashLoopBackOff. Log: "Error: Missing required environment variable: JWT_SECRET".
Root cause: The latest Helm chart deployment accidentally omitted the JWT_SECRET from the Kubernetes ConfigMap mapping.
Resolution: Manually patched the deployment using 'kubectl set env deployment/auth-service JWT_SECRET=$SECRET'. Updated the helm values.yaml in the CI/CD pipeline to include the missing key.`,
    metadata: { type: 'resolved_incident', service: 'auth-service', environment: 'production' }
  },
  {
    content: `Incident: Frontend users reporting 403 Forbidden when uploading profile pictures to AWS S3.
Root cause: The S3 bucket CORS (Cross-Origin Resource Sharing) configuration was overwritten during a Terraform apply, removing the allowed origin for our production domain.
Resolution: Updated the Terraform S3 module to explicitly include 'https://app.ourcompany.com' in the allowed_origins list. Ran 'terraform apply' to restore the CORS rules.`,
    metadata: { type: 'resolved_incident', service: 'frontend-uploads', environment: 'production' }
  },
  {
    content: `Incident: API requests failing with "ERR_CERT_DATE_INVALID".
Root cause: The Let's Encrypt SSL/TLS certificate on the edge Nginx router expired because the certbot auto-renew cron job failed silently due to a missing dependency.
Resolution: Manually renewed the certificate by SSHing into the edge router and running 'sudo certbot renew --force-renewal'. Restarted Nginx. Created an external uptime monitor to alert on SSL expiry 7 days in advance.`,
    metadata: { type: 'resolved_incident', service: 'edge-router', environment: 'production' }
  },
  {
    content: `Incident: Postgres queries failing with "FATAL: remaining connection slots are reserved for non-replication superuser connections".
Root cause: A sudden traffic spike exhausted the PostgreSQL connection pool. PgBouncer was misconfigured and not aggressively closing idle transactions.
Resolution: Edited pgbouncer.ini to reduce 'server_idle_timeout' from 600 to 60. Restarted PgBouncer service. This instantly freed up 400 stuck connection slots.`,
    metadata: { type: 'resolved_incident', service: 'database', environment: 'production' }
  },
  {
    content: `Incident: Elasticsearch cluster status turned RED. Indexing failed with "flood stage disk watermark [95%] exceeded".
Root cause: The logging volume on data-node-03 reached 96% capacity, causing Elasticsearch to lock all indices to read-only mode to prevent data corruption.
Resolution: Deleted 30 days of stale debug logs using the Elasticsearch Curator API. Ran 'PUT /_all/_settings { "index.blocks.read_only_allow_delete": null }' to unlock the indices and resume normal operations.`,
    metadata: { type: 'resolved_incident', service: 'logging', environment: 'production' }
  }
];

async function seedDatabase() {
  console.log('Connecting to Hindsight...');
  
  try { 
    console.log(`Ensuring bank '${BANK}' exists...`);
    await hs.createBank(BANK, { name: 'OpsRecall Infra' }); 
    console.log('Bank created successfully.');
  } catch (e) { 
    console.log('Bank already exists (or error):', e.message); 
  }

  console.log('Retaining past incidents into memory...');
  try {
    // Note: older versions of the SDK used hs.retainBatch. 
    // If this fails, we will loop through and hs.retain() them individually.
    for (const incident of incidents) {
      await hs.retain(BANK, incident.content, { metadata: incident.metadata });
    }
    console.log(`Successfully seeded ${incidents.length} incidents into Hindsight!`);
  } catch (error) {
    console.error('Failed to seed data:', error);
  }
}

seedDatabase();