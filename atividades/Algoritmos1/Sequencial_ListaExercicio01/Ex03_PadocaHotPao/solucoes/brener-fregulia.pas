program PadocaHotPao;
const
  valPao: Real = 0.12;
  valBroa: Real = 1.50;
  taxaPoupanca: Real = 0.1;
var
  somaPao, somaBroa, somaTotal: Real;
  qtdPao, qtdBroa: Integer;
begin
  writeln('Digite a quantidade de paes vendidos no dia:');
  readln(qtdPao);
  writeln('Digite a quantidade de broas vendidas no dia:');
  readln(qtdBroa);
  somaPao := qtdPao * valPao;
  somaBroa := qtdBroa * valBroa;
  somaTotal := somaPao + somaBroa;
  writeln('O valor vendido em paes e ', somaPao:0:2, ' reais.');
  writeln('O valor vendido em broas e ', somaBroa:0:2, ' reais.');
  writeln('O valor total vendido e ', somaTotal:0:2, ' reais.');
  writeln('O valor reservado para poupanca deve ser de ', (somaTotal * taxaPoupanca):0:2, ' reais.');
end.
