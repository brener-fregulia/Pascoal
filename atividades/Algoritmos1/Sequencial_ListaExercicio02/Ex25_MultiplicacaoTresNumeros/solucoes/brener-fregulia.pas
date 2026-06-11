program MultiplicacaoTresNumeros;
var
  num1, num2, num3, resultado: Real;
begin
  writeln('Digite o primeiro numero:');
  readln(num1);
  writeln('Digite o segundo numero:');
  readln(num2);
  writeln('Digite o terceiro numero:');
  readln(num3);
  resultado := num1 * num2 * num3;
  writeln('O resultado da multiplicacao e: ', resultado:0:2);
end.
