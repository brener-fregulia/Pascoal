program Partida;
var
  time1, time2: String;
  gols1, gols2: Integer;
begin
  writeln('Digite o nome do time 1:');
  readln(time1);
  writeln('Digite o nome do time 2:');
  readln(time2);
  writeln('Digite a quantidade de gols do time 1:');
  readln(gols1);
  writeln('Digite a quantidade de gols do time 2:');
  readln(gols2);
  if gols1 > gols2 then
    writeln('O time ', time1, ' e o vencedor.')
  else if gols1 < gols2 then
    writeln('O time ', time2, ' e o vencedor.')
  else
    writeln('EMPATE');
end.
