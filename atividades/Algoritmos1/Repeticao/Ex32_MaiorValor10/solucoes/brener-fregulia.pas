program MaiorValor10;
var
  i, num, maior: Integer;
begin
  maior := -32768; // MinInt: inicializa com o menor valor possivel para Integer
  for i := 1 to 10 do
  begin
    write('Digite o ', i, ' numero: ');
    readln(num);
    if num > maior then
      maior := num;
  end;
  writeln('O maior valor digitado foi: ', maior);
end.
