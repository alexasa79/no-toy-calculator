import * as decimal from "decimal.js";


decimal.Decimal.set({
    toExpPos: 1000,
    toExpNeg: -1000,
    precision: 129,
});

let s = '-2320745023740273048132818024750347852837401938412843017340173743861.0000000000000000000000000000000000000000000000000000000000002';
let d = new decimal.Decimal(s);
console.log(d.toString());
console.log(d.mul(2).toString());


decimal.Decimal.set({
    toExpPos: 1000,
    toExpNeg: -1000,
    precision: 129,
});

s = '2320745023740273048132818024750347852837401938412843017340173743861.0000000000000000000000000000000000000000000000000000000000002';
d = new decimal.Decimal(s);
console.log(d.toString());
console.log(d.mul(2).toString());
