import { YAML } from "bun";

const requiredVars = new Map<string, boolean>();
const optional = (defaultValue?: string) => {
  return (name: string) =>
    defaultValue == null ? null : "${" + name + ":-" + defaultValue + "}";
};
const required = () => {
  return (name: string) => {
    requiredVars.set(name, true);
    return "${" + name + "?" + name + " is required}";
  };
};
const configDef = {
  DB_HOST: optional("postgresql"),
  DB_NAME: optional("docs"),
  DB_USER: optional("docs"),
  DB_PORT: optional("5432"),
  DB_PASSWORD: required(),
  DOCS_HOST: required(),
  DJANGO_SECRET_KEY: required(),

  // # Mail
  DJANGO_EMAIL_HOST: optional(),
  DJANGO_EMAIL_HOST_USER: optional(),
  DJANGO_EMAIL_HOST_PASSWORD: optional(),
  DJANGO_EMAIL_PORT: optional(),
  DJANGO_EMAIL_FROM: optional(),
  DJANGO_EMAIL_USE_TLS: optional(), // Set to "true" to enable
  DJANGO_EMAIL_USE_SSL: optional(), // Set to "true" to enable
  DJANGO_EMAIL_BRAND_NAME: optional("Docs"),
  DJANGO_EMAIL_LOGO_IMG: optional("https://placehold.co/400"),

  // # Media
  AWS_S3_ENDPOINT_URL: required(),
  AWS_S3_ACCESS_KEY_ID: required(),
  AWS_S3_SECRET_ACCESS_KEY: required(),
  AWS_STORAGE_BUCKET_NAME: required(),

  // # OIDC
  OIDC_OP_JWKS_ENDPOINT: required(),
  OIDC_OP_AUTHORIZATION_ENDPOINT: required(),
  OIDC_OP_TOKEN_ENDPOINT: required(),
  OIDC_OP_USER_ENDPOINT: required(),
  OIDC_OP_LOGOUT_ENDPOINT: required(),
  OIDC_RP_CLIENT_ID: required(),
  OIDC_RP_CLIENT_SECRET: required(),
  OIDC_RP_SIGN_ALGO: optional("RS256"),
  OIDC_RP_SCOPES: optional("openid email"),
  OIDC_USERINFO_SHORTNAME_FIELD: optional(),
  OIDC_USERINFO_FULLNAME_FIELDS: optional(),

  // # AI
  // #AI_FEATURE_ENABLED=true # is false by default
  // #AI_BASE_URL=https://openaiendpoint.com
  // #AI_API_KEY=<API key>
  // #AI_MODEL=<model used> e.g. llama
  AI_FEATURE_ENABLED: optional("false"),
  AI_BASE_URL: optional(),
  AI_API_KEY: optional(),
  AI_MODEL: optional(),

  // # Frontend
  // #FRONTEND_THEME=mytheme
  // #FRONTEND_CSS_URL=https://storage.yourdomain.tld/themes/custom.css
  // #FRONTEND_FOOTER_FEATURE_ENABLED=true
  // #FRONTEND_URL_JSON_FOOTER=https://docs.domain.tld/contents/footer-demo.json
  FRONTEND_THEME: optional(),
  FRONTEND_CSS_URL: optional(),
  FRONTEND_FOOTER_FEATURE_ENABLED: optional(),
  FRONTEND_URL_JSON_FOOTER: optional(),

  Y_PROVIDER_API_KEY: required(),
  COLLABORATION_SERVER_SECRET: required(),
};

const envConfig = Object.fromEntries(
  Object.entries(configDef).map(([key, func]) => [key, func(key)])
) as unknown as {
  [key in keyof typeof configDef]: string | null;
};

// Map env vars to services
const environmentVariableAdditions: Record<
  string,
  Record<string, string | null>
> = {
  postgresql: {
    POSTGRES_DB: "${DB_NAME:-docs}",
    POSTGRES_USER: "${DB_USER:-docs}",
    POSTGRES_PASSWORD: "${DB_PASSWORD:?DB_PASSWORD is required}",
  },
  backend: {
    // https://github.com/suitenumerique/docs/blob/main/docs/env.md#impress-backend-container
    // Django
    DJANGO_ALLOWED_HOSTS: envConfig.DOCS_HOST,
    DJANGO_SECRET_KEY: envConfig.DJANGO_SECRET_KEY,
    DJANGO_SETTINGS_MODULE: "impress.settings",
    DJANGO_CONFIGURATION: "Production",

    // Logging
    LOGGING_LEVEL_HANDLERS_CONSOLE: "ERROR",
    LOGGING_LEVEL_LOGGERS_ROOT: "INFO",
    LOGGING_LEVEL_LOGGERS_APP: "INFO",

    // Python
    PYTHONPATH: "/app",

    // Mail
    DJANGO_EMAIL_HOST: envConfig.DJANGO_EMAIL_HOST,
    DJANGO_EMAIL_HOST_USER: envConfig.DJANGO_EMAIL_HOST_USER,
    DJANGO_EMAIL_HOST_PASSWORD: envConfig.DJANGO_EMAIL_HOST_PASSWORD,
    DJANGO_EMAIL_PORT: envConfig.DJANGO_EMAIL_PORT,
    DJANGO_EMAIL_FROM: envConfig.DJANGO_EMAIL_FROM,
    DJANGO_EMAIL_USE_TLS: envConfig.DJANGO_EMAIL_USE_TLS,
    DJANGO_EMAIL_USE_SSL: envConfig.DJANGO_EMAIL_USE_SSL,
    DJANGO_EMAIL_BRAND_NAME: envConfig.DJANGO_EMAIL_BRAND_NAME,
    DJANGO_EMAIL_LOGO_IMG: envConfig.DJANGO_EMAIL_LOGO_IMG,

    // Media
    AWS_S3_ENDPOINT_URL: envConfig.AWS_S3_ENDPOINT_URL,
    AWS_S3_ACCESS_KEY_ID: envConfig.AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY: envConfig.AWS_S3_SECRET_ACCESS_KEY,
    AWS_STORAGE_BUCKET_NAME: envConfig.AWS_STORAGE_BUCKET_NAME,
    MEDIA_BASE_URL: `https://${envConfig.DOCS_HOST}`,

    // OIDC
    OIDC_OP_JWKS_ENDPOINT: envConfig.OIDC_OP_JWKS_ENDPOINT,
    OIDC_OP_AUTHORIZATION_ENDPOINT: envConfig.OIDC_OP_AUTHORIZATION_ENDPOINT,
    OIDC_OP_TOKEN_ENDPOINT: envConfig.OIDC_OP_TOKEN_ENDPOINT,
    OIDC_OP_USER_ENDPOINT: envConfig.OIDC_OP_USER_ENDPOINT,
    OIDC_OP_LOGOUT_ENDPOINT: envConfig.OIDC_OP_LOGOUT_ENDPOINT,
    OIDC_RP_CLIENT_ID: envConfig.OIDC_RP_CLIENT_ID,
    OIDC_RP_CLIENT_SECRET: envConfig.OIDC_RP_CLIENT_SECRET,
    OIDC_RP_SIGN_ALGO: envConfig.OIDC_RP_SIGN_ALGO,
    OIDC_RP_SCOPES: envConfig.OIDC_RP_SCOPES,
    OIDC_USERINFO_SHORTNAME_FIELD: envConfig.OIDC_USERINFO_SHORTNAME_FIELD,
    OIDC_USERINFO_FULLNAME_FIELDS: envConfig.OIDC_USERINFO_FULLNAME_FIELDS,
    LOGIN_REDIRECT_URL: `https://${envConfig.DOCS_HOST}`,
    LOGIN_REDIRECT_URL_FAILURE: `https://${envConfig.DOCS_HOST}`,
    LOGOUT_REDIRECT_URL: `https://${envConfig.DOCS_HOST}`,
    OIDC_REDIRECT_ALLOWED_HOSTS: `["https://${envConfig.DOCS_HOST}"]`,

    // AI
    AI_FEATURE_ENABLED: envConfig.AI_FEATURE_ENABLED,
    AI_BASE_URL: envConfig.AI_BASE_URL,
    AI_API_KEY: envConfig.AI_API_KEY,
    AI_MODEL: envConfig.AI_MODEL,

    // Frontend
    FRONTEND_THEME: envConfig.FRONTEND_THEME,
    FRONTEND_CSS_URL: envConfig.FRONTEND_CSS_URL,
    FRONTEND_FOOTER_FEATURE_ENABLED: envConfig.FRONTEND_FOOTER_FEATURE_ENABLED,
    FRONTEND_URL_JSON_FOOTER: envConfig.FRONTEND_URL_JSON_FOOTER,

    // yjs
    Y_PROVIDER_API_BASE_URL: `http://y-provider:4444/api/`,
    Y_PROVIDER_API_KEY: envConfig.Y_PROVIDER_API_KEY,
    COLLABORATION_SERVER_SECRET: envConfig.COLLABORATION_SERVER_SECRET,
    COLLABORATION_API_URL: `https://${envConfig.DOCS_HOST}/collaboration/api/`,

    // Database
    DB_HOST: envConfig.DB_HOST,
    DB_NAME: envConfig.DB_NAME,
    DB_USER: envConfig.DB_USER,
    DB_PASSWORD: envConfig.DB_PASSWORD,
    DB_PORT: envConfig.DB_PORT,
  },
  "y-provider": {
    // https://github.com/suitenumerique/docs/blob/main/src/frontend/servers/y-provider/src/env.ts
    COLLABORATION_LOGGING: "true",
    COLLABORATION_SERVER_ORIGIN: `https://${envConfig.DOCS_HOST}`,
    COLLABORATION_SERVER_SECRET: envConfig.COLLABORATION_SERVER_SECRET,
    Y_PROVIDER_API_KEY: envConfig.Y_PROVIDER_API_KEY,
    COLLABORATION_BACKEND_BASE_URL: `https://${envConfig.DOCS_HOST}`,
  },
};

const composeTxt = await fetch(
  "https://raw.githubusercontent.com/suitenumerique/docs/refs/heads/main/docs/examples/compose/compose.yaml"
).then((res) => {
  if (!res.ok) {
    throw new Error(
      `Failed to fetch compose.yaml: ${res.status} ${res.statusText}`
    );
  }
  return res.text();
});

const data = YAML.parse(composeTxt) as {
  services: Record<string, any>;
  volumes?: Record<string, any>;
};

// Initialize volumes if not present
if (!data.volumes) {
  data.volumes = {};
}

for (const [name, service] of Object.entries(data.services)) {
  // Remove env_file
  if (service.env_file) {
    delete service.env_file;
  }

  // Add environment variables
  if (environmentVariableAdditions[name]) {
    // Convert to array format if not already
    if (!Array.isArray(service.environment)) {
      const envObj = service.environment || {};
      service.environment = Object.entries(envObj).map(([key, value]) =>
        value == null ? key : `${key}=${value}`
      );
    }

    // Track existing keys to avoid duplicates
    const existingKeys = new Set<string>();
    for (const item of service.environment) {
      const [key] = item.split("=");
      if (key) existingKeys.add(key);
    }

    // Add our variables
    for (const [key, value] of Object.entries(
      environmentVariableAdditions[name]
    )) {
      if (!existingKeys.has(key)) {
        service.environment.push(value == null ? key : `${key}=${value}`);
      }
    }
  }

  // Override volumes
  if (name === "postgresql") {
    service.volumes = ["postgres_data:/var/lib/postgresql/data/pgdata"];
    data.volumes!["postgres_data"] = {};
  } else if (name === "frontend") {
    delete service.volumes;
    delete service.depends_on;
  } else if (service.volumes) {
    throw new Error("Unexpected volumes for service " + name);
  }

  // Add restart policy
  service.restart = "unless-stopped";
}

// Add Caddy reverse proxy service
data.services!["caddy"] = {
  build: "./caddy",
  expose: ["8083"],
  depends_on: ["backend", "frontend", "y-provider"],
  restart: "unless-stopped",
};

const result = YAML.stringify(data, null, 2);
console.log(result);
Bun.write("docker-compose.yml", result);
Bun.write(
  ".env.example",
  Array.from(requiredVars, ([name]) => name + "=\n").join("")
);
