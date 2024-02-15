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
    not(a: Result): Result;
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
    not(a: Result): Result {
        throw new Error('NOT operator is not supported in arbitrary precision arithmetic');
    }
}

export class UnsignedArithmetic implements Arithmetic {
    da: DecimalArithmetic;
    bits: number;
    max: decimal.Decimal;

    constructor(bits: number) {
        decimal.Decimal.set({
            toExpPos: 1000,
            toExpNeg: -1000,
            // We need 79 digits of precision to represent (2**128)**2 as decimal. We may need
            // additional 8 bits per digit to represent the number in binary.
            precision: 100 * 8,
        });
        this.da = new DecimalArithmetic();
        this.bits = bits;
        this.max = new decimal.Decimal(2).pow(bits);
    }

    private notd(n: decimal.Decimal): decimal.Decimal {
        let s = n.toBinary();
        s = s.substring(2, s.length); // remove 0b
        s = s.padStart(this.bits, '0');
        let sr = "";
        for (let i = 0; i < s.length; i++) {
            if (s[i] === '0') {
                sr = sr + '1';
            } else {
                sr = sr + '0';
            }
        }
        sr = '0b' + sr;
        let r = new decimal.Decimal(sr);
        return r.mod(this.max);
    }

    private normalize(n: decimal.Decimal): decimal.Decimal {
        if (n.lt(0)) {
            // twos complement of n
            n = this.notd(n.abs());
            n = n.add(1);
        }
        n = n.mod(this.max).floor();
        return n;
    }

    setPrecision(n: number): number {
        throw new Error('Setting precision is not supported in unsigned arithmetic');
    }

    parseNumber(s: string, base: number): Result {
        let result = this.da.parseNumber(s, base);
        let d = result.val as decimal.Decimal;
        if (!d.floor().eq(d)) {
            throw new Error('Fractions are not supported with unsigned arithmetic');
        }
        return new Result(this.normalize(d));
    }

    toString(r: Result, base: number): string {
        return this.da.toString(r, base);
    }

    add(a: Result, b: Result): Result {
        let ad = a.val as decimal.Decimal;
        let bd = b.val as decimal.Decimal;
        let res = ad.add(bd);
        return new Result(this.normalize(res));
    }
    sub(a: Result, b: Result): Result {
        let ad = a.val as decimal.Decimal;
        let bd = b.val as decimal.Decimal;
        let res = ad.sub(bd);
        return new Result(this.normalize(res));
    }
    mul(a: Result, b: Result): Result {
        let ad = a.val as decimal.Decimal;
        let bd = b.val as decimal.Decimal;
        let res = ad.mul(bd);
        return new Result(this.normalize(res));
    }
    div(a: Result, b: Result): Result {
        let res = this.da.div(a, b);
        res.val = (res.val as decimal.Decimal).floor();
        return res;
    }
    mod(a: Result, b: Result): Result {
        return this.da.mod(a, b);
    }
    exp(a: Result, exp: Result): Result {
        let e = exp.val as decimal.Decimal;
        let b = a.val as decimal.Decimal;
        let result = new decimal.Decimal(1);

        while (e.gt(0)) {
            if (e.mod(2).equals(1)) {
                result = result.mul(b);
                result = result.mod(this.max);
            }
            e = e.div(2).floor();
            if (e.gt(0)) {
                b = b.pow(2);
            }
        }

        return new Result(result);
    }
    and(a: Result, b: Result): Result {
        return this.da.and(a, b);
    }
    or(a: Result, b: Result): Result {
        return this.da.or(a, b);
    }
    xor(a: Result, b: Result): Result {
        return this.da.xor(a, b);
    }
    not(a: Result): Result {
        return new Result(this.notd(a.val as decimal.Decimal));
    }
}
