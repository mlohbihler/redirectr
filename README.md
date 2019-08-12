# redirectr
Fast and simple service for doing HTTP redirects

## Database
Create a database using the superuser:
```sql
create database <name>;
create user <user> with (encrypted) password '<password>';
grant all privileges on database <name> to <user>;
```

Then, update your .env file with the name (PGDATABASE), user (PGUSER), and password (PGPASSWORD) you used.

Create some redirects:
```sql
INSERT INTO redirects (hostname, target_url, redirect_type, append_original_url) VALUES
  ('dead.com', 'living.com', '301', true),
  ('old.com', 'new.com', '302', false),
  ('tired.com', 'wired.com', 'location', false);
```
Create a DNS verification:
```sql
INSERT INTO staged_redirects (code, hostname, target_url, redirect_type, append_original_url, expiry) values
  ('123e4567-e89b-12d3-a456-426655440000', 'rampr.org', 'after-1-1.com', '301', true, NOW() + INTERVAL '4 hours'),
  ('123e4567-e89b-12d3-a456-426655440001', 'rampr.org', 'after-1-2.com', '301', true, NOW() + INTERVAL '5 hours'),
  ('123e4567-e89b-12d3-a456-426655440002', 'rampr.org', 'after-1-3.com', '301', true, NOW() + INTERVAL '6 hours'),
  ('123e4567-e89b-12d3-a456-426655440003', 'rampr.org', 'after-1-4.com', '301', true, NOW() + INTERVAL '7 hours'),
  ('123e4567-e89b-12d3-a456-426655440004', 'rampr.org', 'after-1-5.com', '301', true, NOW() + INTERVAL '8 hours'),
  ('123e4567-e89b-12d3-a456-426655440005', 'rampr.org', 'after-1-6.com', '301', true, NOW() + INTERVAL '9 hours'),
  ('123e4567-e89b-12d3-a456-426655440006', 'dialrup.com', 'after-2-1.com', '301', true, NOW() + INTERVAL '4 hours'),
  ('123e4567-e89b-12d3-a456-426655440007', 'dialrup.com', 'after-2-2.com', '301', true, NOW() + INTERVAL '5 hours'),
  ('123e4567-e89b-12d3-a456-426655440008', 'dialrup.com', 'after-2-3.com', '301', true, NOW() + INTERVAL '6 hours'),
  ('123e4567-e89b-12d3-a456-426655440009', 'redirectr.org', 'after-3-1.com', '301', true, NOW() + INTERVAL '4 hours'),
  ('123e4567-e89b-12d3-a456-42665544000a', 'redirectr.org', 'after-3-2.com', '301', true, NOW() + INTERVAL '5 hours'),
  ('123e4567-e89b-12d3-a456-42665544000c', 'dead.com', 'after-5-1.com', '301', true, NOW() + INTERVAL '4 hours'),
  ('123e4567-e89b-12d3-a456-42665544000d', 'dead.com', 'after-5-2.com', '301', true, NOW() + INTERVAL '5 hours'),
  ('123e4567-e89b-12d3-a456-42665544000b', 'dialr.org', 'after-4-1.com', '301', true, NOW() + INTERVAL '4 hours');
```

Drop the schema and migration history
```sql
DROP TABLE dbchangelog;
DROP TABLE dns_verifications;
DROP TABLE redirects;
```


TODO
====
- Hit histograms
- Deactivation of unused redirects
- Delete inactive redirects
