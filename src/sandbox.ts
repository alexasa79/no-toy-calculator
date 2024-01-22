import * as decimal from "decimal.js";

if (false) {
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
}

if (true) {
    // let tp = `(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?| \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?| \d{4}-\d{2}-\d{2}| \d{4}W\d{2}-\d)`;
    let tp = `(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(?:\.(\\d+))?`;
    let r = new RegExp(tp);

    let s1 = '2024-01-21T15:30:03+02:00';
    console.log(r.exec(s1));
    let s2 = '2024-01-21T15:30:03.023222+02:00';
    console.log(r.exec(s2));
}