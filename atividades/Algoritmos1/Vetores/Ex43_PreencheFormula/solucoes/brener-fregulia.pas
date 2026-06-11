program PreencheFormula;
const
  n = 50;
var
  arr: array[1..n] of Integer;
  i: Integer;
begin
  for i := 1 to n do
    arr[i] := (i + 5 * i) mod (i + 1);
  writeln('Valores do vetor:');
  for i := 1 to n do
    writeln('arr[', i, '] = ', arr[i]);
end.
