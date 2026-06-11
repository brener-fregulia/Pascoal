program AlturaPredio;
var
  alturaPessoa, sombraPessoa, sombraPredio, alturaPredio: Real;
begin
  writeln('Digite sua altura em metros:');
  readln(alturaPessoa);
  writeln('Digite o comprimento da sua sombra em metros:');
  readln(sombraPessoa);
  writeln('Digite o comprimento da sombra do predio em metros:');
  readln(sombraPredio);
  alturaPredio := (alturaPessoa * sombraPredio) / sombraPessoa;
  writeln('A altura estimada do predio e ', alturaPredio:0:2, ' metros.');
end.
