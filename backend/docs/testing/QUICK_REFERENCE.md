# Testing Quick Reference Card

## 🚀 Quick Commands

### Unit Tests
```bash
npm test                    # Run unit tests
npm run test:coverage       # Run with coverage report
npm test -- --watch        # Watch mode for development
```

### Integration Tests
```bash
npm run test:integration    # Run integration tests
npm run test:all           # Run all tests (unit + integration)
```

### Debugging
```bash
npx jest --runInBand tests/path/to/test.js --verbose
npx jest --clearCache
```

---

## 📁 File Locations

### Unit Tests
- `tests/controllers/*.test.js` - Controller tests
- `tests/models/*.test.js` - Model tests
- `tests/utils/testHelpers.js` - Test utilities
- `tests/mocks/` - Mock implementations

### Integration Tests
- `tests/integration/*.test.js` - API tests
- `tests/integration/helpers.js` - Test helpers
- `tests/integration/setup.js` - Test environment setup

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `jest.config.js` | Unit test configuration |
| `jest.integration.config.js` | Integration test configuration |
| `tests/setup.js` | Unit test setup |
| `tests/integration/setup.js` | Integration test setup |

---

## 📊 Test Coverage

### Inventory Service (Completed)
- ✅ Unit Tests: 36/36 passing
- ✅ Integration Tests: 30+ scenarios ready
- ✅ Documentation: Complete

### Other Services (Pending)
- 🔄 order-service
- 🔄 product-catalog-service
- 🔄 supplier-service
- 🔄 user-service

---

## 🎯 Test Patterns

### Unit Test Pattern
```javascript
describe('Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const mock = jest.fn();
    
    // Act
    const result = function(mock);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Test Pattern
```javascript
describe('API Endpoint', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('should handle request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send(data)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Babel/Istanbul error | Use v8 coverage provider |
| Controller not constructor | Use exported instance |
| Wrong parameter in tests | Check model signatures |
| Database connection fails | Verify test database exists |
| Tests timeout | Increase timeout or check DB |

---

## 📚 Documentation

1. **TESTING_IMPLEMENTATION_SUMMARY.md** - Overview
2. **INTEGRATION_TESTING_GUIDE.md** - Templates
3. **tests/README.md** - Quick start
4. **tests/integration/README.md** - Integration guide

---

## ✅ Checklist for New Tests

- [ ] Test file created in correct directory
- [ ] Mocks configured properly
- [ ] Both success and failure cases tested
- [ ] Cleanup after tests
- [ ] Descriptive test names
- [ ] Documentation updated

---

**Version**: 1.0  
**Last Updated**: January 2025
