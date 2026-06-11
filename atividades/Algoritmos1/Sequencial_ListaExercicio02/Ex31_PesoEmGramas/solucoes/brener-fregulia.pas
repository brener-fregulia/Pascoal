program PesoEmGramas;
var
  pesoKg: Real;
begin
  writeln('Digite o peso da pessoa em quilos:');
  readln(pesoKg);
  writeln('O peso da pessoa em gramas e: ', (pesoKg * 1000):0:0, ' g.');
end.
