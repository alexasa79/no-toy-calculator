import * as vscode from 'vscode';

let lastResult: string = "";

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
	EOF = 'EOF',
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

	private getNextToken(): Token {
		while (this.currentChar !== null) {
			if (/\s/.test(this.currentChar)) {
				this.skipWhitespace();
				continue;
			}
			if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'x') {
				this.advance(); // Skip '0'
				this.advance(); // Skip 'x'
				return new Token(TokenType.HexNumber, this.hexNumber(), this.position);
			}
			if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'b') {
				this.advance(); // Skip '0'
				this.advance(); // Skip 'b'
				return new Token(TokenType.BinNumber, this.binNumber(), this.position);
			}
			if (this.currentChar === '0') {
				this.advance(); // Skip '0'
				return new Token(TokenType.OctNumber, this.octNumber(), this.position);
			}
			if (this.isDigit(this.currentChar)) {
				return new Token(TokenType.Number, this.number(), this.position);
			}
			if (this.currentChar === '+') {
				this.advance();
				return new Token(TokenType.Plus, '+', this.position);
			}
			if (this.currentChar === '-') {
				this.advance();
				return new Token(TokenType.Minus, '-', this.position);
			}
			if (this.currentChar === '*') {
				this.advance();
				return new Token(TokenType.Multiply, '*', this.position);
			}
			if (this.currentChar === '/') {
				this.advance();
				return new Token(TokenType.Divide, '/', this.position);
			}
			if (this.currentChar === '(') {
				this.advance();
				return new Token(TokenType.LParen, '(', this.position);
			}
			if (this.currentChar === ')') {
				this.advance();
				return new Token(TokenType.RParen, ')', this.position);
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

class Parser {
	private tokens: Token[];
	private currentToken: Token;
	private position: number;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.position = 0;
		this.currentToken = this.tokens[this.position];
	}

	private advance(): void {
		this.position += 1;
		this.currentToken = this.tokens[this.position] ||
			new Token(TokenType.EOF, '', this.position);
	}

	private factor(): number {
		const token = this.currentToken;
		if (token.type === TokenType.Number) {
			this.advance();
			return parseInt(token.value, 10);
		} else if (token.type === TokenType.HexNumber) {
			this.advance();
			return parseInt(token.value, 16);
		} else if (token.type === TokenType.OctNumber) {
			this.advance();
			return parseInt(token.value, 8);
		} else if (token.type === TokenType.BinNumber) {
			this.advance();
			return parseInt(token.value, 2);
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

	private term(): number {
		let result = this.factor();
		while (
			this.currentToken.type === TokenType.Multiply ||
			this.currentToken.type === TokenType.Divide
		) {
			const token = this.currentToken;
			this.advance();
			if (token.type === TokenType.Multiply) {
				result *= this.factor();
			} else if (token.type === TokenType.Divide) {
				result /= this.factor();
			}
		}
		return result;
	}

	public expr(): number {
		let result = this.term();
		while (this.currentToken.type === TokenType.Plus || this.currentToken.type === TokenType.Minus) {
			const token = this.currentToken;
			this.advance();
			if (token.type === TokenType.Plus) {
				result += this.term();
			} else if (token.type === TokenType.Minus) {
				result -= this.term();
			}
		}
		return result;
	}

	public parse(): number {
		let result = this.expr();
		if (this.position < this.tokens.length) {
			throw new Error(`Unexpected token ${this.tokens[this.position]}`);
		}
		return result;
	}
}

export function evaluateExpression(expr: string): string {
	try {
		const lexer = new Lexer(expr);
		const tokens = lexer.tokenize();
		const parser = new Parser(tokens);
		let result = parser.parse();
		console.log(tokens);
		console.log(result);
		return `${result}`;
	} catch (e) {
		vscode.window.showInformationMessage(`Error parsing expression: ${e}`);
	}
	return "";
}

function calculate() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const doc = editor.document;
	const pos = editor.selection.active;
	let currentLine = doc.lineAt(pos).text;

	if (currentLine.length === 0 || currentLine.length > 120) {
		return;
	}

	currentLine = currentLine.trim();

	// Remove trailing `=` from the end of the input string...
	let trailingEqual = false;
	if (currentLine[currentLine.length - 1] === '=') {
		currentLine = currentLine.substring(0, currentLine.length - 1);
		trailingEqual = true;
	}

	let result = evaluateExpression(currentLine);
	if (result === "") {
		return;
	}

	editor.edit(edit => {
		if (editor.selection.isEmpty) {
			if (!trailingEqual) {
				result = "=" + result;
			}
			edit.insert(pos, result);
		} else {
			edit.replace(editor.selection, result);
			var newPos = editor.selection.end;
			editor.selection = new vscode.Selection(newPos, newPos);
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('calculator.do', calculate);
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
