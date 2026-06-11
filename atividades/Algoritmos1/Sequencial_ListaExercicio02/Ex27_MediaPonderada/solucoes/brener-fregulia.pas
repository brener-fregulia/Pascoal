program MediaPonderada;
var
  nota1, nota2, media: Real;
begin
  writeln('Digite a primeira nota:');
  readln(nota1);
  writeln('Digite a segunda nota:');
  readln(nota2);
  media := ((nota1 * 2) + (nota2 * 3)) / (2 + 3);
  writeln('A media ponderada e: ', media:0:2);
end.
