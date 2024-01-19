import * as vscode from 'vscode';
import * as math from './math';

const err = vscode.window.showErrorMessage;
const info = vscode.window.showInformationMessage;
const debug = console.log;

class Token {
	constructor(public type: TokenType,
		public value: string,
		public position: number) { }

	public toString(): string {
		return `${this.type} ${this.value} at offset ${this.position}`;
	}
}

enum TokenType {
	Number = 'NUMBER',
	HexNumber = 'HNUMBER',
	OctNumber = 'ONUMBER',
	BinNumber = 'BNUMBER',
	Plus = 'PLUS',
	Minus = 'MINUS',
	Multiply = 'MULTIPLY',
	Divide = 'DIVIDE',
	LParen = 'LPAREN',
	RParen = 'RPAREN',
	Variable = 'VARIABLE',
	Identifier = 'IDENTIFIER',
	EOF = 'EOF'
}

class Lexer {
	private text: string;
	private position: number;
	private currentChar: string | null;

	constructor(text: string) {
		this.text = text;
		this.position = 0;
		this.currentChar = this.text[this.position] || null;
	}

	private advance(): void {
		this.position += 1;
		this.currentChar = this.text[this.position] || null;
	}

	private skipWhitespace(): void {
		while (this.currentChar !== null && /\s/.test(this.currentChar)) {
			this.advance();
		}
	}

	private isDigit(char: string): boolean {
		return /[0-9]/.test(char);
	}

	private number(): string {
		let result = '';
		while (this.currentChar !== null && this.isDigit(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		return result;
	}

	private isHexDigit(char: string): boolean {
		return /[0-9a-fA-F]/.test(char);
	}

	private hexNumber(): string {
		let result = '';
		while (this.currentChar !== null && this.isHexDigit(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		return result;
	}

	private binNumber(): string {
		let result = '';
		while (this.currentChar !== null && /[01]/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		return result;
	}

	private octNumber(): string {
		let result = '';
		while (this.currentChar !== null && /[0-7]/.test(this.currentChar)) {
			result += this.currentChar;
			this.advance();
		}
		return result;
	}

	private consumeWord(): string {
		const startPos = this.position;
		this.advance();
		while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
			this.advance();
		}
		return this.text.substring(startPos, this.position);
	}

	private getNextToken(): Token {
		while (this.currentChar !== null) {
			if (/\s/.test(this.currentChar)) {
				this.skipWhitespace();
				continue;
			}

			const positionBefore = this.position;

			if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'x') {
				this.advance(); // Skip '0'
				this.advance(); // Skip 'x'
				return new Token(TokenType.HexNumber, this.hexNumber(), positionBefore);
			}
			if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'b') {
				this.advance(); // Skip '0'
				this.advance(); // Skip 'b'
				return new Token(TokenType.BinNumber, this.binNumber(), positionBefore);
			}
			if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'o') {
				this.advance(); // Skip '0'
				return new Token(TokenType.OctNumber, this.octNumber(), positionBefore);
			}
			if (this.isDigit(this.currentChar)) {
				return new Token(TokenType.Number, this.number(), positionBefore);
			}
			if (this.currentChar === '+') {
				this.advance();
				return new Token(TokenType.Plus, '+', positionBefore);
			}
			if (this.currentChar === '-') {
				this.advance();
				return new Token(TokenType.Minus, '-', positionBefore);
			}
			if (this.currentChar === '*') {
				this.advance();
				return new Token(TokenType.Multiply, '*', positionBefore);
			}
			if (this.currentChar === '/') {
				this.advance();
				return new Token(TokenType.Divide, '/', positionBefore);
			}
			if (this.currentChar === '(') {
				this.advance();
				return new Token(TokenType.LParen, '(', positionBefore);
			}
			if (this.currentChar === ')') {
				this.advance();
				return new Token(TokenType.RParen, ')', positionBefore);
			}
			if (this.currentChar === '$' && this.text[this.position + 1] === '$') {
				this.advance();
				this.advance();
				return new Token(TokenType.Variable, '$$', positionBefore);
			}
			if (/[a-zA-Z]/.test(this.currentChar)) {
				const word = this.consumeWord();
				return new Token(TokenType.Identifier, word, positionBefore);
			}
			throw new Error(`Invalid character: ${this.currentChar}`);
		}
		return new Token(TokenType.EOF, '', this.position);
	}

	public tokenize(): Token[] {
		const tokens: Token[] = [];
		let token = this.getNextToken();
		while (token.type !== TokenType.EOF) {
			tokens.push(token);
			token = this.getNextToken();
		}
		return tokens;
	}
}

let lastResult: math.Result = new math.Result(0);

class Parser {
	private tokens: Token[];
	private currentToken: Token;
	private position: number;
	private arithmetic: math.Arithmetic;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.position = 0;
		this.currentToken = this.tokens[this.position];
		this.arithmetic = new math.JsArithmetic();
	}

	private advance(): void {
		this.position += 1;
		this.currentToken = this.tokens[this.position] ||
			new Token(TokenType.EOF, '', this.position);
	}

	private factor(): math.Result {
		const token = this.currentToken;
		if (token.type === TokenType.Number) {
			this.advance();
			return new math.Result(parseInt(token.value, 10));
		} else if (token.type === TokenType.HexNumber) {
			this.advance();
			return new math.Result(parseInt(token.value, 16));
		} else if (token.type === TokenType.OctNumber) {
			this.advance();
			return new math.Result(parseInt(token.value, 8));
		} else if (token.type === TokenType.BinNumber) {
			this.advance();
			return new math.Result(parseInt(token.value, 2));
		} else if (token.type === TokenType.Identifier) {
			this.advance();
			let res = this.expr();
			res.base = token.value as math.OutputBase;
			return res;
		} else if (token.type === TokenType.Variable) {
			this.advance();
			return lastResult;
		} else if (token.type === TokenType.LParen) {
			this.advance();
			const result = this.expr();
			if (this.currentToken.type !== TokenType.RParen) {
				throw new Error(`Mismatched parentheses at ${this.tokens[this.position]}`);
			}
			this.advance();
			return result;
		} else {
			throw new Error(`Unexpected token ${this.tokens[this.position]}`);
		}
	}

	private term(): math.Result {
		let result = this.factor();
		while (
			this.currentToken.type === TokenType.Multiply ||
			this.currentToken.type === TokenType.Divide
		) {
			const token = this.currentToken;
			this.advance();
			let right = this.factor();

			if (token.type === TokenType.Multiply) {
				result = this.arithmetic.mul(result, right);
			} else if (token.type === TokenType.Divide) {
				result = this.arithmetic.div(result, right);
			}
		}
		return result;
	}

	public expr(): math.Result {
		let result = this.term();
		while (this.currentToken.type === TokenType.Plus || this.currentToken.type === TokenType.Minus) {
			const token = this.currentToken;
			this.advance();
			let right = this.term();

			if (token.type === TokenType.Plus) {
				result = this.arithmetic.add(result, right);
			} else if (token.type === TokenType.Minus) {
				result = this.arithmetic.sub(result, right);
			}
		}
		return result;
	}

	public parse(): math.Result {
		let result = this.expr();
		if (this.position < this.tokens.length) {
			throw new Error(`Unexpected token ${this.tokens[this.position]}`);
		}
		return result;
	}
}

export function evaluateExpression(expr: string): string {
	const lexer = new Lexer(expr);
	const tokens = lexer.tokenize();
	const parser = new Parser(tokens);
	let result = parser.parse();
	debug(`${expr} -> ${result}`);

	lastResult = result;

	if (result.base === 'dec') {
		return `${result.val}`;
	} else if (result.base === 'hex') {
		return `0x${result.val.toString(16)}`;
	} else if (result.base === 'oct') {
		return `0o${result.val.toString(8)}`;
	} else if (result.base === 'bin') {
		return `0b${result.val.toString(2)}`;
	}
	return "";
}

export function evaluateExpressionSafe(expr: string): string {
	try {
		return evaluateExpression(expr);
	} catch (e) {
		err(`Error parsing expression: ${e}`);
	}
	return "";
}

function trimLine(s: string): string {
	let start = 0;
	let re = new RegExp('(?:#+|//+|/[*]+|=)', 'g');
	let m = re.exec(s);
	while (m !== null) {
		start = m.index + m[0].length;
		m = re.exec(s);
	}
	return s.substring(start).trim();
}

function evaluate() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const multipleCursors = editor.selections.length > 1;

	debug(`# selections ${editor.selections.length}`);

	let results = new Array<string>;

	for (let i = 0; i < editor.selections.length; i++) {
		const doc = editor.document;
		const selection = editor.selections[i];
		const pos = selection.active;
		let currentLine = doc.lineAt(pos).text.substring(0, pos.character);

		debug(`Current position: ${pos.line}, ${pos.character}`);
		debug(`Evaluating line: ${currentLine}`);

		if (currentLine.length === 0 || currentLine.length > 120) {
			err(`Expression's length ${currentLine.length} does not make sense`);
			return;
		}

		currentLine = trimLine(currentLine);
		debug(`After trimming: ${currentLine}`);

		// Remove trailing `=` from the end of the input string...
		let trailingEqual = false;
		if (currentLine[currentLine.length - 1] === '=') {
			currentLine = currentLine.substring(0, currentLine.length - 1);
			trailingEqual = true;
		}

		let result = evaluateExpressionSafe(currentLine);

		if (result === "") {
			debug("evaluateExpressionSafe returned empty result");
			results.push("");
			continue;
		}

		if (!trailingEqual && multipleCursors) {
			result = "=" + result;
		} else if (!multipleCursors) {
			result = "\n" + result;
		}

		results.push(result);
	}

	editor.edit(edit => {
		for (let i = 0; i < editor.selections.length; i++) {
			const selection = editor.selections[i];
			const pos = selection.active;
			edit.replace(pos, results[i]);
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('toy-calculator.eval', evaluate);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
