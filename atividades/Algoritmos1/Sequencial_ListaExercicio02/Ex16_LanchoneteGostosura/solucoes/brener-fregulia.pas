program LanchoneteGostosura;
const
  pesoQueijo: Real = 0.05;
  pesoPresunto: Real = 0.05;
  pesoCarne: Real = 0.1;
var
  qtdSanduiches: Integer;
  kgQueijo, kgPresunto, kgCarne: Real;
begin
  writeln('Digite a quantidade de sanduiches a serem feitos:');
  readln(qtdSanduiches);
  kgQueijo := qtdSanduiches * pesoQueijo * 2;
  kgPresunto := qtdSanduiches * pesoPresunto;
  kgCarne := qtdSanduiches * pesoCarne;
  writeln('Sera necessario:');
  writeln(kgQueijo:0:3, ' quilos de queijo.');
  writeln(kgPresunto:0:3, ' quilos de presunto.');
  writeln(kgCarne:0:3, ' quilos de carne.');
end.
