program AreaQuadrado;
var
  lado, area: Real;
begin
  writeln('Digite o valor do lado do quadrado:');
  readln(lado);
  area := lado * lado;
  writeln('A area do quadrado e: ', area:0:2);
end.
