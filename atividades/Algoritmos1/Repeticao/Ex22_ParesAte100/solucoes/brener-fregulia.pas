program ParesAte100;
var
  idx: Integer;
begin
  idx := 0;
  while idx <= 100 do
  begin
    write(idx, ' ');
    idx := idx + 2;
  end;
end.
