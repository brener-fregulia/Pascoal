program AreaTrapezio;
var
  baseMaior, baseMenor, altura, area: Real;
begin
  writeln('Digite a base maior do trapezio:');
  readln(baseMaior);
  writeln('Digite a base menor do trapezio:');
  readln(baseMenor);
  writeln('Digite a altura do trapezio:');
  readln(altura);
  area := ((baseMaior + baseMenor) * altura) / 2;
  writeln('A area do trapezio e: ', area:0:2);
end.
