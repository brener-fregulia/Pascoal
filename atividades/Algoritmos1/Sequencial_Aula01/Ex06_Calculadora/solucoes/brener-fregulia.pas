program Calculadora;
var
  val1, val2, val3, val4, soma: Integer;
begin
  writeln('Escreva o 1 numero:');
  readln(val1);
  writeln('Escreva o 2 numero:');
  readln(val2);
  writeln('Escreva o 3 numero:');
  readln(val3);
  writeln('Escreva o 4 numero:');
  readln(val4);
  soma := val1 + val2 + val3 + val4;
  writeln('A soma de ', val1, ' + ', val2, ' + ', val3, ' + ', val4, ' e igual a ', soma);
end.
