program SomaVetor;
var
  valor: array[1..5] of Integer;
  i, soma: Integer;
begin
  soma := 0;
  for i := 1 to length(valor) do
  begin
    write('Digite um valor inteiro: ');
    readln(valor[i]);
    soma := soma + valor[i];
  end;
  writeln('A soma dos valores digitados e: ', soma);
end.
