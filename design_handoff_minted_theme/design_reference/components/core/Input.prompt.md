Text field. Use `mono` + `prefix="₩"` for money amounts.

```jsx
<Input label="Email" placeholder="you@example.com" />
<Input label="Amount" mono prefix="₩" suffix="KRW" error={tooBig ? "That's more than your cash balance" : undefined} />
```
