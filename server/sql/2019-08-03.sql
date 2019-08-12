CREATE TABLE staged_redirects (
  id SERIAL PRIMARY KEY,
  code UUID NOT NULL UNIQUE,
  hostname VARCHAR(256) NOT NULL,
  target_url VARCHAR(256) NOT NULL,
  redirect_type VARCHAR(8) NOT NULL, -- 301, 302, location
  append_original_url BOOLEAN NOT NULL,
  expiry TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE redirects (
  hostname VARCHAR(256) NOT NULL UNIQUE,
  target_url VARCHAR(256) NOT NULL,
  redirect_type VARCHAR(8) NOT NULL, -- 301, 302, location
  append_original_url BOOLEAN NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_hit TIMESTAMP WITH TIME ZONE
);
CREATE INDEX redirects_modified ON redirects (modified);
