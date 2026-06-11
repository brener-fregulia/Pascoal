program AreaTerreno;
var
  largura, comprimento: Real;
begin
  writeln('Digite a largura do terreno em metros:');
  readln(largura);
  writeln('Digite o comprimento do terreno em metros:');
  readln(comprimento);
  writeln('O terreno possui ', (largura * comprimento):0:2, ' metros quadrados.');
end.
