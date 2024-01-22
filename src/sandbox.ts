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

if (false) {
    // let tp = `(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?| \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?| \d{4}-\d{2}-\d{2}| \d{4}W\d{2}-\d)`;
    let tp = `(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(?:\.(\\d+))?`;
    let r = new RegExp(tp);

    let s1 = '2024-01-21T15:30:03+02:00';
    console.log(r.exec(s1));
    let s2 = '2024-01-21T15:30:03.023222+02:00';
    console.log(r.exec(s2));
}

if (true) {
    let n = new decimal.Decimal('1024');
    let nki = n.mul(new decimal.Decimal('1024'));
    let nmi = nki.mul(new decimal.Decimal('1024'));
    let ngi = nmi.mul(new decimal.Decimal('1024'));
    let nti = ngi.mul(new decimal.Decimal('1024'));
    let npi = nti.mul(new decimal.Decimal('1024'));

    console.log(n);
    console.log(nki);
    console.log(nmi);
    console.log(ngi);
    console.log(nti);
    console.log(npi);
}