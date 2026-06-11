program IMC;
var
  imc, pesoKg, altura: Real;
begin
  writeln('Digite o seu peso em kg:');
  readln(pesoKg);
  writeln('Digite sua altura em metros:');
  readln(altura);
  imc := pesoKg / (altura * altura);
  if imc < 18.5 then
    writeln('IMC: ', imc:0:2, ' - Abaixo do peso')
  else if imc <= 25 then
    writeln('IMC: ', imc:0:2, ' - Peso normal')
  else if imc <= 30 then
    writeln('IMC: ', imc:0:2, ' - Acima do peso')
  else
    writeln('IMC: ', imc:0:2, ' - Obeso');
end.
