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
		assert.throws(() => { evaluateExpression('1+1)'); });
		assert.throws(() => { evaluateExpression('(1+2'); });
		assert.throws(() => { evaluateExpression('2+(0b1+01)*2)'); });
		assert.throws(() => { evaluateExpression(' '); });
		assert.throws(() => { evaluateExpression('1+'); });
		assert.throws(() => { evaluateExpression('+1'); });
	});
});
