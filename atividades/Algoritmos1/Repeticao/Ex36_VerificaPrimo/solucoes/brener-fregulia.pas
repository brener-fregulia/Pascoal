program VerificaPrimo;
var
  num, idx, divisores: Integer;
begin
  write('Digite um numero inteiro positivo: ');
  readln(num);
  if num <= 1 then
    writeln('Numeros menores ou iguais a 1 nao sao primos.')
  else
  begin
    divisores := 0;
    for idx := 1 to num do
      if num mod idx = 0 then
        divisores := divisores + 1;
    if divisores = 2 then
      writeln(num, ' e um numero primo.')
    else
      writeln(num, ' nao e um numero primo.');
  end;
end.
