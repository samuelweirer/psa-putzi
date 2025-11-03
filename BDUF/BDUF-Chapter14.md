## 14. TESTING-STRATEGIE

### 14.1 Test-Pyramid

```
           ╱╲
          ╱E2E╲         10% - Playwright
         ╱━━━━━╲
        ╱Integration╲    30% - Supertest
       ╱━━━━━━━━━━━╲
      ╱   Unit Tests  ╲  60% - Jest
     ╱━━━━━━━━━━━━━━━╲
```

### 14.2 Unit-Tests (Jest)

**Example: TicketsService.spec.ts**
```typescript
describe('TicketsService', () => {
  let service: TicketsService;
  let repository: MockRepository<Ticket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    repository = module.get(getRepositoryToken(Ticket));
  });

  describe('create', () => {
    it('should create a ticket with valid data', async () => {
      const createDto: CreateTicketDto = {
        title: 'Network issue',
        description: 'Cannot connect to printer',
        customer_id: 'uuid',
        priority: Priority.HIGH,
      };

      const expectedTicket = {
        id: 'uuid',
        ticket_number: 1234,
        ...createDto,
        status: TicketStatus.NEW,
      };

      repository.create.mockReturnValue(expectedTicket);
      repository.save.mockResolvedValue(expectedTicket);

      const result = await service.create(createDto, mockUser);

      expect(result).toEqual(expectedTicket);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createDto.title,
          status: TicketStatus.NEW,
        })
      );
    });

    it('should throw error for invalid customer', async () => {
      const createDto: CreateTicketDto = {
        title: 'Test',
        description: 'Test',
        customer_id: 'invalid',
        priority: Priority.LOW,
      };

      repository.save.mockRejectedValue(new Error('Customer not found'));

      await expect(service.create(createDto, mockUser)).rejects.toThrow(
        'Customer not found'
      );
    });
  });
});
```

### 14.3 Integration-Tests

**Example: tickets.e2e-spec.ts**
```typescript
describe('Tickets API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tickets', () => {
    it('should create a ticket', async () => {
      const createDto = {
        title: 'Test ticket',
        description: 'This is a test',
        customer_id: 'uuid',
        priority: 'high',
      };

      return request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(createDto.title);
          expect(res.body.status).toBe('new');
        });
    });

    it('should return 400 for invalid data', async () => {
      return request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'T' }) // Too short
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    it('should return 401 without auth', async () => {
      return request(app.getHttpServer())
        .post('/tickets')
        .send({ title: 'Test' })
        .expect(401);
    });
  });
});
```

### 14.4 E2E-Tests (Playwright)

**Example: tickets.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new ticket', async ({ page }) => {
    await page.goto('/tickets');
    await page.click('button:has-text("New Ticket")');

    await page.fill('[name="title"]', 'Network issue');
    await page.fill('[name="description"]', 'Cannot connect to printer');
    await page.selectOption('[name="priority"]', 'high');
    
    await page.click('button:has-text("Create")');

    await expect(page.locator('.toast-success')).toContainText(
      'Ticket created successfully'
    );
    
    await expect(page).toHaveURL(/\/tickets\/\d+/);
  });

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('/tickets');
    
    await page.selectOption('[name="status"]', 'open');
    await page.waitForLoadState('networkidle');

    const tickets = page.locator('.ticket-row');
    const count = await tickets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const status = await tickets.nth(i).locator('.status-badge').textContent();
      expect(status).toContain('Open');
    }
  });
});
```

---
