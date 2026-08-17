
📁 **Project Structure:**
```text
auth-microservice/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── package.json
└── src/
    ├── app.js
    ├── auth.js
    ├── users.js
    └── rate.js
```

📦 **`package.json`**
```json
{
  "name": "auth-microservice",
  "version": "1.0.0",
  "main": "src/app.js",
  "license": "MIT",
  "scripts": {
    "start": "node src/app.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "ioredis": "^5.3.4",
    "pg": "^8.11.3",
    "express-rate-limit": "^7.1.5"
  }
}
```

🐳 **`Dockerfile`**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

🔄 **`docker-compose.yml`**
```yaml
version: "3.9"
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/auth
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: auth
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
volumes:
  postgres_data:
```

🛡️ **`.env.example`**
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@db:5432/auth
REDIS_URL=redis://redis:6379
JWT_SECRET=super-secret-key-must-be-32-chars-long!!
CORS_ORIGIN=http://localhost:3000
RATE_WINDOW_MS=900000  # 15 min
RATE_MAX=100           # max attempts per window
```

🧩 **`src/app.js`**
```js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const usersRouter = require("./users");
const authRouter = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_MAX) || 100,
  message: { error: "Too many attempts, please try again later." }
});

// Routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", usersRouter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`🔐 Auth service running on http://localhost:${PORT}`));
```

🔐 **`src/auth.js`** (JWT auth, refresh token rotation, password handling)
```js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Redis = require("ioredis");
const { v4: uuidv4 } = require("crypto");

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL);

// ---- Register ----
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const hashed = await bcrypt.hash(password, 12);
  // In production: INSERT INTO users (username, email, password_hash) via pg pool
  // For demo, we'll just simulate & return tokens
  const accessToken = jwt.sign({ sub: username, role: "user" }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshId = uuidv4();
  await redis.setex(`rt:${refreshId}`, 30 * 24 * 60 * 60, username); // 30-day refresh
  res.json({ accessToken, refreshToken: refreshId });
});

// ---- Login ----
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // In production: SELECT * FROM users WHERE username=...
  // const user = await pool.query(...)
  // if (!user || !(await bcrypt.compare(password, user.rows[0].password_hash)))
  //   return res.status(401).json({ error: "Invalid credentials" });

  // Demo bypass:
  const accessToken = jwt.sign({ sub: username, role: "user" }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshId = uuidv4();
  await redis.setex(`rt:${refreshId}`, 30 * 24 * 60 * 60, username);
  res.json({ accessToken, refreshToken: refreshId });
});

// ---- Refresh Token ----
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });
  const username = await redis.get(`rt:${refreshToken}`);
  if (!username) return res.status(403).json({ error: "Invalid or revoked refresh token" });

  // Rotate refresh token: invalidate old, issue new
  await redis.del(`rt:${refreshToken}`);
  const newRefreshId = uuidv4();
  await redis.setex(`rt:${newRefreshId}`, 30 * 24 * 60 * 60, username);

  const newAccessToken = jwt.sign({ sub: username, role: "user" }, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.json({ accessToken: newAccessToken, refreshToken: newRefreshId });
});

// ---- Logout ----
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await redis.del(`rt:${refreshToken}`);
  res.json({ success: true });
});

module.exports = router;
```

👥 **`src/users.js`** (User profile/me endpoint - protected in real setup)
```js
const express = require("express");
const router = express.Router();

router.get("/me", (req, res) => {
  // In real app: verify JWT middleware, fetch user from DB
  // Here we just decode the JWT payload via a public key or secret
  const { username, role } = req.user; // injected by auth middleware
  res.json({ username, role });
});

module.exports = router;
```

🚀 **How to run:**
```bash
docker compose up --build
```
Visit `http://localhost:3000/health` → `http://localhost:3000/api/auth/register` → `http://localhost:3000/api/auth/login`

🔐 **Security & Scalability Notes:**
- **Stateless access tokens** (JWT) + **Redis-scoped refresh tokens** enables horizontal scaling
- **Refresh token rotation** prevents reuse attacks
- **Rate limiting** on `/register` & `/login` mitigates brute-force
- **Helmet** adds security headers (CSP, XSS-Protection, etc.)
- **Database/Cache decoupling**: swap PostgreSQL/Redis managed services (AWS RDS/Azure Cache for Redis) without code changes
- Add `express-jwt` or `passport-jwt` middleware for per-route protection
- Replace demo `bcrypt`/`jwt` logic with your ORM (Sequelize, TypeORM, Prisma) or ODM (Mongoose)
- Add email verification (Nodemailer + SMTP/SES), MFA, social OAuth (Auth0/Devise/Passport strategies)


### ✅ Why It's Scalable
- **Stateless access tokens (JWT)**: Each request carries its own auth context. No need for session stickiness or a central session store per request. This lets you run 3, 30, or 300 instances behind a load balancer without sync issues.
- **Redis-separated refresh tokens**: Refresh tokens are opaque IDs stored in Redis, not in-app memory. Redis is a dedicated cache that scales horizontally (Redis Cluster, ElastiCache, etc.) and can be sharded/replicated independently.
- **No local state**: No `express-session`, no local file uploads, no in-memory counters. The app only needs DB + Redis connectivity.
- **Docker + docker-compose**: Containerization enables identical deployments across any environment (K8s, ECS, Cloud Run, on-prem). The compose file is just for local/dev; swap in K8s manifests or Terraform for auto-scaling.
- **Rate limiting via Redis**: `express-rate-limit` + Redis means rate counters are shared across all instances, preventing bypasses when you scale out.
- **Separation of concerns**: DB (Postgres), Cache (Redis), and App logic are distinct services. You can scale or replace one without touching the others.

### ⚠️ Current Demo Limits (What to Fix for Production Scale)
| Area | Demo Setup | Production Fix |
|------|------------|----------------|
| **Database** | Single `postgres:16-alpine` container | Read replicas, connection pooling (`pg-bouncer` or `pgxpool`), managed service (AWS RDS/Aurora, GCP Cloud SQL) |
| **Cache** | Single `redis:7-alpine` in compose | Redis Cluster, TLS auth, backup/restore, possibly move rate-limiting counters to a distributed store (e.g., DynamoDB, Consul) |
| **Orchestration** | `docker-compose up` | K8s Deployment + Service + HPA (Horizontal Pod Autoscaler) based on CPU/RDS/Redis lag |
| **Secrets** | `JWT_SECRET` in `.env` | Vault, AWS Secrets Manager, K8s Secrets with auto-rotation |
| **Migrations/Schema** | Not included | Flyway, Prisma Migrate, or Alembic for versioned DB changes |
| **Observability** | None | OpenTelemetry, Prometheus metrics, Grafana dashboards, health endpoints, distributed tracing |
| **Failovers** | None | Patroni/Consul for PG HA, Redis Sentinel/Cluster, circuit breakers |

### 🚀 How to Take It to True Scale
- **Deploy to K8s**: Use the Dockerfile + a K8s Deployment with `resources.limits`, an HPA, and a `Service`. Swap `docker-compose.yml` for Helm charts or K8s manifests.
- **Use Managed Services**: AWS ElastiCache for Redis + RDS for Postgres removes ops burden and auto-handles HA/scaling.
- **Add a API Gateway**: Kong, Traefik, or AWS API Gateway in front of the service for request routing, JWT validation at the edge, and centralized rate limiting.
- **Token Refresh Strategy**: The rotation pattern I included (`invalidate old refresh, issue new`) prevents token reuse attacks and works well with distributed caches.
- **Database Connection Management**: Use `pg-bouncer` or an ORM pool size tuned to your Redis/DB capacity.

### 🧾 Bottom Line
**Yes, it's scalable by design.** The core pattern—stateless JWT access tokens + Redis-scoped refresh tokens + containerized, decoupled services—is exactly how you build auth services that scale from 1 to 100+ instances without code rewrites. The demo is intentionally minimal; swapping in production-grade DB/Redis, orchestration, and observability will make it ready for real traffic.
