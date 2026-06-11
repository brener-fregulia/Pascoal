program ContaBar;
var
  valorTotal, valorFelipe: Real;
  valorInteiro: Integer;
begin
  write('Digite o valor total da conta: ');
  readln(valorTotal);
  valorInteiro := trunc(valorTotal / 3);
  valorFelipe := valorTotal - (valorInteiro * 2);
  writeln('Carlos deve pagar: ', valorInteiro);
  writeln('Andre  deve pagar: ', valorInteiro);
  writeln('Felipe deve pagar: ', valorFelipe:0:2);
end.
