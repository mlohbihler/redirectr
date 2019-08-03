CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE redirects (
  redirect_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  hostname VARCHAR(256) NOT NULL UNIQUE,
  target_url VARCHAR(256) NOT NULL,
  redirect_type VARCHAR(8) NOT NULL, -- 301, 302, location
  append_original_url BOOLEAN NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE dns_verifications (
  redirect_id INTEGER NOT NULL PRIMARY KEY REFERENCES redirects (redirect_id) ON DELETE CASCADE,
  code UUID NOT NULL UNIQUE,
  expiry TIMESTAMP WITH TIME ZONE NOT NULL
);
