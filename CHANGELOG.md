# Change Log

## Version 0.0.15
- Few minor fixes.
- Change the extension to be UI extension, meaning it does not require
  remote installation.

## Version 0.0.14
- Support ISO8601 timestamps.
- Support time units: `d`, `h` and `min`.
- Support `ts` preprocessor to convert a number back to a timestamp.

## Version 0.0.13
- Add statements support.
- Add variables support.
- Change `$$` to `$?`.

## Version 0.0.12
- Fix handling of selections. Expression to evaluate is taken from the
  selection and result replaces the selection.

## Version 0.0.11
- Change name to No-Toy Calculator.

## Version 0.0.10
- First attempt at implementing unsigned arithmetic. Likely still buggy.
- Implement logical NOT (`~`) for unsigned arithmetic.

## Version 0.0.9
- Use → instead of `=` to delimit results.
- Support logical AND, OR, and XOR operations (with `&`, `|`, and `^`).

## Version 0.0.8
- Fix handling of trailing `=` sign.
- Settings made with `!` operator local to the document and not global.

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