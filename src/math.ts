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
    and(a: Result, b: Result): Result;
    or(a: Result, b: Result): Result;
    xor(a: Result, b: Result): Result;
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
        this.checkArguments(a, b, 'exp');
        return new Result((a.val as decimal.Decimal).toPower(b.val));
    }
    and(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'and');
        // Check if the number is integer...
        let left = a.val as decimal.Decimal;
        let right = b.val as decimal.Decimal;

        if (!left.floor().equals(left) || !right.floor().equals(right)) {
            throw new Error('Logic operators are only supports for whole numbers');
        }

        let ls = left.toBinary();
        let rs = right.toBinary();
        ls = ls.substring(2, ls.length); // Remove prefix 0b
        rs = rs.substring(2, rs.length); // Remove prefix 0b
        let res = "";
        while (ls !== "" && rs !== "") {
            if (ls[ls.length - 1] === '1' && rs[rs.length - 1] === '1') {
                res = '1' + res;
            } else if (ls[ls.length - 1] === '1' && rs[rs.length - 1] === '0') {
                res = '0' + res;
            } else if (ls[ls.length - 1] === '0' && rs[rs.length - 1] === '1') {
                res = '0' + res;
            } else if (ls[ls.length - 1] === '0' && rs[rs.length - 1] === '0') {
                res = '0' + res;
            }
            ls = ls.substring(0, ls.length - 1);
            rs = rs.substring(0, rs.length - 1);
        }
        res = '0b' + res;

        return new Result(new decimal.Decimal(res));
    }
    or(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'or');
        // Check if the number is integer...
        let left = a.val as decimal.Decimal;
        let right = b.val as decimal.Decimal;

        if (!left.floor().equals(left) || !right.floor().equals(right)) {
            throw new Error('Logic operators are only supports for whole numbers');
        }

        let ls = left.toBinary();
        let rs = right.toBinary();
        ls = ls.substring(2, ls.length); // Remove prefix 0b
        rs = rs.substring(2, rs.length); // Remove prefix 0b
        let res = "";
        while (ls !== "" && rs !== "") {
            if (ls[ls.length - 1] === '1' && rs[rs.length - 1] === '1') {
                res = '1' + res;
            } else if (ls[ls.length - 1] === '1' && rs[rs.length - 1] === '0') {
                res = '1' + res;
            } else if (ls[ls.length - 1] === '0' && rs[rs.length - 1] === '1') {
                res = '1' + res;
            } else if (ls[ls.length - 1] === '0' && rs[rs.length - 1] === '0') {
                res = '0' + res;
            }
            ls = ls.substring(0, ls.length - 1);
            rs = rs.substring(0, rs.length - 1);
        }
        if (ls === "") {
            res = rs + res;
        } else {
            res = ls + res;
        }
        res = '0b' + res;

        return new Result(new decimal.Decimal(res));
    }
    xor(a: Result, b: Result): Result {
        this.checkArguments(a, b, 'xor');
        // Check if the number is integer...
        let left = a.val as decimal.Decimal;
        let right = b.val as decimal.Decimal;

        if (!left.floor().equals(left) || !right.floor().equals(right)) {
            throw new Error('Logic operators are only supports for whole numbers');
        }

        let ls = left.toBinary();
        let rs = right.toBinary();
        ls = ls.substring(2, ls.length); // Remove prefix 0b
        rs = rs.substring(2, rs.length); // Remove prefix 0b
        let res = "";
        while (ls !== "" && rs !== "") {
            if (ls[ls.length - 1] === '1' && rs[rs.length - 1] === '1') {
                res = '0' + res;
            } else if (ls[ls.length - 1] === '1' && rs[rs.length - 1] === '0') {
                res = '1' + res;
            } else if (ls[ls.length - 1] === '0' && rs[rs.length - 1] === '1') {
                res = '1' + res;
            } else if (ls[ls.length - 1] === '0' && rs[rs.length - 1] === '0') {
                res = '0' + res;
            }
            ls = ls.substring(0, ls.length - 1);
            rs = rs.substring(0, rs.length - 1);
        }
        if (ls === "") {
            res = rs + res;
        } else {
            res = ls + res;
        }
        res = '0b' + res;

        return new Result(new decimal.Decimal(res));
    }
}
