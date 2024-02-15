import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { DocumentState, defaultSettings, evaluateExpression } from '../extension';
import * as decimal from 'decimal.js';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('', docSettings), '');
        assert.strictEqual(evaluateExpression(' ', docSettings), '');
        assert.strictEqual(evaluateExpression('1+1', docSettings), '2');
        assert.strictEqual(evaluateExpression('0x10+1', docSettings), '17');
        assert.strictEqual(evaluateExpression('2+(0x2*2)', docSettings), '6');
        assert.strictEqual(evaluateExpression('2+(0b1+01)*2', docSettings), '6');
        assert.strictEqual(evaluateExpression('5%2', docSettings), '1');
        assert.strictEqual(evaluateExpression('-1', docSettings), '-1');
        assert.strictEqual(evaluateExpression('-1-1', docSettings), '-2');
        assert.strictEqual(evaluateExpression('-1+1', docSettings), '0');
        assert.strictEqual(evaluateExpression('+1', docSettings), '1');
        assert.throws(() => { evaluateExpression('1+1)', docSettings); });
        assert.throws(() => { evaluateExpression('(1+2', docSettings); });
        assert.throws(() => { evaluateExpression('2+(0b1+01)*2)', docSettings); });
        assert.throws(() => { evaluateExpression('1+', docSettings); });
        assert.throws(() => { evaluateExpression('1/0', docSettings); });
        assert.throws(() => { evaluateExpression('1%0', docSettings); });
    });

    test('Bases', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('hex 10', docSettings), '0xa');
        assert.strictEqual(evaluateExpression('10 hex', docSettings), '0xa');
        assert.strictEqual(evaluateExpression('bin 10', docSettings), '0b1010');
        assert.strictEqual(evaluateExpression('oct 10', docSettings), '0o12');
    });

    test('Last result', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('hex 10', docSettings), '0xa');
        assert.strictEqual(evaluateExpression('dec $$', docSettings), '10');
    });

    test('Exponentiation', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('2**2', docSettings), '4');
        assert.strictEqual(evaluateExpression('2*2**3', docSettings), '16');
        assert.strictEqual(evaluateExpression('3+2**4-5', docSettings), '14');
        assert.strictEqual(evaluateExpression('(3+2)**2*2', docSettings), '50');
    });

    test('Floating point', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('0.1', docSettings), '0.1');
        assert.strictEqual(evaluateExpression('.1', docSettings), '0.1');
        assert.strictEqual(evaluateExpression('10*0.1', docSettings), '1');
        assert.throws(() => { evaluateExpression('.1.1)', docSettings); });
        assert.throws(() => { evaluateExpression('hex .1)', docSettings); });
        assert.throws(() => { evaluateExpression('bin 3/2)', docSettings); });
    });

    test('Large numbers and precision', () => {
        let docSettings = new DocumentState(defaultSettings);

        let n1 = '1320745023740273048132818024750347852837401938412843017340173743867.0000000000000000000000000000000000000000000000000000000000001';
        assert.strictEqual(evaluateExpression(`pre 130 ${n1}`, docSettings), n1);
        let n2 = '-2320745023740273048132818024750347852837401938412843017340173743861.0000000000000000000000000000000000000000000000000000000000002';
        assert.strictEqual(evaluateExpression(`pre 130 ${n2}`, docSettings), n2);
    });

    test('Units', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('10k', docSettings), '10000');
        assert.strictEqual(evaluateExpression('10ki', docSettings), '10240');
        assert.strictEqual(evaluateExpression('10k ki', docSettings), '10240000');
        assert.strictEqual(evaluateExpression('1mi', docSettings), '1048576');
        assert.strictEqual(evaluateExpression('1gi', docSettings), '1073741824');
        assert.strictEqual(evaluateExpression('1ti', docSettings), '1099511627776');
        assert.strictEqual(evaluateExpression('1pi', docSettings), '1125899906842624');
        assert.strictEqual(evaluateExpression('1q', docSettings), '1000000000000');
        assert.strictEqual(evaluateExpression('1g', docSettings), '1000000000');
        assert.strictEqual(evaluateExpression('1b', docSettings), '1000000000');
        assert.strictEqual(evaluateExpression('1m', docSettings), '1000000');
        assert.strictEqual(evaluateExpression('k', docSettings), '1000');

        assert.strictEqual(evaluateExpression('1k/1k', docSettings), '1');
        assert.strictEqual(evaluateExpression('k/k', docSettings), '1');
        assert.strictEqual(evaluateExpression('24+1k', docSettings), '1024');
        assert.strictEqual(evaluateExpression('(24+1)k', docSettings), '25000');
    });

    test('Comma separated', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('10,000', docSettings), '10000');
        assert.strictEqual(evaluateExpression('10*100 cs', docSettings), '1,000');
        assert.strictEqual(evaluateExpression('cs 10000*10000', docSettings), '100,000,000');
        assert.strictEqual(evaluateExpression('cs 10000*10000 hex', docSettings), '0x5f5e100');
    });

    test('Global settings', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('hex!', docSettings), '');
        assert.strictEqual(evaluateExpression('10', docSettings), '0xa');
        assert.strictEqual(evaluateExpression('reset', docSettings), '');
        assert.strictEqual(evaluateExpression('10', docSettings), '10');
    });

    test('Logical operations', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.strictEqual(evaluateExpression('1&1', docSettings), '1');
        assert.strictEqual(evaluateExpression('1&0', docSettings), '0');
        assert.strictEqual(evaluateExpression('0&1', docSettings), '0');
        assert.strictEqual(evaluateExpression('0&0', docSettings), '0');

        assert.strictEqual(evaluateExpression('2&2', docSettings), '2');
        assert.strictEqual(evaluateExpression(
            'pre 1000 1320745023740273048132817 & 1320745023740273048132817', docSettings),
            '1320745023740273048132817');
        assert.strictEqual(evaluateExpression('3&1', docSettings), '1');

        assert.strictEqual(evaluateExpression('1|1', docSettings), '1');
        assert.strictEqual(evaluateExpression('1|0', docSettings), '1');
        assert.strictEqual(evaluateExpression('0|1', docSettings), '1');
        assert.strictEqual(evaluateExpression('0|0', docSettings), '0');

        assert.strictEqual(evaluateExpression('2|2', docSettings), '2');
        assert.strictEqual(evaluateExpression(
            'pre 1000 1320745023740273048132817 | 1320745023740273048132817', docSettings),
            '1320745023740273048132817');
        assert.strictEqual(evaluateExpression('3|1', docSettings), '3');

        assert.strictEqual(evaluateExpression('1^1', docSettings), '0');
        assert.strictEqual(evaluateExpression('1^0', docSettings), '1');
        assert.strictEqual(evaluateExpression('0^1', docSettings), '1');
        assert.strictEqual(evaluateExpression('0^0', docSettings), '0');

        assert.strictEqual(evaluateExpression('3^1', docSettings), '2');

        assert.strictEqual(evaluateExpression('3&2*2', docSettings), '0');
        assert.strictEqual(evaluateExpression('2*2&3', docSettings), '0');
        assert.strictEqual(evaluateExpression('1+2*3&4|5', docSettings), '5');
    });

    test('unsigned arithmetic', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.throws(() => { evaluateExpression('u8 0.2', docSettings); });

        // Test twos complement
        for (let i = 0; i < 128; i++) {
            assert.strictEqual(evaluateExpression(`u8 ${-128 + i}`, docSettings), `${128 + i}`);
        }

        assert.strictEqual(evaluateExpression('u8 127+1', docSettings), '128');
        assert.strictEqual(evaluateExpression('u8 255+1', docSettings), '0');
        assert.strictEqual(evaluateExpression('u8 2**9', docSettings), '0');
        assert.strictEqual(evaluateExpression('u8 2**10', docSettings), '0');
        assert.strictEqual(evaluateExpression('u8 3/2', docSettings), '1');

        assert.strictEqual(evaluateExpression(
            'u128 340282366920938463463374607431768211455+1', docSettings), '0');
    });

    test('logical not', () => {
        let docSettings = new DocumentState(defaultSettings);

        assert.throws(() => { evaluateExpression('~1', docSettings); });
        assert.strictEqual(evaluateExpression('u8 ~0', docSettings), '255');
        assert.strictEqual(evaluateExpression('u16 ~0', docSettings), '65535');
        assert.strictEqual(evaluateExpression('u32 ~0', docSettings), '4294967295');
        assert.strictEqual(evaluateExpression('u64 ~0', docSettings), '18446744073709551615');
        assert.strictEqual(evaluateExpression('u128 ~0', docSettings),
            '340282366920938463463374607431768211455');
    });
});
