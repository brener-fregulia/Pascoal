program PesoIdeal;
var
  genero: Integer;
  altura: Real;
begin
  writeln('Digite seu genero: "1" para Feminino e "0" para Masculino');
  readln(genero);
  writeln('Digite sua altura em metros:');
  readln(altura);
  if genero = 1 then
    writeln('Seu peso ideal e: ', ((62.1 * altura) - 44.7):0:2, ' kg')
  else
    writeln('Seu peso ideal e: ', ((72.7 * altura) - 58):0:2, ' kg');
end.
