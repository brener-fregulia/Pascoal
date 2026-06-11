program CalculoRefresco;
var
  litrosRefresco, agua, suco: Real;
begin
  writeln('Digite a quantidade de litros de refresco desejada:');
  readln(litrosRefresco);
  agua := (litrosRefresco * 8) / 10;
  suco := (litrosRefresco * 2) / 10;
  writeln('Para fazer ', litrosRefresco:0:2, ' litros de refresco, utilize:');
  writeln(agua:0:2, ' litros de agua mineral.');
  writeln(suco:0:2, ' litros de suco de maracuja.');
end.
