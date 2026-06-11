program SomaHarmonica;
var
  num, idx: Integer;
  soma: Real;
begin
  write('Digite um numero inteiro e positivo: ');
  readln(num);
  if num <= 0 then
    writeln('O numero deve ser inteiro e positivo.')
  else
  begin
    soma := 0;
    for idx := 1 to num do
      soma := soma + 1.0 / idx;
    writeln('A soma harmonica e: ', soma:0:4);
  end;
end.
