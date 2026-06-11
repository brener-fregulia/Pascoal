program VolumeCaixaAgua;
var
  raio, altura, volume: Real;
begin
  writeln('Digite o raio da base da caixa d''agua (em metros):');
  readln(raio);
  writeln('Digite a altura da caixa d''agua (em metros):');
  readln(altura);
  volume := PI * raio * raio * altura;
  writeln('O volume da caixa d''agua e ', volume:0:2, ' metros cubicos.');
end.
