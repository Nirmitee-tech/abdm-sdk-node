"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../src/utils/logger");
// Test logging at different levels
function testLogLevels() {
    logger_1.logger.trace('This is a TRACE level message');
    logger_1.logger.debug('This is a DEBUG level message', { debug: 'some debug data' });
    logger_1.logger.info('This is an INFO level message', { info: 'some info' });
    logger_1.logger.warn('This is a WARN level message', { warning: 'be careful' });
    // Test error logging
    try {
        throw new Error('Test error');
    }
    catch (error) {
        logger_1.logger.error('This is an ERROR level message', error);
    }
    logger_1.logger.fatal('This is a FATAL level message', { error: 'critical failure' });
}
// Test logging with different data types
function testDataTypes() {
    logger_1.logger.info('Testing different data types', {
        string: 'hello',
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        array: [1, 'two', { three: 3 }],
        object: { key: 'value', nested: { a: 1 } },
        date: new Date(),
        error: new Error('Test error'),
    });
}
// Test redaction of sensitive data
function testRedaction() {
    const sensitiveData = {
        password: 'secret',
        token: 'abc123xyz',
        user: {
            ssn: '123-45-6789',
            creditCard: '4111111111111111',
        },
        array: [
            { secret: 'value1' },
            { secret: 'value2' },
        ],
    };
    logger_1.logger.info('Testing redaction of sensitive data', sensitiveData);
}
// Test logging performance
function testPerformance(count = 1000) {
    const start = Date.now();
    for (let i = 0; i < count; i++) {
        logger_1.logger.info(`Log message ${i}`, { index: i, timestamp: Date.now() });
    }
    const duration = Date.now() - start;
    logger_1.logger.info('Performance test completed', {
        messageCount: count,
        durationMs: duration,
        messagesPerSecond: Math.round((count / duration) * 1000),
    });
}
// Run all tests
async function runTests() {
    console.log('=== Starting logging tests ===');
    console.log('\n--- Testing log levels ---');
    testLogLevels();
    console.log('\n--- Testing data types ---');
    testDataTypes();
    console.log('\n--- Testing sensitive data redaction ---');
    testRedaction();
    // Uncomment to test performance (creates many log entries)
    // console.log('\n--- Testing performance ---');
    // testPerformance(1000);
    console.log('\n=== Logging tests completed ===');
    // Give logs time to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
}
runTests().catch(console.error);
//# sourceMappingURL=test-logging.js.map