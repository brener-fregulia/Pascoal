program OrdemDecrescente;
var
  num1, num2, num3, temp: Integer;
begin
  writeln('Escreva 3 numeros distintos:');
  readln(num1, num2, num3);
  if num1 < num2 then
  begin
    temp := num1;
    num1 := num2;
    num2 := temp;
  end;
  if num1 < num3 then
  begin
    temp := num1;
    num1 := num3;
    num3 := temp;
  end;
  if num2 < num3 then
  begin
    temp := num2;
    num2 := num3;
    num3 := temp;
  end;
  writeln('Ordem decrescente: ', num1, ', ', num2, ', ', num3);
end.
