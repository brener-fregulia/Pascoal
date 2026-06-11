program ConfeccaoBlusas;
var
  qtdBlusas: Integer;
  novelos: Real;
begin
  writeln('Digite quantas blusas precisam ser feitas:');
  readln(qtdBlusas);
  writeln('Digite a quantidade de novelos de la disponiveis:');
  readln(novelos);
  writeln('Serao gastos ', (qtdBlusas / novelos):0:2, ' novelos de la por blusa.');
end.
