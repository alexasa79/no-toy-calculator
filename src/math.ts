export class Result {
	val: number | string;
	base: number;

	constructor(result: number | string) {
		this.val = result;
		this.base = 10;
	}

	toString(): string {
		return `[base=${this.base}, val=${this.val}]`;
	}
}

export interface Arithmetic {
	parseNumber(s: string, base: number): Result;
	toString(r: Result): string;
	add(a: Result, b: Result): Result;
	sub(a: Result, b: Result): Result;
	mul(a: Result, b: Result): Result;
	div(a: Result, b: Result): Result;
	mod(a: Result, b: Result): Result;
	exp(a: Result, b: Result): Result;
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
