program VendaCamisas;
const
  precoPequena: Real = 10;
  precoMedia: Real = 12;
  precoGrande: Real = 15;
var
  qtdPequena, qtdMedia, qtdGrande: Integer;
  total: Real;
begin
  writeln('Escreva quantas camisas pequenas foram vendidas:');
  readln(qtdPequena);
  writeln('Escreva quantas camisas medias foram vendidas:');
  readln(qtdMedia);
  writeln('Escreva quantas camisas grandes foram vendidas:');
  readln(qtdGrande);
  total := (precoPequena * qtdPequena) + (precoMedia * qtdMedia) + (precoGrande * qtdGrande);
  writeln('O valor total das vendas e de R$ ', total:0:2);
end.
