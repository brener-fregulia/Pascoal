program DobroPosTriploNeg;
var
  num: Integer;
begin
  writeln('Escreva um numero:');
  readln(num);
  if num > 0 then
    writeln('O dobro de ', num, ' e ', num * 2)
  else if num < 0 then
    writeln('O triplo de ', num, ' e ', num * 3)
  else
    writeln('O numero e zero.');
end.
