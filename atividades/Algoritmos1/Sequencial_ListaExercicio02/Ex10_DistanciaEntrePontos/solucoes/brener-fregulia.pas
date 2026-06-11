program DistanciaEntrePontos;
uses math;
var
  x1, y1, x2, y2, distancia: Real;
begin
  writeln('Digite as coordenadas do primeiro ponto (x1, y1):');
  readln(x1, y1);
  writeln('Digite as coordenadas do segundo ponto (x2, y2):');
  readln(x2, y2);
  distancia := sqrt(sqr(x2 - x1) + sqr(y2 - y1));
  writeln('A distancia entre os pontos e: ', distancia:0:2);
end.
