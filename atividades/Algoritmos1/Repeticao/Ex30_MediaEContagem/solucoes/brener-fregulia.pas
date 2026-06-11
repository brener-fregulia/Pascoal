program MediaEContagem;
var
  i, num, soma, contadorIntervalo: Integer;
  media: Real;
begin
  soma := 0;
  contadorIntervalo := 0;
  for i := 1 to 10 do
  begin
    write('Digite o ', i, ' numero: ');
    readln(num);
    soma := soma + num;
    if (num > 10) and (num < 50) then
      contadorIntervalo := contadorIntervalo + 1;
  end;
  media := soma / 10.0;
  writeln('A media dos numeros lidos e: ', media:0:2);
  writeln('Quantidade de numeros entre 10 e 50 (exclusive): ', contadorIntervalo);
end.
