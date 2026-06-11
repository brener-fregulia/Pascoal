program NumeroMaior;
var
  num1, num2: Integer;
begin
  writeln('Digite um numero inteiro:');
  readln(num1);
  writeln('Digite outro numero inteiro:');
  readln(num2);
  if num1 > num2 then
    writeln('O primeiro numero e maior (', num1, ' > ', num2, ')')
  else if num2 > num1 then
    writeln('O primeiro numero e menor (', num1, ' < ', num2, ')')
  else
    writeln('Os numeros sao iguais (', num1, ' = ', num2, ')');
end.
