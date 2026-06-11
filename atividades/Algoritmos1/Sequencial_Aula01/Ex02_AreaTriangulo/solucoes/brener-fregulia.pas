program AreaTriangulo;
var
  base, altura, area: Real;
begin
  writeln('Digite a base do triangulo:');
  readln(base);
  writeln('Digite a altura do triangulo:');
  readln(altura);
  area := (base * altura) / 2;
  writeln('A area do triangulo e: ', area:0:2);
end.
