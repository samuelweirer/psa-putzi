## 5. SECURITY-ARCHITEKTUR (DETAILLIERT)

### 5.1 Multi-Layer-Security

```
┌────────────────────────────────────────┐
│  Layer 1: Network Security             │
│  - Firewall (pfsense)                  │
│  - IDS/IPS (Suricata)                  │
│  - VLAN Segmentation                   │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 2: Application Security         │
│  - Input Validation                    │
│  - CSRF Protection                     │
│  - XSS Prevention                      │
│  - SQL Injection Prevention            │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 3: Authentication               │
│  - JWT Tokens                          │
│  - MFA (TOTP, FIDO2)                   │
│  - SSO (SAML, OIDC)                    │
│  - Password Policy                     │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 4: Authorization                │
│  - RBAC                                │
│  - Granular Permissions                │
│  - Resource-Level Access Control       │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 5: Data Security                │
│  - TLS 1.3 (Transit)                   │
│  - AES-256 (At Rest)                   │
│  - Field-Level Encryption              │
│  - Secure Key Management               │
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Layer 6: Monitoring & Audit           │
│  - Security Event Logging              │
│  - SIEM Integration                    │
│  - Intrusion Detection                 │
│  - Anomaly Detection                   │
└────────────────────────────────────────┘
```

### 5.2 Authentication-Implementierung

**Password-Hashing (bcrypt):**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**JWT-Generation:**
```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('keys/jwt-private.pem');
const publicKey = fs.readFileSync('keys/jwt-public.pem');

function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    jti: uuidv4(),
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    issuer: 'psa-platform',
    audience: 'psa-api',
  });
}

function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'psa-platform',
    audience: 'psa-api',
  }) as JWTPayload;
}
```

**MFA-Implementierung (TOTP):**
```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

async function generateMFASecret(user: User) {
  const secret = speakeasy.generateSecret({
    name: `PSA Platform (${user.email})`,
    issuer: 'PSA Platform',
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
  };
}

function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
}
```

### 5.3 Authorization-Implementierung (RBAC)

**Permission-Checker:**
```typescript
enum Permission {
  // Tickets
  TICKET_VIEW_ALL = 'ticket:view:all',
  TICKET_VIEW_OWN = 'ticket:view:own',
  TICKET_CREATE = 'ticket:create',
  TICKET_UPDATE = 'ticket:update',
  TICKET_DELETE = 'ticket:delete',
  
  // Customers
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  
  // Billing
  BILLING_VIEW = 'billing:view',
  BILLING_CREATE = 'billing:create',
  BILLING_APPROVE = 'billing:approve',
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  system_admin: [
    // All permissions
    ...Object.values(Permission),
  ],
  service_manager: [
    Permission.TICKET_VIEW_ALL,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.CUSTOMER_VIEW,
  ],
  technician_l2: [
    Permission.TICKET_VIEW_OWN,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
  ],
  customer_admin: [
    Permission.TICKET_VIEW_OWN,
    Permission.TICKET_CREATE,
  ],
};

function hasPermission(
  user: User,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}
```

**Permission-Guard (NestJS):**
```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.some((permission) =>
      hasPermission(user, permission)
    );
  }
}

// Usage
@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  @Get()
  @RequirePermissions(Permission.TICKET_VIEW_ALL)
  async findAll() {
    // ...
  }

  @Post()
  @RequirePermissions(Permission.TICKET_CREATE)
  async create() {
    // ...
  }
}
```

### 5.4 Input-Validation

**DTO-Validation (class-validator):**
```typescript
import { IsString, IsEmail, IsEnum, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsUUID()
  customer_id: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  category?: string;
}
```

**SQL-Injection-Prevention (ORM):**
```typescript
// ✅ SAFE - Using ORM
const tickets = await this.ticketsRepo.find({
  where: {
    customer_id: customerId,
    status: status,
  },
});

// ✅ SAFE - Parameterized query
const tickets = await this.ticketsRepo.query(
  'SELECT * FROM tickets WHERE customer_id = $1 AND status = $2',
  [customerId, status]
);

// ❌ UNSAFE - String concatenation
const tickets = await this.ticketsRepo.query(
  `SELECT * FROM tickets WHERE customer_id = '${customerId}'`
);
```

**XSS-Prevention:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// Usage
const sanitizedDescription = sanitizeHtml(ticket.description);
```

**CSRF-Protection:**
```typescript
import csurf from 'csurf';

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
});

app.use(csrfProtection);

// Send token to frontend
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 5.5 Data-Encryption

**Encryption-at-Rest (Field-Level):**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage in Entity
@Entity()
export class License {
  @Column({
    type: 'text',
    transformer: {
      to: (value: string) => encrypt(value),
      from: (value: string) => decrypt(value),
    },
  })
  license_key: string;
}
```

**TLS-Configuration (Nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name api.psa-platform.example.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/psa-platform.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/psa-platform.example.com/privkey.pem;

    # TLS Configuration
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    location / {
        proxy_pass http://api-gateway:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.6 Security-Monitoring

**Audit-Logging:**
```typescript
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    userId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const auditLog = this.auditRepo.create({
      ...params,
      request_id: getCurrentRequestId(),
      created_at: new Date(),
    });

    await this.auditRepo.save(auditLog);
  }
}

// Usage in Service
async update(id: string, dto: UpdateTicketDto, user: User) {
  const ticket = await this.findOne(id);
  const oldValues = { ...ticket };

  Object.assign(ticket, dto);
  const updated = await this.ticketsRepo.save(ticket);

  // Log audit
  await this.auditLogService.log({
    entityType: 'ticket',
    entityId: id,
    action: 'UPDATE',
    userId: user.id,
    changes: {
      old: oldValues,
      new: updated,
    },
  });

  return updated;
}
```

**Failed-Login-Tracking:**
```typescript
@Injectable()
export class LoginAttemptService {
  constructor(private redis: Redis) {}

  async recordFailedAttempt(email: string, ip: string) {
    const key = `login:failed:${email}`;
    const attempts = await this.redis.incr(key);
    await this.redis.expire(key, 900); // 15 minutes

    if (attempts >= 5) {
      // Lock account
      await this.lockAccount(email, 900); // 15 minutes
      await this.notifySecurityTeam(email, ip);
    }

    return attempts;
  }

  async resetFailedAttempts(email: string) {
    await this.redis.del(`login:failed:${email}`);
  }

  async isAccountLocked(email: string): Promise<boolean> {
    return await this.redis.exists(`account:locked:${email}`) === 1;
  }
}
```

---
