program DivisoresNum;
var
  num, idx: Integer;
begin
  write('Digite um numero inteiro positivo: ');
  readln(num);
  writeln('Divisores de ', num, ':');
  for idx := 1 to num do
    if num mod idx = 0 then
      write(idx, ' ');
end.
