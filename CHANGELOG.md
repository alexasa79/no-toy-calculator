# Change Log

## Version 0.0.7
- Better handle units. Allow expressions like `k`, `k/k` and `(24 + 1)k`.
- Support global settings with `!` and `reset`.

## Version 0.0.6
- Fix `ti` to produce correct value.
- Always add `=` before result and do not go to new line.
- Support `cs` produce comma separated result for decimal calculations.

## Version 0.0.5
- Support comma-separated numbering, e.g. 1,000,000.
- Support power of 10 and power of 2 units, like 10k or 100ki.

## Version 0.0.4
- Change underlying arithmetic to decimal.js.
- Add `pre` command to specify precision.

## Version 0.0.3
- Support floating point numbers