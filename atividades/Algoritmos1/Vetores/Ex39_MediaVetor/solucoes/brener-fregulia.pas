program MediaVetor;
var
  valor: array[1..5] of Integer;
  i, soma: Integer;
  media: Real;
begin
  soma := 0;
  for i := 1 to length(valor) do
  begin
    write('Digite um valor inteiro: ');
    readln(valor[i]);
    soma := soma + valor[i];
  end;
  media := soma / length(valor);
  writeln('A media dos valores e: ', media:0:2);
  for i := 1 to length(valor) do
  begin
    if valor[i] > media then
      writeln('O valor ', i, ' (', valor[i], ') e maior que a media.')
    else if valor[i] < media then
      writeln('O valor ', i, ' (', valor[i], ') e menor que a media.')
    else
      writeln('O valor ', i, ' (', valor[i], ') e igual a media.');
  end;
end.
