program Tabuada;
var
  numero, contador: Integer;
begin
  writeln('Digite um numero para calcular a tabuada:');
  readln(numero);
  for contador := 1 to 10 do
    writeln(numero, ' x ', contador, ' = ', numero * contador);
end.
