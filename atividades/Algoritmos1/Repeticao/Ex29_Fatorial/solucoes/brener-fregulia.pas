program Fatorial;

function fatorial(num: Integer): Integer;
begin
  if num = 0 then
    fatorial := 1
  else
    fatorial := num * fatorial(num - 1);
end;

var
  num, resultado: Integer;
begin
  write('Digite um numero inteiro positivo: ');
  readln(num);
  resultado := fatorial(num);
  writeln('O fatorial de ', num, ' e ', resultado);
end.
