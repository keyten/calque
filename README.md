## Changelog (compared with grimalschi's calque)

#### Matrix
Symmetrization and antisymmetrization:
```js
matrix = [[1,2],[3,4]]
sym(matrix) // = [[1, 2.5], [2.5, 4]]
alt(matrix) // = [[0, -0.5], [0.5, 0]]

sym(matrix) + alt(matrix) == matrix // = true
```

Diagonal matrices:
```js
diagonal([1,2]) // = [[1,0], [0,2]]
```

Column:
```js
a = [[1,2,3],[4,5,6]]
col(a, 1) // = [1, 4]
col(a, 1, [0,0]) // = [[0, 2, 3], [0, 5, 6]]
```

#### Fractions
Square root:
```js
a = fraction(1, 3) // = 0.(3)
sqrt(a) // = 0.5773502691
```

#### Numeric integration
```js
f(x) = x^2 // fn
int(f, 0, 1) // = 0.3849999999999999
```

#### Fibonacci & tribonacci
```js
fib(11) // = 89
trib(11) // = 149
```

#### Polynom
```js
a = polynom(1, 2, 3) // = 1 + 2x + 3x^2
a + a // = 2 + 4x + 6x^2
a * a // = 1 + 4x + 10x^2 + 12x^3 + 9x^4
```

#### Units
`equalBase` function
```js
// meters & centimeters
equalBase(5m, 5cm) // = true

// meters & hours
equalBase(5m, 5h) // = false
```
