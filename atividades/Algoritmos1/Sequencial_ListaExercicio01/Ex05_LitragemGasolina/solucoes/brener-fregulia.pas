program LitragemGasolina;
var
  reais, preco: Real;
begin
  writeln('Digite o preco da gasolina:');
  readln(preco);
  writeln('Digite quantos reais voce colocou:');
  readln(reais);
  writeln('Voce colocou ', (reais / preco):0:2, ' litros de gasolina.');
end.
