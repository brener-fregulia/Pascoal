program DiasSemAcidente;
var
  dias, anos, meses, diasRestantes: Integer;
begin
  writeln('Digite a quantidade de dias sem acidente:');
  readln(dias);
  anos := dias div 365;
  meses := (dias mod 365) div 30;
  diasRestantes := (dias mod 365) mod 30;
  writeln('Tempo sem acidentes: ', anos, ' ano(s), ', meses, ' mes(es) e ', diasRestantes, ' dia(s).');
end.
