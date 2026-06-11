program SequenciaA;
const
  totalTermos = 20;
var
  a: array[0..totalTermos - 1] of Real;
  n: Real;
  i: Integer;
begin
  write('Digite o valor de N: ');
  readln(n);
  a[0] := 1;
  writeln('A(0) = ', a[0]:0:6);
  for i := 1 to totalTermos - 1 do
  begin
    a[i] := (a[i - 1] + (n / a[i - 1])) / 2;
    writeln('A(', i, ') = ', a[i]:0:6);
  end;
end.
