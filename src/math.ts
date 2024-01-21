import * as decimal from "decimal.js";

export class Result {
    val: number | decimal.Decimal;

    constructor(value: number | decimal.Decimal) {
        this.val = value;
    }

    toString(): string {
        return `[val=${this.val}]`;
    }
}

export interface Arithmetic {
    base: number;

    parseNumber(s: string, base: number): Result;
    toString(r: Result): string;
    add(a: Result, b: Result): Result;
    sub(a: Result, b: Result): Result;
    mul(a: Result, b: Result): Result;
    div(a: Result, b: Result): Result;
    mod(a: Result, b: Result): Result;
    exp(a: Result, b: Result): Result;
}

export class DecimalArithmetic implements Arithmetic {
    base: number;

    constructor() {
        decimal.Decimal.set({
            toExpPos: 1000,
            toExpNeg: -1000,
            precision: 1000,
        });

        this.base = 10;
    }

    checkArguments(a: Result, b: Result, what: string) {
        if (!decimal.Decimal.isDecimal(a.val)) {
            throw new Error(`Trying to ${what} non numeric value ${a.val}`);
        }
        if (!decimal.Decimal.isDecimal(b.val)) {
            throw new Error(`Trying to ${what} non numeric value ${a.val}`);
        }
    }

    parseNumber(s: string, base: number): Result {
        if (base === 10) {
            return new Result(new decimal.Decimal(s));
        } else if (base === 16) {
            return new Result(new decimal.Decimal("0x" + s));
        } else if (base === 8) {
            return new Result(new decimal.Decimal("0o" + s));
        } else if (base === 2) {
            return new Result(new decimal.Decimal("0b" + s));
        } else {
            throw new Error(`Unsupported base ${base} when parsing ${s}`);
        }
    }

    toString(r: Result): string {
        if (!decimal.Decimal.isDecimal(r.val)) {
            throw new Error(`Unsupported result value ${r.val} of type ${typeof r.val}`);
        }

        if (this.base === 16) {
            return r.val.toHexadecimal();
        } else if (this.base === 8) {
            return r.val.toOctal();
        } else if (this.base === 2) {
            return r.val.toBinary();
        } else {
            return r.val.toString();
        }
    }

    add(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'add');
        return new Result((a.val as decimal.Decimal).add(b.val));
    }
    sub(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'sub');
        return new Result((a.val as decimal.Decimal).sub(b.val));
    }
    mul(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'mul');
        return new Result((a.val as decimal.Decimal).mul(b.val));
    }
    div(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'div');
        if ((b.val as decimal.Decimal).equals(0)) {
            throw new Error('Divison by zero');
        }
        return new Result((a.val as decimal.Decimal).div(b.val));
    }
    mod(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'div');
        if ((b.val as decimal.Decimal).equals(0)) {
            throw new Error('Divison by zero');
        }
        return new Result((a.val as decimal.Decimal).mod(b.val));
    }
    exp(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'div');
        return new Result((a.val as decimal.Decimal).toPower(b.val));
    }
}

export class JsArithmetic implements Arithmetic {
    checkArguments(a: Result, b: Result, what: string) {
        if (typeof a.val !== 'number') {
            throw new Error(`Trying to ${what} non numeric value ${a.val}`);
        }
        if (typeof b.val !== 'number') {
            throw new Error(`Trying to ${what} non numeric value ${b.val}`);
        }
    }

    parseNumber(s: string, base: number): Result {
        if (s.includes('.')) {
            return new Result(parseFloat(s));
        } else {
            return new Result(parseInt(s, base));
        }
    }

    toString(r: Result): string {
        if (typeof r.val !== 'number') {
            throw new Error(`Unsupported result value ${r.val} of type ${typeof r.val}`);
        }

        if (r.base !== 10 && Math.round(r.val) !== r.val) {
            throw new Error(`Arithmetic cannot produce floating point number in base ${r.base}`);
        }

        let prefix = "";
        if (r.base === 16) {
            prefix = "0x";
        } else if (r.base === 8) {
            prefix = "0o";
        } else if (r.base === 2) {
            prefix = "0b";
        }
        return prefix + r.val.toString(r.base);
    }

    add(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'add');
        return new Result((a.val as number) + (b.val as number));
    }

    sub(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'substitute');
        return new Result((a.val as number) - (b.val as number));
    }

    mul(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'multiply');
        return new Result((a.val as number) * (b.val as number));
    };

    div(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'divide');
        if (b.val === 0) {
            throw new Error('Divison by zero');
        }
        return new Result((a.val as number) / (b.val as number));
    };

    mod(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'divide');
        if (b.val === 0) {
            throw new Error('Divison by zero');
        }
        return new Result((a.val as number) % (b.val as number));
    };

    exp(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'exponentiation');
        return new Result((a.val as number) ** (b.val as number));
    }
}
