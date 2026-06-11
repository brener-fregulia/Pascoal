program ABCalculo;
var
  numA, numB, numC: Integer;
begin
  writeln('Escreva 3 numeros:');
  readln(numA, numB, numC);
  if (numA + numB) > numC then
    writeln('A soma de ', numA, ' + ', numB, ' e maior que ', numC)
  else if (numA + numB) < numC then
    writeln('A soma de ', numA, ' + ', numB, ' e menor que ', numC)
  else
    writeln('A soma de ', numA, ' + ', numB, ' e igual a ', numC);
end.
