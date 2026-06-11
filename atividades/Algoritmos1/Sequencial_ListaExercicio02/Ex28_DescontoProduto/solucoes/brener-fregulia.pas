program DescontoProduto;
var
  precoOriginal, desconto, novoPreco: Real;
begin
  writeln('Digite o preco do produto:');
  readln(precoOriginal);
  desconto := precoOriginal * 0.10;
  novoPreco := precoOriginal - desconto;
  writeln('O preco com desconto e: R$ ', novoPreco:0:2);
end.
