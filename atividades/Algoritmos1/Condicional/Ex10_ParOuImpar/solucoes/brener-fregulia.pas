program ParOuImpar;
var
  numero: Integer;
begin
  writeln('Digite um numero inteiro:');
  readln(numero);
  if numero mod 2 = 0 then
    writeln('O numero ', numero, ' e par.')
  else
    writeln('O numero ', numero, ' e impar.');
end.
