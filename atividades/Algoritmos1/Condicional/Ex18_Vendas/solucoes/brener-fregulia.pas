program Vendas;
var
  codigo: String;
  qtd: Integer;
begin
  writeln('Digite a quantidade do produto:');
  readln(qtd);
  writeln('Digite o codigo do produto:');
  readln(codigo);
  if codigo = 'ABCD' then
    writeln('Preco total: R$ ', (qtd * 5.3):0:2)
  else if codigo = 'XYPK' then
    writeln('Preco total: R$ ', (qtd * 6.0):0:2)
  else if codigo = 'KLMP' then
    writeln('Preco total: R$ ', (qtd * 3.2):0:2)
  else if codigo = 'QRST' then
    writeln('Preco total: R$ ', (qtd * 2.5):0:2)
  else
    writeln('Codigo invalido.');
end.
