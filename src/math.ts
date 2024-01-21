import * as decimal from "decimal.js";

export class Result {
    val: number | decimal.Decimal;

    constructor(value: number | decimal.Decimal) {
        this.val = value;
    }

    toString(): string {
        return `${this.val}`;
    }
}

export interface Arithmetic {
    setPrecision(n: number): number;
    parseNumber(s: string, base: number): Result;
    toString(r: Result, base: number): string;
    add(a: Result, b: Result): Result;
    sub(a: Result, b: Result): Result;
    mul(a: Result, b: Result): Result;
    div(a: Result, b: Result): Result;
    mod(a: Result, b: Result): Result;
    exp(a: Result, b: Result): Result;
}

export class DecimalArithmetic implements Arithmetic {
    constructor() {
        decimal.Decimal.set({
            toExpPos: 1000,
            toExpNeg: -1000,
        });
    }

    setPrecision(n: number): number {
        let res = decimal.Decimal.precision;
        decimal.Decimal.set({ precision: n });
        return res;
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

    toString(r: Result, base: number): string {
        if (!decimal.Decimal.isDecimal(r.val)) {
            throw new Error(`Unsupported result value ${r.val} of type ${typeof r.val}`);
        }

        if (base === 16) {
            return r.val.toHexadecimal();
        } else if (base === 8) {
            return r.val.toOctal();
        } else if (base === 2) {
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
