program AreaLosango;
var
  diagonalMaior, diagonalMenor, area: Real;
begin
  writeln('Digite a diagonal maior do losango:');
  readln(diagonalMaior);
  writeln('Digite a diagonal menor do losango:');
  readln(diagonalMenor);
  area := (diagonalMaior * diagonalMenor) / 2;
  writeln('A area do losango e: ', area:0:2);
end.
