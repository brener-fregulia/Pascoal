program DivisaoDoisNumeros;
var
  num1, num2, resultado: Real;
begin
  writeln('Digite o primeiro numero:');
  readln(num1);
  writeln('Digite o segundo numero (diferente de zero):');
  readln(num2);
  resultado := num1 / num2;
  writeln('O resultado da divisao e: ', resultado:0:2);
end.
