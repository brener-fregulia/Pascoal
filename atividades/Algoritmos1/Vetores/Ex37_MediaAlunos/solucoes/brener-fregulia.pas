program MediaAlunos;
var
  notas: array[1..20] of Real;
  i, qtAcimaMedia: Integer;
  soma, media: Real;
begin
  soma := 0;
  qtAcimaMedia := 0;
  for i := 1 to length(notas) do
  begin
    write('Digite a nota ', i, ': ');
    readln(notas[i]);
    soma := soma + notas[i];
  end;
  media := soma / length(notas);
  writeln('A media das notas e: ', media:0:2);
  for i := 1 to length(notas) do
    if notas[i] > media then
      inc(qtAcimaMedia);
  writeln(qtAcimaMedia, ' alunos tiveram nota maior que a media.');
end.
