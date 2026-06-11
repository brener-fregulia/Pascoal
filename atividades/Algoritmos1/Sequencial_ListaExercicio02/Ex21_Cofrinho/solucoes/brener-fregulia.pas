program Cofrinho;
var
  qtd1, qtd5, qtd10, qtd25, qtd50, qtd1Real: Integer;
  total: Real;
begin
  writeln('Digite a quantidade de moedas de 1 centavo:');
  readln(qtd1);
  writeln('Digite a quantidade de moedas de 5 centavos:');
  readln(qtd5);
  writeln('Digite a quantidade de moedas de 10 centavos:');
  readln(qtd10);
  writeln('Digite a quantidade de moedas de 25 centavos:');
  readln(qtd25);
  writeln('Digite a quantidade de moedas de 50 centavos:');
  readln(qtd50);
  writeln('Digite a quantidade de moedas de 1 real:');
  readln(qtd1Real);
  total := (qtd1 * 0.01) + (qtd5 * 0.05) + (qtd10 * 0.10) + (qtd25 * 0.25) + (qtd50 * 0.50) + (qtd1Real * 1);
  writeln('O total economizado no cofrinho e R$ ', total:0:2);
end.
