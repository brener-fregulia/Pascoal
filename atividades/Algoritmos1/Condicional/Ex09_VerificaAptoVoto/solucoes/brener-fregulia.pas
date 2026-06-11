program VerificaAptoVoto;
var
  idade: Integer;
begin
  writeln('Digite sua idade:');
  readln(idade);
  if idade >= 18 then
    writeln('Voce esta apto a votar.')
  else
    writeln('Voce nao esta apto a votar.');
end.
