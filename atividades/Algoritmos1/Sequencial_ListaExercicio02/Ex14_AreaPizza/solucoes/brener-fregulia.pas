program AreaPizza;
var
  raio: Real;
begin
  writeln('Digite o raio da pizza em cm:');
  readln(raio);
  writeln('A area da pizza e de ', (PI * raio * raio):0:3, ' cm quadrados.');
end.
