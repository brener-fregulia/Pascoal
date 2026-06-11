program Antecessores;
var
  num, base: Integer;
begin
  writeln('Digite um numero inteiro:');
  readln(num);
  base := num;
  writeln('Os 10 numeros anteriores sao:');
  while num > base - 10 do
  begin
    num := num - 1;
    write(num, ' ');
  end;
end.
