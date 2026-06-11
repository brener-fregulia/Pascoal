program ComissaoFuncionario;
var
  salarioFixo, vendas, comissao, salarioFinal: Real;
begin
  writeln('Digite o salario fixo do funcionario:');
  readln(salarioFixo);
  writeln('Digite o valor das vendas realizadas:');
  readln(vendas);
  comissao := vendas * 0.04;
  salarioFinal := salarioFixo + comissao;
  writeln('A comissao do funcionario e: R$ ', comissao:0:2);
  writeln('O salario final do funcionario e: R$ ', salarioFinal:0:2);
end.
