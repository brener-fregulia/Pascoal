program SeparaParesImpares;
const
  n = 20;
var
  num, i, idxPar, idxImpar: Integer;
  pares, impares: array[1..n] of Integer;
begin
  idxPar := 0;
  idxImpar := 0;
  for i := 1 to n do
  begin
    write('Digite o ', i, ' valor: ');
    readln(num);
    if num mod 2 = 0 then
    begin
      inc(idxPar);
      pares[idxPar] := num;
    end
    else
    begin
      inc(idxImpar);
      impares[idxImpar] := num;
    end;
  end;
  writeln;
  writeln('Valores Pares:');
  for i := 1 to idxPar do
    write(pares[i], ' ');
  writeln;
  writeln('Valores Impares:');
  for i := 1 to idxImpar do
    write(impares[i], ' ');
end.
