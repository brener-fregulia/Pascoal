program Tabuada;
var
  num, idx, resultado: Integer;
begin
  write('Digite um numero para ver sua tabuada: ');
  readln(num);
  writeln('Tabuada de ', num, ':');
  for idx := 1 to 10 do
  begin
    resultado := num * idx;
    writeln(num, ' x ', idx, ' = ', resultado);
  end;
end.
