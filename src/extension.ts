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
        return `[${this.type} ${this.value} @${this.position}]`;
    }
}

enum TokenType {
    Number = 'NUMBER',
    HexNumber = 'HNUMBER',
    OctNumber = 'ONUMBER',
    BinNumber = 'BNUMBER',
    Timestamp = 'TIMESTAMP',
    Plus = 'PLUS',
    Minus = 'MINUS',
    Multiply = 'MULTIPLY',
    Divide = 'DIVIDE',
    Modulo = 'MODULO',
    Exponentiation = 'EXP',
    And = 'AND',
    Or = 'OR',
    Xor = 'XOR',
    Not = 'NOT',
    Bang = 'BANG',
    LParen = 'LPAREN',
    RParen = 'RPAREN',
    Variable = 'VARIABLE',
    Equal = 'EQUAL',
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

    private consumeTimestamp(): string | null {
        const startPos = this.position;
        let str = this.text.substring(startPos);

        const regex1 = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2})[:-](?<min>\d{2})[:-](?<sec>\d{2})(?<frac>\.(\d+))?(Z|(?<tz>[+-]\d{2}:\d{2}))?/;
        const regex2 = /^(?<hour>\d{2}):(?<min>\d{2})(?::(?<sec>\d{2}))?/;
        let m = regex1.exec(str);
        if (m === null) {
            m = regex2.exec(str);
        }

        if (m !== null) {
            let year = "1970";
            if (m.groups?.year) {
                year = m.groups.year;
            }

            let month = "01";
            if (m.groups?.month) {
                month = m.groups.month;
            }

            let day = "01";
            if (m.groups?.day) {
                day = m.groups.day;
            }

            let sec = "00";
            if (m.groups?.sec) {
                sec = m.groups.sec;
            }

            let hour = m.groups!.hour;
            let min = m.groups!.min;

            let s = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
            let tz = "-00:00";
            if (m.groups?.tz) {
                tz = m.groups.tz;
            }
            s += tz;

            let d = new Date(s);
            let res = `${d.getTime() / 1000}`;

            if (m.groups?.frac) {
                res += m.groups.frac;
            }

            this.position += m[0].length;
            this.currentChar = this.text[this.position] || null;
            debug(`${m[0]} -> ${s} -> ${res}`);
            return res;
        } else {
            return null;
        }
    }

    private getNextToken(): Token {
        while (this.currentChar !== null) {
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }

            const positionBefore = this.position;
            let ts;

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
                this.advance();
                return new Token(TokenType.OctNumber, this.octNumber(), positionBefore);
            }
            if ((ts = this.consumeTimestamp()) !== null) {
                return new Token(TokenType.Timestamp, ts, positionBefore);
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
            if (this.currentChar === '!') {
                this.advance();
                return new Token(TokenType.Bang, '!', positionBefore);
            }
            if (this.currentChar === '&') {
                this.advance();
                return new Token(TokenType.And, '&', positionBefore);
            }
            if (this.currentChar === '|') {
                this.advance();
                return new Token(TokenType.Or, '|', positionBefore);
            }
            if (this.currentChar === '^') {
                this.advance();
                return new Token(TokenType.Xor, '^', positionBefore);
            }
            if (this.currentChar === '~') {
                this.advance();
                return new Token(TokenType.Not, '~', positionBefore);
            }
            if (this.currentChar === '(') {
                this.advance();
                return new Token(TokenType.LParen, '(', positionBefore);
            }
            if (this.currentChar === ')') {
                this.advance();
                return new Token(TokenType.RParen, ')', positionBefore);
            }
            if (this.currentChar === '$') {
                this.advance();
                const name = this.consumeWord();
                return new Token(TokenType.Variable, `$${name}`, positionBefore);
            }
            if (this.currentChar === '=') {
                this.advance();
                return new Token(TokenType.Equal, '=', positionBefore);
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
        tokens.push(token);
        return tokens;
    }
}

class FuzzySettings {
    base: number | undefined;
    commaSeparated: boolean | undefined;
    timestamp: boolean | undefined;
    precision: number | undefined;
    arithmetic: string | undefined;

    constructor() {
        this.base = undefined;
        this.commaSeparated = undefined;
        this.timestamp = undefined;
        this.precision = undefined;
    }

    toString() {
        let t: string[] = [];
        if (this.base !== undefined) {
            t.push(`base=${this.base}`);
        }
        if (this.timestamp) {
            t.push("ts");
        }
        if (this.commaSeparated) {
            t.push("cs");
        }
        if (this.precision) {
            t.push(`pre=${this.precision}`);
        }
        return t.join(" ");
    }
}

class Settings {
    base: number;
    commaSeparated: boolean;
    timestamp: boolean;
    precision: number;
    arithmetic: string;

    constructor() {
        this.base = 10;
        this.commaSeparated = false;
        this.timestamp = false;
        this.precision = 20;
        this.arithmetic = 'arb';
    }

    toString() {
        let t: string[] = [];
        let res = `ar=${this.arithmetic}, base=${this.base}`;
        if (this.commaSeparated) {
            res += " cs";
        }
        if (this.timestamp) {
            res += " ts";
        }
        res += ` pre=${this.precision}`;
        return res;
    }
}

export class DocumentState {
    settings: Settings;
    variables: Map<string, math.Result>;

    constructor(settings: Settings) {
        this.settings = new Settings();
        this.settings.arithmetic = settings.arithmetic;
        this.settings.base = settings.base;
        this.settings.commaSeparated = settings.commaSeparated;
        this.settings.timestamp = settings.timestamp;
        this.settings.precision = settings.precision;
        this.variables = new Map<string, math.Result>;
    }
}

export let defaultSettings = new Settings();

let settingsMap = new WeakMap;
function getDocumentState(doc: vscode.TextDocument): DocumentState {
    if (!settingsMap.has(doc)) {
        settingsMap.set(doc, new DocumentState(defaultSettings));
    }
    return settingsMap.get(doc);
}

class Parser {
    private tokens: Token[];
    private position: number;
    private arithmetic: math.Arithmetic;
    private state: DocumentState;

    constructor(tokens: Token[], arithmetic: math.Arithmetic, docState: DocumentState) {
        this.tokens = tokens;
        this.position = 0;
        this.arithmetic = arithmetic;
        this.state = docState;
    }

    setArithmetic(ar: math.Arithmetic) {
        this.arithmetic = ar;
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
        } else if (token.type === TokenType.Not) {
            this.advance();
            return this.arithmetic.not(this.factor());
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
        } else if (token.type === TokenType.Timestamp) {
            this.advance();
            return this.arithmetic.parseNumber(token.value, 10);
        } else if (token.type === TokenType.Variable) {
            this.advance();
            if (this.state.variables.get(token.value) === undefined) {
                throw new Error(`Evaluating undefined variable ${token.value}`);
            }
            return this.state.variables.get(token.value)!;
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

    private multiply(): math.Result {
        let left = this.exponent();
        while (
            this.currentToken().type === TokenType.Multiply ||
            this.currentToken().type === TokenType.Divide ||
            this.currentToken().type === TokenType.Modulo
        ) {
            const token = this.currentToken();
            this.advance();
            let right = this.exponent();

            if (token.type === TokenType.Multiply) {
                left = this.arithmetic.mul(left, right);
            } else if (token.type === TokenType.Divide) {
                left = this.arithmetic.div(left, right);
            } else if (token.type === TokenType.Modulo) {
                left = this.arithmetic.mod(left, right);
            }
        }
        return left;
    }

    private add(): math.Result {
        let result = this.multiply();
        while (
            this.currentToken().type === TokenType.Plus ||
            this.currentToken().type === TokenType.Minus
        ) {
            const token = this.currentToken();
            this.advance();
            let right = this.multiply();

            if (token.type === TokenType.Plus) {
                result = this.arithmetic.add(result, right);
            } else if (token.type === TokenType.Minus) {
                result = this.arithmetic.sub(result, right);
            }
        }
        return result;
    }

    private expr(): math.Result {
        let result = this.add();
        while (
            this.currentToken().type === TokenType.And ||
            this.currentToken().type === TokenType.Or ||
            this.currentToken().type === TokenType.Xor
        ) {
            const token = this.currentToken();
            this.advance();
            let right = this.add();

            if (token.type === TokenType.And) {
                result = this.arithmetic.and(result, right);
            } else if (token.type === TokenType.Or) {
                result = this.arithmetic.or(result, right);
            } else if (token.type === TokenType.Xor) {
                result = this.arithmetic.xor(result, right);
            }
        }
        return result;
    }

    private stmt() {
        if (this.tokens.length - this.position > 2) {
            let token = this.tokens[this.position];
            let next = this.tokens[this.position + 1];
            if (token.type === TokenType.Variable && next.type === TokenType.Equal) {
                this.advance();
                this.advance();
                let result = this.expr();
                this.state.variables.set(token.value, result);
            }
        }
    }

    private handleBang(): boolean {
        if (this.position >= this.tokens.length) {
            return false;
        }

        let token = this.tokens[this.position];
        if (token.type === TokenType.Bang) {
            this.tokens.splice(this.position, 1);
            return true;
        } else {
            return false;
        }
    }

    public preprocess(): [FuzzySettings, FuzzySettings] {
        let unitConversions = new Map<string, string>([
            ['pi', '1125899906842624'],
            ['ti', '1099511627776'],
            ['gi', '1073741824'],
            ['min', '60'],
            ['mi', '1048576'],
            ['ki', '1024'],
            ['q', '1000000000000'],
            ['g', '1000000000'],
            ['b', '1000000000'],
            ['m', '1000000'],
            ['k', '1000'],
            ['d', '86400'],
            ['h', '3600'],
        ]);

        let arithmetics = [
            'arb',
            'u128',
            'u64',
            'u32',
            'u16',
            'u8',
        ];

        let locals = new FuzzySettings();
        let globals = new FuzzySettings();

        while (this.position < this.tokens.length) {
            let token = this.tokens[this.position];
            if (token.type === TokenType.Identifier) {
                if (token.value === 'reset') {
                    globals.base = 10;
                    globals.commaSeparated = false;
                    globals.precision = 20;
                    this.tokens.splice(this.position, 1);
                } else if (token.value === 'dec') {
                    locals.base = 10;
                    this.tokens.splice(this.position, 1);
                    if (this.handleBang()) {
                        globals.base = 10;
                    }
                } else if (token.value === 'hex') {
                    locals.base = 16;
                    this.tokens.splice(this.position, 1);
                    if (this.handleBang()) {
                        globals.base = 16;
                    }
                } else if (token.value === 'oct') {
                    locals.base = 8;
                    this.tokens.splice(this.position, 1);
                    if (this.handleBang()) {
                        globals.base = 8;
                    }
                } else if (token.value === 'bin') {
                    locals.base = 2;
                    this.tokens.splice(this.position, 1);
                    if (this.handleBang()) {
                        globals.base = 2;
                    }
                } else if (token.value === 'pre') {
                    let initialPosition = this.position;
                    this.position += 1;
                    let pr = this.factor();
                    let precision = parseInt(pr.toString());
                    locals.precision = precision;
                    this.tokens.splice(initialPosition, this.position - initialPosition);
                    this.position = initialPosition;
                    if (this.handleBang()) {
                        globals.precision = precision;
                    }
                } else if (token.value === 'cs') {
                    locals.commaSeparated = true;
                    this.tokens.splice(this.position, 1);
                    if (this.handleBang()) {
                        globals.commaSeparated = true;
                    }
                } else if (token.value === 'ts') {
                    locals.timestamp = true;
                    this.tokens.splice(this.position, 1);
                    if (this.handleBang()) {
                        globals.timestamp = true;
                    }
                } else if (unitConversions.has(token.value)) {
                    const numericTokens = [
                        TokenType.Number,
                        TokenType.HexNumber,
                        TokenType.BinNumber,
                        TokenType.OctNumber,
                        TokenType.Variable,
                    ];
                    const multiplier = unitConversions.get(token.value)!;
                    if (this.position > 0 && numericTokens.includes(
                        this.tokens[this.position - 1].type))
                    {
                        const numberPos = this.position - 1;
                        // 1k -> (1k
                        this.tokens.splice(numberPos, 0,
                            new Token(TokenType.LParen, '(', token.position));
                        // (1k -> (1*1000)
                        this.tokens.splice(numberPos + 2, 1,
                            new Token(TokenType.Multiply, '*', token.position),
                            new Token(TokenType.Number, multiplier, token.position),
                            new Token(TokenType.RParen, ')', token.position),
                        );
                    } else if (this.position > 0 &&
                        this.tokens[this.position - 1].type === TokenType.RParen)
                    {
                        this.tokens.splice(this.position, 1,
                            new Token(TokenType.Multiply, '*', token.position),
                            new Token(TokenType.Number, multiplier, token.position)
                        );
                    } else {
                        this.tokens.splice(this.position, 1,
                            new Token(TokenType.Number, multiplier, token.position));
                    }
                    this.position += 1;
                } else if (arithmetics.includes(token.value)) {
                    locals.arithmetic = token.value;
                    if (this.handleBang()) {
                        globals.arithmetic = token.value;
                    }
                    this.tokens.splice(this.position, 1);
                } else {
                    this.position += 1;
                }
            } else {
                this.position += 1;
            }
        }

        this.position = 0;

        const tokenMap = this.tokens.map(obj => obj.toString()).join(', ');
        debug(`Tokens after proprocessor [${this.tokens.length}]: ${tokenMap}`);

        return [locals, globals];
    }

    public parse(): math.Result | undefined {
        this.stmt();

        let result: math.Result | undefined = undefined;
        if (this.currentToken().type !== TokenType.EOF) {
            result = this.expr();
        }
        let token = this.currentToken();
        debug(`Current token ${token}`);
        if (token.type !== TokenType.EOF) {
            throw new Error(`Unexpected token ${token}`);
        }
        return result;
    }
}

function addCommas(x: string, every: number) {
    var parts = x.toString().split(".");
    let regex = `\\B(?=(\\d{${every}})+(?!\\d))`;
    let re = new RegExp(regex, 'g');
    parts[0] = parts[0].replace(re, ',');
    return parts.join(".");
}

function sortSettings(locals: FuzzySettings, globals: FuzzySettings, docState: DocumentState): Settings {
    let s = new Settings();

    let docSettings = docState.settings;

    docSettings.base = globals.base ? globals.base : docSettings.base;
    docSettings.precision = globals.precision ? globals.precision : docSettings.precision;
    docSettings.commaSeparated = globals.commaSeparated ? globals.commaSeparated : docSettings.commaSeparated;
    docSettings.timestamp = globals.timestamp ? globals.timestamp : docSettings.timestamp;
    docSettings.arithmetic = globals.arithmetic ? globals.arithmetic : docSettings.arithmetic;

    if (
        globals.base ||
        globals.commaSeparated ||
        globals.timestamp ||
        globals.precision ||
        globals.arithmetic
    ) {
        info(`Set document-wide settings to ${docSettings}`);
    }

    s.base = locals.base ? locals.base : docSettings.base;
    s.precision = locals.precision ? locals.precision : docSettings.precision;
    s.timestamp = locals.timestamp ? locals.timestamp : docSettings.timestamp;
    s.commaSeparated = locals.commaSeparated ? locals.commaSeparated : docSettings.commaSeparated;
    s.arithmetic = locals.arithmetic ? locals.arithmetic : docSettings.arithmetic;

    return s;
}

function getArithmetic(settings: Settings): math.Arithmetic {
    if (settings.arithmetic === 'u128') {
        return new math.UnsignedArithmetic(128);
    } else if (settings.arithmetic === 'u64') {
        return new math.UnsignedArithmetic(64);
    } else if (settings.arithmetic === 'u32') {
        return new math.UnsignedArithmetic(32);
    } else if (settings.arithmetic === 'u16') {
        return new math.UnsignedArithmetic(16);
    } else if (settings.arithmetic === 'u8') {
        return new math.UnsignedArithmetic(8);
    } else {
        throw new Error(`Internal error: unsupported arithmetic ${settings.arithmetic}`);
    }
}

export function evaluateExpression(expr: string, docState: DocumentState): string {
    debug(`Evaluating line: ${expr}`);

    const lexer = new Lexer(expr);
    const tokens = lexer.tokenize();

    const tokenMap = tokens.map(obj => obj.toString()).join(', ');
    debug(`Tokens before proprocessor [${tokens.length}]: ${tokenMap}`);

    let resultString = '';

    let arithmetic: math.Arithmetic;
    arithmetic = new math.DecimalArithmetic();

    const parser = new Parser(tokens, arithmetic, docState);
    const [locals, globals] = parser.preprocess();

    let settings = sortSettings(locals, globals, docState);
    if (settings.arithmetic !== 'arb') {
        arithmetic = getArithmetic(settings);
        parser.setArithmetic(arithmetic);
    } else {
        arithmetic.setPrecision(settings.precision);
    }

    if (tokens.length !== 1) {
        let result = parser.parse();

        if (result !== undefined) {
            docState.variables.set('$?', result);

            resultString = arithmetic.toString(result, settings.base!);
            if (settings.base === 10) {
                if (settings.timestamp) {
                    let m = /(?<res>\d+)(?:\.(?<frac>\d+))?/.exec(resultString);
                    if (m && m.groups?.res) {
                        let res = parseInt(m.groups.res) * 1000;
                        let d = new Date(res);
                        resultString = d.toISOString();
                        if (m.groups?.frac) {
                            resultString = resultString.substring(0, resultString.length - 4);
                            resultString += m.groups.frac + "Z";
                        }
                    }
                } else if (settings.commaSeparated) {
                    resultString = addCommas(resultString, 3);
                }
            }
        } else {
            resultString = "";
        }
    }

    debug(`${expr} -> ${resultString}`);

    return resultString;
}

export function evaluateExpressionSafe(expr: string, docState: DocumentState): [string, boolean] {
    try {
        return [evaluateExpression(expr, docState), true];
    } catch (e) {
        debug(`Error parsing expression: ${e}`);
    }
    return ["", false];
}

function trimLine(s: string): string {
    let start = 0;
    let re = new RegExp('(?:#+|//+|/[*]+|→|✓)', 'g');
    let m = re.exec(s);
    while (m !== null) {
        start = m.index + m[0].length;
        m = re.exec(s);
    }
    return s.substring(start).trim();
}

function evaluateString(currentLine: string, editor: vscode.TextEditor): [string, boolean] {
    debug(`Evaluating line: ${currentLine}`);

    if (currentLine.length === 0 || currentLine.length > 1024) {
        err(`Expression's length ${currentLine.length} does not make sense.`);
        return ["", false];
    }

    // Remove trailing `＝` from the end of the input string...
    currentLine = currentLine.trim();
    if (currentLine.endsWith('→')) {
        currentLine = currentLine.substring(0, currentLine.length - 1);
    }

    currentLine = trimLine(currentLine);
    debug(`After trimming: ${currentLine}`);

    return evaluateExpressionSafe(currentLine, getDocumentState(editor.document));
}

function evaluate() {
    debug('-------------------------------------> Beginning evaluation');

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
        const cursor = selection.active;

        debug(`Cursor: ${cursor.line}, ${cursor.character}`);
        debug(`Selection: ${selection.start.line}:${selection.start.character}` +
            `${selection.end.line}:${selection.end.character}`);

        let ok = false;
        let result: string;
        let currentLine: string;
        if (selection.start.compareTo(selection.end) !== 0) {
            currentLine = doc.lineAt(cursor).text.substring(
                selection.start.character, selection.end.character);
            [result, ok] = evaluateString(currentLine, editor);
        } else {
            currentLine = doc.lineAt(cursor).text.substring(0, cursor.character);
            result = "";
            for (let i = 0; i < currentLine.length; i++) {
                [result, ok] = evaluateString(currentLine.substring(i, currentLine.length), editor);
                if (ok) {
                    break;
                }
            }
            if (ok) {
                if (result !== "") {
                    result = " → " + result;
                } else {
                    result = "✓";
                }
            }
        }

        results.push(result);
    }

    editor.edit(edit => {
        for (let i = 0; i < editor.selections.length; i++) {
            const selection = editor.selections[i];
            edit.replace(selection, results[i]);
        }
    });
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('no-toy-calculator.eval', evaluate);
    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
