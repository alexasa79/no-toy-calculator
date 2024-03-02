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

if (false) {
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

function parseTimestamp(str: string): string | null {
    console.log("----------------------------->", str);
    const regex1 = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2})[:-](?<min>\d{2})[:-](?<sec>\d{2})(?<frac>\.(\d+))?(Z|(?<tz>[+-]\d{2}:\d{2}))?/;
    const regex2 = /(?<hour>\d{2}):(?<min>\d{2})(?<sec>:\d{2})?/;
    let m;
    let s = "";
    m = regex1.exec(str);
    if (m === null) {
        m = regex2.exec(str);
        if (m === null) {
        }
    }
    if (m !== null) {
        console.log(m);

        let year = "1970";
        if (m.groups?.year) {
            year = m.groups.year;
        }

        let month = "01";
        if (m.groups?.month) {
            month = m.groups.month;
        }

        let day = "01";
        if (m.groups?.day) {
            day = m.groups.day;
        }

        let sec = "00";
        if (m.groups?.sec) {
            sec = m.groups.sec;
        }

        let hour = m.groups!.hour;
        let min = m.groups!.min;

        let s = `${year}-${month}-${day}T${hour}:${min}:${sec}`;
        let tz = "-00:00";
        if (m.groups?.tz) {
            tz = m.groups.tz;
        }
        s += tz;

        let d = new Date(s);
        let res = `${d.getTime() / 1000}`;

        if (m.groups?.frac) {
            res += m.groups.frac;
        }

        console.log(`${m[0]} -> ${s} -> ${d} -> ${res}`);
        return res;
    } else {
        return null;
    }
}

console.log("out:", parseTimestamp("2024-03-02T15:45:31Z something else..."), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31+01:00"), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31+03:00"), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31-07:00"), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31.456Z"), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31.456+05:30"), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31.456823+06:30"), "\n");
// console.log("out:", parseTimestamp("2024-03-02T15:45:31.456823938Z+07:30"), "\n");
// console.log("out:", parseTimestamp("2024-02-28T17-36-15.521772983Z"), "\n");
console.log("out:", parseTimestamp("00:00:01"), "\n");
console.log("out:", parseTimestamp("00:01"), "\n");
