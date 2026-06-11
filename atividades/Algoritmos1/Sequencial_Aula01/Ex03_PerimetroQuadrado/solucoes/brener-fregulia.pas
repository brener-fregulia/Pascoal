program PerimetroQuadrado;
var
  lado, perimetro: Real;
begin
  writeln('Digite o valor do lado do quadrado:');
  readln(lado);
  perimetro := 4 * lado;
  writeln('O perimetro do quadrado e: ', perimetro:0:2);
end.
