import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { evaluateExpression } from '../extension';
import * as decimal from 'decimal.js';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(evaluateExpression('1+1'), '2');
        assert.strictEqual(evaluateExpression('0x10+1'), '17');
        assert.strictEqual(evaluateExpression('2+(0x2*2)'), '6');
        assert.strictEqual(evaluateExpression('2+(0b1+01)*2'), '6');
        assert.strictEqual(evaluateExpression('5%2'), '1');
        assert.strictEqual(evaluateExpression('-1'), '-1');
        assert.strictEqual(evaluateExpression('-1-1'), '-2');
        assert.strictEqual(evaluateExpression('-1+1'), '0');
        assert.strictEqual(evaluateExpression('+1'), '1');
        assert.throws(() => { evaluateExpression('1+1)'); });
        assert.throws(() => { evaluateExpression('(1+2'); });
        assert.throws(() => { evaluateExpression('2+(0b1+01)*2)'); });
        assert.throws(() => { evaluateExpression(' '); });
        assert.throws(() => { evaluateExpression('1+'); });
        assert.throws(() => { evaluateExpression('1/0'); });
        assert.throws(() => { evaluateExpression('1%0'); });
    });

    test('Bases', () => {
        assert.strictEqual(evaluateExpression('hex 10'), '0xa');
        assert.strictEqual(evaluateExpression('10 hex'), '0xa');
        assert.strictEqual(evaluateExpression('bin 10'), '0b1010');
        assert.strictEqual(evaluateExpression('oct 10'), '0o12');
    });

    test('Last result', () => {
        assert.strictEqual(evaluateExpression('hex 10'), '0xa');
        assert.strictEqual(evaluateExpression('dec $$'), '10');
    });

    test('Exponentiation', () => {
        assert.strictEqual(evaluateExpression('2**2'), '4');
        assert.strictEqual(evaluateExpression('2*2**3'), '16');
        assert.strictEqual(evaluateExpression('3+2**4-5'), '14');
        assert.strictEqual(evaluateExpression('(3+2)**2*2'), '50');
    });

    test('Floating point', () => {
        assert.strictEqual(evaluateExpression('0.1'), '0.1');
        assert.strictEqual(evaluateExpression('.1'), '0.1');
        assert.strictEqual(evaluateExpression('10*0.1'), '1');
        assert.throws(() => { evaluateExpression('.1.1)'); });
        assert.throws(() => { evaluateExpression('hex .1)'); });
        assert.throws(() => { evaluateExpression('bin 3/2)'); });
    });

    test('Large numbers and precision', () => {
        let n1 = '1320745023740273048132818024750347852837401938412843017340173743867.0000000000000000000000000000000000000000000000000000000000001';
        assert.strictEqual(evaluateExpression(`pre 130 ${n1}`), n1);
        let n2 = '-2320745023740273048132818024750347852837401938412843017340173743861.0000000000000000000000000000000000000000000000000000000000002';
        assert.strictEqual(evaluateExpression(`pre 130 ${n2}`), n2);
    });

    test('Units', () => {
        assert.strictEqual(evaluateExpression('10k'), '10000');
        assert.strictEqual(evaluateExpression('10ki'), '10240');
        assert.strictEqual(evaluateExpression('10k ki'), '10240000');
    });

    test('Comma separated', () => {
        assert.strictEqual(evaluateExpression('10,000'), '10000');
    });
});
