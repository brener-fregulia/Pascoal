program DescrevaNumero;
var
  num, centena, dezena, unidade: Integer;
begin
  writeln('Digite um numero com ate 3 digitos:');
  readln(num);
  centena := num div 100;
  dezena := (num mod 100) div 10;
  unidade := (num mod 100) mod 10;
  writeln('Centena = ', centena);
  writeln('Dezena  = ', dezena);
  writeln('Unidade = ', unidade);
end.
