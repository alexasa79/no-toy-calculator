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
