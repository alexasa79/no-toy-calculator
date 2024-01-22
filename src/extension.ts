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
    Modulo = 'MODULO',
    Exponentiation = 'EXP',
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
        let dot = false;
        while (
            (this.currentChar !== null) &&
            (
                this.isDigit(this.currentChar) ||
                this.currentChar === '.' ||
                this.currentChar === ','
            )
        ) {
            if (this.currentChar === '.') {
                if (dot) {
                    throw new Error(`Unexpected token ${this.currentChar}`);
                }
                dot = true;
            }
            if (this.currentChar !== ',') {
                result += this.currentChar;
            }
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
                this.advance();
                this.advance();
                return new Token(TokenType.HexNumber, this.hexNumber(), positionBefore);
            }
            if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'b') {
                this.advance();
                this.advance();
                return new Token(TokenType.BinNumber, this.binNumber(), positionBefore);
            }
            if (this.currentChar === '0' && this.text[this.position + 1]?.toLowerCase() === 'o') {
                this.advance();
                return new Token(TokenType.OctNumber, this.octNumber(), positionBefore);
            }
            if (this.currentChar === '.') {
                return new Token(TokenType.Number, this.number(), positionBefore);
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
            if (this.currentChar === '*' && this.text[this.position + 1]?.toLowerCase() === '*') {
                this.advance();
                this.advance();
                return new Token(TokenType.Exponentiation, '**', positionBefore);
            }
            if (this.currentChar === '*') {
                this.advance();
                return new Token(TokenType.Multiply, '*', positionBefore);
            }
            if (this.currentChar === '/') {
                this.advance();
                return new Token(TokenType.Divide, '/', positionBefore);
            }
            if (this.currentChar === '%') {
                this.advance();
                return new Token(TokenType.Modulo, '%', positionBefore);
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
    private position: number;
    private arithmetic: math.Arithmetic;
    public base: number;

    constructor(tokens: Token[], arithmetic: math.Arithmetic) {
        this.tokens = tokens;
        this.position = 0;
        this.arithmetic = arithmetic;
        this.base = 10;
    }

    private advance(): void {
        this.position += 1;
    }

    private currentToken(): Token {
        return this.tokens[this.position] || new Token(TokenType.EOF, '', this.position);
    }

    private factor(): math.Result {
        const token = this.currentToken();
        if (token.type === TokenType.Minus) {
            this.advance();
            let t = this.factor();
            return this.arithmetic.mul(t, this.arithmetic.parseNumber('-1', 10));
        } else if (token.type === TokenType.Plus) {
            this.advance();
            return this.factor();
        } else if (token.type === TokenType.Number) {
            this.advance();
            return this.arithmetic.parseNumber(token.value, 10);
        } else if (token.type === TokenType.HexNumber) {
            this.advance();
            return this.arithmetic.parseNumber(token.value, 16);
        } else if (token.type === TokenType.OctNumber) {
            this.advance();
            return this.arithmetic.parseNumber(token.value, 8);
        } else if (token.type === TokenType.BinNumber) {
            this.advance();
            return this.arithmetic.parseNumber(token.value, 2);
        } else if (token.type === TokenType.Variable) {
            this.advance();
            return lastResult;
        } else if (token.type === TokenType.LParen) {
            this.advance();
            const result = this.expr();
            if (this.currentToken().type !== TokenType.RParen) {
                throw new Error(`Mismatched parentheses at ${this.tokens[this.position]}`);
            }
            this.advance();
            return result;
        } else {
            throw new Error(`Unexpected token ${this.tokens[this.position]}`);
        }
    }

    private exponent(): math.Result {
        let left = this.factor();
        while (this.currentToken().type === TokenType.Exponentiation) {
            const token = this.currentToken();
            this.advance();
            let right = this.factor();
            left = this.arithmetic.exp(left, right);
        }
        return left;
    }

    private term(): math.Result {
        let left = this.exponent();
        while (
            this.currentToken().type === TokenType.Multiply ||
            this.currentToken().type === TokenType.Divide ||
            this.currentToken().type === TokenType.Modulo ||
            this.currentToken().type === TokenType.Identifier
        ) {
            const token = this.currentToken();
            this.advance();

            if (token.type === TokenType.Multiply) {
                let right = this.exponent();
                left = this.arithmetic.mul(left, right);
            } else if (token.type === TokenType.Divide) {
                let right = this.exponent();
                left = this.arithmetic.div(left, right);
            } else if (token.type === TokenType.Modulo) {
                let right = this.exponent();
                left = this.arithmetic.mod(left, right);
            } else if (token.type === TokenType.Identifier) {
                const unitConversions = new Map<string, string>([
                    ['pi', '1125899906842624'],
                    ['ti', '109521666048'],
                    ['gi', '1073741824'],
                    ['mi', '1048576'],
                    ['ki', '1024'],
                    ['t', '1000000000000'],
                    ['g', '1000000000'],
                    ['m', '1000000'],
                    ['k', '1000'],
                ]);

                if (unitConversions.has(token.value)) {
                    let multiplier = unitConversions.get(token.value)!;
                    left = this.arithmetic.mul(left, this.arithmetic.parseNumber(multiplier, 10));
                }
            }
        }
        return left;
    }

    public expr(): math.Result {
        let result = this.term();
        while (
            this.currentToken().type === TokenType.Plus ||
            this.currentToken().type === TokenType.Minus
        ) {
            const token = this.currentToken();
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

    private preprocess() {
        while (this.position < this.tokens.length) {
            let token = this.tokens[this.position];
            if (token.type === TokenType.Identifier) {
                if (token.value === 'dec') {
                    this.base = 10;
                    this.tokens.splice(this.position, 1);
                } else if (token.value === 'hex') {
                    this.base = 16;
                    this.tokens.splice(this.position, 1);
                } else if (token.value === 'oct') {
                    this.base = 8;
                    this.tokens.splice(this.position, 1);
                } else if (token.value === 'bin') {
                    this.base = 2;
                    this.tokens.splice(this.position, 1);
                } else if (token.value === 'pre') {
                    let initialPosition = this.position;
                    this.position += 1;
                    let pr = this.factor();
                    this.arithmetic.setPrecision(parseInt(pr.toString()));
                    this.tokens.splice(initialPosition, this.position - initialPosition);
                    this.position = initialPosition;
                } else {
                    this.position += 1;
                }
            } else {
                this.position += 1;
            }
        }

        this.position = 0;
    }

    public parse(): math.Result {
        this.preprocess();

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

    const arithmetic = new math.DecimalArithmetic();
    const parser = new Parser(tokens, arithmetic);
    let result = parser.parse();

    debug(`${expr} -> ${result}`);

    lastResult = result;

    return arithmetic.toString(result, parser.base);
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

        if (currentLine.length === 0 || currentLine.length > 1024) {
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
