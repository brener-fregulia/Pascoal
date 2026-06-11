program PesoPessoa;
var
  peso, pesoEngordar, pesoEmagrecer: Real;
begin
  writeln('Digite o peso da pessoa:');
  readln(peso);
  pesoEngordar := peso + (peso * 0.15);
  pesoEmagrecer := peso - (peso * 0.20);
  writeln('O novo peso se engordar 15%%: ', pesoEngordar:0:2, ' kg.');
  writeln('O novo peso se emagrecer 20%%: ', pesoEmagrecer:0:2, ' kg.');
end.
