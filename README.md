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

Create a client:
```sql
INSERT INTO users (email) VALUES ('poly@andry.com');
```
Create some redirects:
```sql
INSERT INTO redirects (user_id, hostname, target_url, redirect_type, append_original_url) VALUES
  (<userId>, 'dead.com', 'living.com', '301', true),
  (<userId>, 'old.com', 'new.com', '302', false),
  (<userId>, 'tired.com', 'wired.com', 'location', false);
```
Create a DNS verification:
```sql
INSERT INTO dns_verifications (redirect_id, code, expiry) values
  (<redirect_id>, '123e4567-e89b-12d3-a456-426655440000', NOW() + INTERVAL '4 hours');
```

Drop the schema and migration history
```sql
DROP TABLE dbchangelog;
DROP TABLE dns_verifications;
DROP TABLE redirects;
DROP TABLE users;
```

Recreate rows above, and a few more to boot:
```sql
INSERT INTO users (email) VALUES ('poly@andry.com');
INSERT INTO redirects (user_id, hostname, target_url, redirect_type, append_original_url) VALUES
  (1, 'dead.com', 'living.com', '301', true),
  (1, 'old.com', 'new.com', '302', false),
  (1, 'blog.serotoninsoftware.com', 'lohbihler.wordpress.com', 'location', false);
INSERT INTO dns_verifications (redirect_id, code, expiry) values
  (3, '123e4567-e89b-12d3-a456-426655440000', NOW() + INTERVAL '4 hours');
```
