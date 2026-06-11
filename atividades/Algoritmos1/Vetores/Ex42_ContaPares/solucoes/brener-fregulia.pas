program ContaPares;
var
  arr: array[1..10] of Integer;
  i, qtdPares: Integer;
begin
  qtdPares := 0;
  for i := 1 to length(arr) do
  begin
    write('Digite um valor inteiro: ');
    readln(arr[i]);
    if arr[i] mod 2 = 0 then
      inc(qtdPares);
  end;
  writeln('Nesta lista existem ', qtdPares, ' numeros pares.');
end.
