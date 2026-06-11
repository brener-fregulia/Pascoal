program Sucessores;
var
  num, base: Integer;
begin
  writeln('Digite um numero inteiro:');
  readln(num);
  base := num;
  writeln('Os proximos 20 numeros sao:');
  while num < base + 20 do
  begin
    num := num + 1;
    write(num, ' ');
  end;
end.
