const toPaise = (n) => Math.round(Number(n) * 100);
const fromPaise = (p) => p / 100;
const round2 = (n) => fromPaise(toPaise(n));
const add = (a, b) => fromPaise(toPaise(a) + toPaise(b));
const sub = (a, b) => fromPaise(toPaise(a) - toPaise(b));
const percentOf = (amount, pct) => fromPaise(Math.round((toPaise(amount) * pct) / 100));

module.exports = { toPaise, fromPaise, round2, add, sub, percentOf };
