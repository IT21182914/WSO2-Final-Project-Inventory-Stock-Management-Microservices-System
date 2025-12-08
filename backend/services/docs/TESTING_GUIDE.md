# Unit Testing Guide

## Overview
This document provides comprehensive guidance on running and maintaining unit tests for the Inventory Stock Management Microservices System.

## Test Structure

```
backend/services/
├── inventory-service/
│   ├── jest.config.js
│   └── tests/
│       ├── setup.js
│       ├── controllers/
│       │   └── inventory.controller.test.js
│       ├── models/
│       │   └── inventory.model.test.js
│       ├── mocks/
│       │   ├── database.mock.js
│       │   ├── productService.mock.js
│       │   └── logger.mock.js
│       └── utils/
│           └── testHelpers.js
├── order-service/
│   ├── jest.config.js
│   └── tests/
│       ├── controllers/
│       │   └── order.controller.test.js
│       ├── models/
│       │   └── order.model.test.js
│       └── utils/
│           └── testHelpers.js
├── product-catalog-service/
│   ├── jest.config.js
│   └── tests/
│       ├── controllers/
│       │   └── product.controller.test.js
│       ├── models/
│       │   └── product.model.test.js
│       └── utils/
│           └── testHelpers.js
├── supplier-service/
│   ├── jest.config.js
│   └── tests/
│       ├── controllers/
│       │   └── supplier.controller.test.js
│       └── utils/
│           └── testHelpers.js
└── user-service/
    ├── jest.config.js
    └── tests/
        ├── controllers/
        │   └── user.controller.test.js
        └── utils/
            └── testHelpers.js
```

## Installation

### Install Dependencies for Each Service

```powershell
# Inventory Service
cd backend/services/inventory-service
npm install --save-dev jest supertest

# Order Service
cd ../order-service
npm install --save-dev jest supertest

# Product Catalog Service
cd ../product-catalog-service
npm install --save-dev jest supertest

# Supplier Service
cd ../supplier-service
npm install --save-dev jest supertest

# User Service
cd ../user-service
npm install --save-dev jest supertest
```

## Running Tests

### Run Tests for Individual Services

```powershell
# Inventory Service
cd backend/services/inventory-service
npm test

# Order Service
cd backend/services/order-service
npm test

# Product Catalog Service
cd backend/services/product-catalog-service
npm test

# Supplier Service
cd backend/services/supplier-service
npm test

# User Service
cd backend/services/user-service
npm test
```

### Run Tests with Coverage

```powershell
# With coverage report
npm test -- --coverage

# Watch mode for development
npm test -- --watch

# Run specific test file
npm test -- tests/controllers/inventory.controller.test.js
```

### Run All Service Tests

```powershell
# From backend/services directory
foreach ($service in "inventory-service", "order-service", "product-catalog-service", "supplier-service", "user-service") {
    Write-Host "`n=== Testing $service ===`n" -ForegroundColor Green
    cd $service
    npm test
    cd ..
}
```

## Test Coverage Requirements

Each service is configured with the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Categories

### 1. Controller Tests
Tests for HTTP request handling, validation, and response formatting.

**Example:**
```javascript
describe('createInventory', () => {
  it('should create inventory successfully', async () => {
    // Test implementation
  });
  
  it('should return 400 if inventory already exists', async () => {
    // Test implementation
  });
});
```

### 2. Model Tests
Tests for data access layer and database operations.

**Example:**
```javascript
describe('Inventory Model', () => {
  describe('create', () => {
    it('should create inventory record successfully', async () => {
      // Test implementation
    });
  });
});
```

### 3. Service Tests
Tests for business logic and inter-service communication.

### 4. Integration Tests
Tests for API endpoints (to be added).

## Test Utilities

### Mock Helpers

#### mockRequest
Creates a mock Express request object.

```javascript
const req = mockRequest({
  body: { product_id: 100 },
  params: { id: '1' },
  query: { status: 'pending' }
});
```

#### mockResponse
Creates a mock Express response object.

```javascript
const res = mockResponse();
expect(res.status).toHaveBeenCalledWith(200);
expect(res.json).toHaveBeenCalledWith({ success: true });
```

#### mockQueryResult
Creates a mock database query result.

```javascript
const result = mockQueryResult([sampleInventory]);
```

## Writing New Tests

### 1. Controller Test Template

```javascript
describe('ControllerName', () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ControllerName();
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should perform action successfully', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle errors', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2. Model Test Template

```javascript
describe('ModelName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create record successfully', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Mock external dependencies

### 2. Clear Test Names
```javascript
// Good
it('should return 404 when product not found', async () => {});

// Bad
it('test product', async () => {});
```

### 3. AAA Pattern
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code being tested
- **Assert**: Verify the results

### 4. Mock External Services
```javascript
jest.mock('../../src/services/productService.client');
ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);
```

### 5. Test Edge Cases
- Empty data
- Null values
- Invalid inputs
- Database errors
- Network failures

## Common Testing Scenarios

### Testing Success Cases
```javascript
it('should create inventory successfully', async () => {
  ProductServiceClient.getProductById.mockResolvedValue(sampleProduct);
  Inventory.create.mockResolvedValue(sampleInventory);
  
  await controller.createInventory(req, res);
  
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
    success: true
  }));
});
```

### Testing Error Cases
```javascript
it('should handle database errors', async () => {
  Inventory.findAll.mockRejectedValue(new Error('Database error'));
  
  await controller.getAllInventory(req, res);
  
  expect(res.status).toHaveBeenCalledWith(500);
});
```

### Testing Validation
```javascript
it('should return 400 for invalid input', async () => {
  req.body = {}; // Missing required fields
  
  await controller.createInventory(req, res);
  
  expect(res.status).toHaveBeenCalledWith(400);
});
```

## Debugging Tests

### Run Tests in Debug Mode
```powershell
# With Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# With verbose output
npm test -- --verbose
```

### View Test Output
```powershell
# Show console logs
npm test -- --silent=false

# Show full error stack
npm test -- --no-coverage
```

## Continuous Integration

### CI Pipeline Integration
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    cd backend/services/inventory-service
    npm install
    npm test -- --coverage
```

## Maintenance

### Updating Tests
- Update tests when requirements change
- Add tests for new features
- Remove tests for deprecated features
- Refactor tests when code structure changes

### Coverage Reports
Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/coverage-final.json` - JSON coverage data

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
```javascript
// Solution: Increase timeout in jest.config.js
testTimeout: 20000
```

**Issue**: Mock not working
```javascript
// Solution: Ensure mock is defined before import
jest.mock('../../src/models/inventory.model');
const Inventory = require('../../src/models/inventory.model');
```

**Issue**: Database connection errors
```javascript
// Solution: Ensure database is mocked
jest.mock('../../src/config/database');
```

## Next Steps

1. Add integration tests for API endpoints
2. Add E2E tests for critical user flows
3. Set up automated test runs in CI/CD
4. Add performance tests
5. Implement test fixtures for complex scenarios

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update documentation
