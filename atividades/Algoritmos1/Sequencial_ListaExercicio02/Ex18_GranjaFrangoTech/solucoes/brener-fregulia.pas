program GranjaFrangoTech;
const
  custoChipId: Real = 4;
  custoChipAlimento: Real = 3.5;
var
  qtdFrangos: Integer;
begin
  writeln('Digite o numero de frangos:');
  readln(qtdFrangos);
  writeln('Serao gastos R$ ', (qtdFrangos * custoChipId + qtdFrangos * custoChipAlimento * 2):0:2, ' para marcar os frangos.');
end.
