export type OutputBase = 'dec' | 'hex' | 'bin' | 'oct';

export class Result {
	val: number | string;
	base: OutputBase;

	constructor(result: number | string) {
		this.val = result;
		this.base = 'dec';
	}

	toString(): string {
		return `[base=${this.base}, val=${this.val}]`;
	}
}

export interface Arithmetic {
	add(a: Result, b: Result): Result;
	sub(a: Result, b: Result): Result;
	mul(a: Result, b: Result): Result;
	div(a: Result, b: Result): Result;
	mod(a: Result, b: Result): Result;
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
}
