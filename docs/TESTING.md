# Testing Documentation

## Overview

This document outlines the comprehensive testing strategy for the Demo Event Registration & Ticketing System. Our testing approach ensures reliability, performance, and accessibility across all user interactions.

## Testing Strategy

### Multi-Layer Testing Approach

1. **Unit Tests** - Test individual components and functions in isolation
2. **Integration Tests** - Test interactions between components and services
3. **End-to-End Tests** - Test complete user workflows in real browsers
4. **Accessibility Tests** - Ensure WCAG 2.1 AA compliance
5. **Performance Tests** - Validate load times and resource usage
6. **Security Tests** - Check for vulnerabilities and security issues

## Test Structure

```
src/
├── __tests__/
│   └── integration/           # Integration tests
├── components/
│   └── __tests__/            # Component unit tests
├── lib/
│   ├── hooks/
│   │   └── __tests__/        # Hook tests
│   ├── services/
│   │   └── __tests__/        # Service layer tests
│   └── validations/
│       └── __tests__/        # Validation tests
e2e/                          # End-to-end tests
├── pages/                    # Page Object Models
├── fixtures/                 # Test data and files
├── accessibility.spec.ts     # Accessibility tests
├── performance.spec.ts       # Performance tests
└── registration-flow.spec.ts # Main E2E tests
```

## Running Tests

### Local Development

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests
npm run test:all
```

### CI/CD Pipeline

```bash
# Run complete CI test suite
npm run test:ci
```

## Test Coverage

### Coverage Thresholds

- **Global**: 80% minimum coverage
- **Validations**: 90% minimum coverage
- **Services**: 85% minimum coverage
- **Components**: 75% minimum coverage

### Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`

## Unit Tests

### Technologies Used

- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation

### Test Categories

#### Validation Tests
- Schema validation for all form types
- Custom field validation rules
- Edge case and boundary testing
- Malformed data handling

#### Service Layer Tests
- Firebase integration mocking
- CRUD operations testing
- Error handling validation
- File upload functionality

#### Component Tests
- Rendering verification
- User interaction testing
- Form submission flows
- Accessibility compliance

#### Hook Tests
- React Query integration
- State management
- Error handling
- Loading states

### Example Test Structure

```typescript
describe('RegistrationForm', () => {
  beforeEach(() => {
    // Setup test environment
  });

  it('should render form fields correctly', () => {
    // Test implementation
  });

  it('should validate required fields', () => {
    // Test implementation
  });

  it('should handle form submission', () => {
    // Test implementation
  });
});
```

## Integration Tests

### Technologies Used

- **MSW (Mock Service Worker)** - API mocking
- **Jest** - Test runner
- **Supertest** - HTTP assertion library

### Test Scenarios

- Form data flow from UI to backend
- File upload processing
- Group registration workflows
- Ticket allocation and availability
- Error handling across system boundaries

## End-to-End Tests

### Technologies Used

- **Playwright** - Browser automation
- **Page Object Model** - Maintainable test structure

### Browser Support

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome (Pixel 5), Safari (iPhone 12)

### Test Scenarios

#### Registration Flow Tests
- Single participant registration
- Group registration with multiple participants
- Form validation and error handling
- File upload functionality
- Multi-step navigation

#### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management
- ARIA attributes

#### Performance Tests
- Page load times
- Core Web Vitals
- Memory usage
- Network resilience
- Concurrent user handling

### Page Object Model

```typescript
export class RegistrationPage {
  constructor(private page: Page) {}

  async fillParticipantInfo(data: ParticipantData) {
    // Implementation
  }

  async proceedToTicketSelection() {
    // Implementation
  }

  async reviewAndSubmit() {
    // Implementation
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

Our CI/CD pipeline includes:

1. **Unit Tests** - Fast feedback on code changes
2. **Integration Tests** - Database and API integration
3. **E2E Tests** - Cross-browser testing
4. **Accessibility Tests** - WCAG compliance
5. **Performance Tests** - Load time validation
6. **Security Scan** - Vulnerability detection
7. **Code Quality** - Linting and formatting
8. **Build Verification** - Production build testing

### Quality Gates

- All tests must pass
- Coverage thresholds must be met
- No security vulnerabilities
- No linting errors
- Successful production build

### Artifacts

- Test results (JUnit XML)
- Coverage reports (LCOV)
- Screenshots and videos (on failure)
- Performance metrics
- Build artifacts

## Test Data Management

### Fixtures

Test data is organized in the `e2e/fixtures/` directory:
- Sample documents for upload testing
- Mock event configurations
- User data templates

### Mocking Strategy

- **Firebase**: Comprehensive mocking for all services
- **External APIs**: MSW for HTTP request interception
- **File System**: In-memory file handling for tests

## Debugging Tests

### Unit Tests

```bash
# Debug specific test
npm run test -- --testNamePattern="specific test name"

# Run tests with verbose output
npm run test -- --verbose

# Update snapshots
npm run test -- --updateSnapshot
```

### E2E Tests

```bash
# Run tests in headed mode
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View test reports
npm run test:e2e:report
```

## Performance Monitoring

### Metrics Tracked

- **Page Load Time**: < 3 seconds target
- **First Contentful Paint**: < 1.8 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **Memory Usage**: Monitor for leaks

### Performance Tests

Performance tests run automatically in CI and include:
- Load time measurements
- Core Web Vitals tracking
- Memory leak detection
- Network resilience testing

## Accessibility Testing

### WCAG 2.1 AA Compliance

Our accessibility tests verify:
- Proper heading hierarchy
- Form label associations
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management

### Tools Used

- **Playwright**: Automated accessibility testing
- **axe-core**: Accessibility rule engine
- **Manual Testing**: Screen reader verification

## Security Testing

### Automated Security Scans

- **npm audit**: Dependency vulnerability scanning
- **audit-ci**: CI-integrated security checks
- **Input validation**: XSS and injection prevention

### Security Test Categories

- Authentication and authorization
- Input sanitization
- File upload security
- Data encryption
- Session management

## Continuous Improvement

### Test Metrics

We track and monitor:
- Test execution time
- Flaky test detection
- Coverage trends
- Performance regressions
- Accessibility compliance

### Best Practices

1. **Write tests first** (TDD approach)
2. **Keep tests focused** and isolated
3. **Use descriptive test names**
4. **Mock external dependencies**
5. **Maintain test data** separately
6. **Regular test maintenance**

## Troubleshooting

### Common Issues

#### Firebase Initialization Errors
```bash
# Ensure proper mocking in jest.setup.js
# Check Firebase configuration in test environment
```

#### Playwright Browser Issues
```bash
# Install browsers
npx playwright install

# Update browsers
npx playwright install --force
```

#### Coverage Threshold Failures
```bash
# Check coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

### Getting Help

- Check test logs in CI/CD pipeline
- Review coverage reports for gaps
- Use test dashboard for overview
- Consult team for complex issues

## Test Dashboard

Access the test dashboard at `scripts/test-dashboard.html` for:
- Real-time test status
- Coverage metrics
- Performance indicators
- Quick links to reports

The dashboard provides a centralized view of all testing metrics and is updated automatically during CI/CD runs. 