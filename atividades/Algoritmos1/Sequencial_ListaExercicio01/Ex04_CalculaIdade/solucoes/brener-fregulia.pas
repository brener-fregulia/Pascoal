program CalculaIdade;
var
  nome: String;
  anos: Integer;
begin
  writeln('Digite seu nome:');
  readln(nome);
  writeln('Digite sua idade em anos:');
  readln(anos);
  writeln('Uau ', nome, ', voce possui ', (anos * 365), ' dias de vida.');
end.
