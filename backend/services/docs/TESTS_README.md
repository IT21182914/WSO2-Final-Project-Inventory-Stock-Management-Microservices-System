# Unit Tests README

## Quick Start

### 1. Install Test Dependencies
```powershell
# From project root or backend/services directory
.\install-test-deps.ps1
```

### 2. Run All Tests
```powershell
# With coverage reports
.\run-all-tests.ps1

# Quick run without coverage
.\quick-test.ps1
```

### 3. Run Individual Service Tests
```powershell
cd backend/services/inventory-service
npm test
```

## Test Structure

Each microservice has its own test suite:

```
service-name/
├── jest.config.js          # Jest configuration
├── tests/
│   ├── controllers/        # HTTP layer tests
│   ├── models/             # Data access tests
│   ├── services/           # Business logic tests
│   ├── mocks/              # Mock implementations
│   └── utils/              # Test helpers
```

## Available Scripts

### Global Scripts (from backend/services/)
- `.\install-test-deps.ps1` - Install test dependencies
- `.\run-all-tests.ps1` - Run all service tests with coverage
- `.\quick-test.ps1` - Run all tests without coverage (faster)

### Per-Service Scripts
```powershell
npm test                    # Run tests with coverage
npm test -- --watch        # Watch mode
npm test -- --verbose      # Detailed output
npm test -- path/to/test   # Run specific test
```

## Test Coverage

Each service targets 70% coverage for:
- Branches
- Functions
- Lines
- Statements

View coverage reports:
- HTML: `coverage/lcov-report/index.html`
- JSON: `coverage/coverage-final.json`

## Writing Tests

See `TESTING_GUIDE.md` for detailed information on:
- Writing new tests
- Best practices
- Common patterns
- Debugging tests

## Services Tested

✅ **Inventory Service** - Stock management, movements, alerts  
✅ **Order Service** - Order processing, status management  
✅ **Product Catalog Service** - Product CRUD, lifecycle  
✅ **Supplier Service** - Supplier management, ratings  
✅ **User Service** - User authentication, authorization  

## Test Execution Time

Approximate times:
- Single service: 5-10 seconds
- All services: 30-60 seconds
- With coverage: +10-20 seconds

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Install Dependencies
  run: |
    cd backend/services
    ./install-test-deps.ps1

- name: Run Tests
  run: |
    cd backend/services
    ./run-all-tests.ps1
```

## Troubleshooting

**Tests fail to run**:
- Ensure Node.js 18+ is installed
- Run `npm install` in the service directory
- Check `jest.config.js` is present

**Import errors**:
- Verify mocks are defined before imports
- Check file paths in require statements

**Timeout errors**:
- Increase timeout in jest.config.js
- Check for hanging promises

## Documentation

- **TESTING_GUIDE.md** - Comprehensive testing guide
- **TESTING_SUMMARY.md** - Implementation summary
- Service-specific test documentation in each `tests/` directory

## Support

For issues or questions:
1. Check TESTING_GUIDE.md
2. Review test examples in existing test files
3. Check Jest documentation: https://jestjs.io/

---

**Happy Testing! 🧪**
