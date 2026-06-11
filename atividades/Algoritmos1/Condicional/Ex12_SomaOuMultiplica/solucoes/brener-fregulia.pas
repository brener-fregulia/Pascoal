program SomaOuMultiplica;
var
  numA, numB, numC: Integer;
begin
  writeln('Escreva 2 numeros:');
  readln(numA, numB);
  if numA = numB then
    numC := numA + numB
  else
    numC := numA * numB;
  writeln('Resultado: ', numC);
end.
