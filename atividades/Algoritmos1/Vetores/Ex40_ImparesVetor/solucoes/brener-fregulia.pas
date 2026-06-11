program ImparesVetor;
var
  arr: array[1..25] of Integer;
  i, pos: Integer;
begin
  pos := 1;
  for i := 1 to 50 do
    if i mod 2 = 1 then
    begin
      arr[pos] := i;
      inc(pos);
    end;
  writeln('Impares de 1 a 50:');
  for i := 1 to 25 do
    write(arr[i], ' ');
end.
