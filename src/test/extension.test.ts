import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { evaluateExpression } from '../extension';
// import * as my from '../../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(evaluateExpression('1+1'), '2');
        assert.strictEqual(evaluateExpression('0x10+1'), '17');
        assert.strictEqual(evaluateExpression('2+(0x2*2)'), '6');
        assert.strictEqual(evaluateExpression('2+(0b1+01)*2'), '6');
        assert.strictEqual(evaluateExpression('5%2'), '1');
        assert.throws(() => { evaluateExpression('1+1)'); });
        assert.throws(() => { evaluateExpression('(1+2'); });
        assert.throws(() => { evaluateExpression('2+(0b1+01)*2)'); });
        assert.throws(() => { evaluateExpression(' '); });
        assert.throws(() => { evaluateExpression('1+'); });
        assert.throws(() => { evaluateExpression('+1'); });
        assert.throws(() => { evaluateExpression('1/0'); });
        assert.throws(() => { evaluateExpression('1%0'); });
    });

    test('Base tokens', () => {
        assert.strictEqual(evaluateExpression('hex 10'), '0xa');
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
});
