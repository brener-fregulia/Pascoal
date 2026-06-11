program DiaDoAno;
var
  dia, mes, total: Integer;
begin
  writeln('Digite o mes desejado:');
  readln(mes);
  writeln('Digite o dia desejado:');
  readln(dia);
  total := (mes - 1) * 30 + dia;
  writeln('Se passaram ', total, ' dias desde o inicio do ano.');
end.
